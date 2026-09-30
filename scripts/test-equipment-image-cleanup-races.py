"""Real races in a disposable, fully migrated local PostgreSQL fixture only.

Usage: python3 scripts/test-equipment-image-cleanup-races.py DATABASE_NAME
"""
import subprocess
import sys
import time
import uuid


def main():
    database = sys.argv[1]
    if not database.startswith("qaznedr_photo_management_cleanup_"):
        raise SystemExit("Use a dedicated cleanup fixture database")

    def command(sql):
        return ["psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-v",
                "VERBOSITY=verbose", "-d", database, "-c", sql]

    def run(sql):
        return subprocess.run(command(sql), capture_output=True, text=True, check=True).stdout.strip()

    def wait_for(predicate):
        deadline = time.monotonic() + 4
        while time.monotonic() < deadline:
            if run(predicate) == "t":
                return
            time.sleep(0.025)
        raise AssertionError("Expected PostgreSQL transaction state was not reached")

    for case in ["two_claims", "attachment_first", "queue_first",
                 "cross_attachment_first", "cross_queue_first"]:
        listing, image, owner = str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())
        path = f"{listing}/{image}.webp"
        run(f"SET ROLE service_role; INSERT INTO public.equipment_listings(id,owner_id) VALUES('{listing}','{owner}');")
        other_listing = str(uuid.uuid4())
        if case.startswith("cross_"):
            run(f"SET ROLE service_role; INSERT INTO public.equipment_listings(id,owner_id) VALUES('{other_listing}','{owner}');")
        if case == "two_claims":
            run(f"SET ROLE service_role; INSERT INTO public.equipment_image_deletions(image_id,listing_id,storage_path) VALUES('{image}','{listing}','{path}');")
            first = "SELECT image_id FROM public.claim_equipment_image_deletions(1,60);"
            second = "SELECT image_id FROM public.claim_equipment_image_deletions(1,60);"
        else:
            attachment_listing = other_listing if case.startswith("cross_") else listing
            attachment_path = f"{attachment_listing}/{image}.webp"
            attach = ("INSERT INTO public.equipment_listing_images(id,listing_id,storage_path,width,height,bytes,position) "
                      f"VALUES('{image}','{attachment_listing}','{attachment_path}',100,100,3,0);")
            queue = ("INSERT INTO public.equipment_image_deletions(image_id,listing_id,storage_path) "
                     f"VALUES('{image}','{listing}','{path}');")
            first, second = (attach, queue) if case in ["attachment_first", "cross_attachment_first"] else (queue, attach)

        app_a, app_b = f"qaznedr_cleanup_a_{case}", f"qaznedr_cleanup_b_{case}"
        a_command = command(f"SET application_name='{app_a}'; BEGIN; SET LOCAL ROLE service_role;")
        a_command.extend(["-c", first, "-c", "SELECT pg_sleep(1.2);", "-c", "COMMIT;"])
        a = subprocess.Popen(a_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        b = None
        try:
            wait_for(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='{app_a}' AND wait_event='PgSleep');")
            b = subprocess.Popen(command(f"SET application_name='{app_b}'; SET statement_timeout='5s'; SET ROLE service_role; {second}"),
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if case == "two_claims":
                b_output, b_error = b.communicate(timeout=3)
                assert b.returncode == 0 and b_output.strip() == "", b_error or b_output
            else:
                wait_for(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='{app_b}' AND wait_event_type='Lock');")
            a_output, a_error = a.communicate(timeout=8)
            assert a.returncode == 0, a_error
            if case != "two_claims":
                b_output, b_error = b.communicate(timeout=8)
                assert b.returncode != 0 and "23514" in b_error, b_error or b_output
            if case == "two_claims":
                assert image in a_output, a_output
                assert run(f"SELECT attempts FROM public.equipment_image_deletions WHERE image_id='{image}';") == "1"
            elif case in ["attachment_first", "cross_attachment_first"]:
                assert run(f"SELECT count(*) FROM public.equipment_listing_images WHERE id='{image}';") == "1"
                assert run(f"SELECT count(*) FROM public.equipment_image_deletions WHERE image_id='{image}';") == "0"
            else:
                assert run(f"SELECT count(*) FROM public.equipment_listing_images WHERE id='{image}';") == "0"
                assert run(f"SELECT count(*) FROM public.equipment_image_deletions WHERE image_id='{image}';") == "1"
            print(f"PASS {case}")
        finally:
            for process in [a, b]:
                if process is not None and process.poll() is None:
                    process.kill()
                    process.communicate()

    for isolation in ["REPEATABLE READ", "SERIALIZABLE"]:
        listing, image, owner = str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())
        path = f"{listing}/{image}.webp"
        run(f"SET ROLE service_role; INSERT INTO public.equipment_listings(id,owner_id) VALUES('{listing}','{owner}');")
        statement = (f"BEGIN ISOLATION LEVEL {isolation}; SET LOCAL ROLE service_role; "
                     "INSERT INTO public.equipment_image_deletions(image_id,listing_id,storage_path) "
                     f"VALUES('{image}','{listing}','{path}');")
        result = subprocess.run(command(statement), capture_output=True, text=True)
        assert result.returncode != 0 and "0A000" in result.stderr, result.stderr
        assert run(f"SELECT count(*) FROM public.equipment_image_deletions WHERE image_id='{image}';") == "0"
        print(f"PASS unsupported {isolation}")


if __name__ == "__main__":
    main()
