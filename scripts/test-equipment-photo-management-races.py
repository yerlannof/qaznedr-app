"""Real concurrent transactions against an isolated, migrated PostgreSQL fixture.

Usage: python3 scripts/test-equipment-photo-management-races.py DATABASE_NAME
The caller creates/drops the dedicated fixture; never run against production.
"""

import json
import subprocess
import sys
import time
import uuid


def main():
    database = sys.argv[1]
    if not database.startswith("qaznedr_photo_management_"):
        raise SystemExit("Use a dedicated qaznedr_photo_management_ fixture database")

    def command(sql):
        return ["psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-v",
                "VERBOSITY=verbose", "-d", database, "-c", sql]

    def run(sql):
        result = subprocess.run(command(sql), capture_output=True, text=True, check=True)
        return result.stdout.strip()

    def wait_for(predicate, description):
        until = time.monotonic() + 3
        while time.monotonic() < until:
            if run(predicate) == "t":
                return
            time.sleep(0.025)
        raise AssertionError(description)

    results = []
    for case in ["delete_first", "reorder_first", "approval_first", "preview_first", "noop_first"]:
        listing, owner = str(uuid.uuid4()), str(uuid.uuid4())
        images = [str(uuid.uuid4()) for _ in range(3)]
        run(f"SET ROLE service_role; INSERT INTO public.equipment_listings(id,owner_id,status) VALUES('{listing}','{owner}','PENDING_MODERATION');")
        for position, image in enumerate(images):
            path = f"{listing}/{image}.webp"
            run(f"SET ROLE service_role; INSERT INTO storage.objects(bucket_id,name) VALUES('equipment-images','{path}');"
                f"INSERT INTO public.equipment_listing_images(id,listing_id,storage_path,width,height,bytes,position) VALUES('{image}','{listing}','{path}',100,100,3,{position});")
        delete = f"SELECT public.remove_equipment_image('{listing}','{owner}',1,'{images[1]}');"
        reorder = f"SELECT public.reorder_equipment_images('{listing}','{owner}',1,ARRAY['{images[2]}','{images[0]}','{images[1]}']::uuid[]);"
        approve = f"SELECT public.transition_equipment_listing('{listing}','{owner}','PENDING_MODERATION',1,'ACTIVE',2,'{{}}',NULL,'env-admin:fixture@example.test');"
        snapshot = f"SELECT public.equipment_moderation_images('{listing}',1);"
        noop = f"SELECT public.reorder_equipment_images('{listing}','{owner}',1,ARRAY['{images[0]}','{images[1]}','{images[2]}']::uuid[]);"
        first, second = {
            "delete_first": (delete, approve),
            "reorder_first": (reorder, approve),
            "approval_first": (approve, delete),
            "preview_first": (snapshot, delete),
            "noop_first": (noop, approve),
        }[case]
        # The first RPC has finished and holds its parent lock while sleeping.
        # The observer verifies PgSleep and the second connection's real Lock wait.
        app_a, app_b = f"qaznedr_race_a_{case}", f"qaznedr_race_b_{case}"
        a_command = command(f"SET application_name='{app_a}'; BEGIN; SET LOCAL ROLE service_role;")
        # Separate -c arguments retain the snapshot result (psql prints only
        # the final result of a multi-statement -c string).
        a_command.extend(["-c", first, "-c", "SELECT pg_sleep(1.2);", "-c", "COMMIT;"])
        a = subprocess.Popen(a_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        b = None
        try:
            wait_for(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='{app_a}' AND wait_event='PgSleep');", "first RPC did not retain its transaction lock")
            b = subprocess.Popen(command(f"SET application_name='{app_b}'; SET statement_timeout='5s'; SET ROLE service_role; {second}"), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            wait_for(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='{app_b}' AND wait_event_type='Lock');", "second RPC did not block on the listing lock")
            a_output, a_error = a.communicate(timeout=8)
            b_output, b_error = b.communicate(timeout=8)
            assert a.returncode == 0, a_error
            succeeds = case in ["preview_first", "noop_first"]
            assert (b.returncode == 0) == succeeds, b_error or b_output
            if not succeeds:
                assert "40001" in b_error, b_error
            state = json.loads(run(f"SELECT jsonb_build_object('status',status,'revision',revision,'images',(SELECT jsonb_agg(id ORDER BY position) FROM public.equipment_listing_images WHERE listing_id='{listing}'),'positions',(SELECT jsonb_agg(position ORDER BY position) FROM public.equipment_listing_images WHERE listing_id='{listing}'),'events',(SELECT count(*) FROM public.equipment_moderation_events WHERE listing_id='{listing}'),'queued',(SELECT count(*) FROM public.equipment_image_deletions WHERE listing_id='{listing}'),'objects',(SELECT count(*) FROM storage.objects WHERE bucket_id='equipment-images' AND name LIKE '{listing}/%')) FROM public.equipment_listings WHERE id='{listing}';"))
            assert state["revision"] == 2 and state["events"] == 1, state
            assert state["objects"] == 3, "physical deletion must remain deferred"
            if case in ["delete_first", "preview_first"]:
                assert state["status"] == "PENDING_MODERATION" and state["images"] == [images[0], images[2]] and state["positions"] == [0, 1] and state["queued"] == 1, state
            elif case == "reorder_first":
                assert state["status"] == "PENDING_MODERATION" and state["images"] == [images[2], images[0], images[1]] and state["queued"] == 0, state
            else:
                assert state["status"] == "ACTIVE" and state["images"] == images and state["queued"] == 0, state
            if case == "preview_first":
                viewed = json.loads(a_output.splitlines()[0])
                assert viewed["revision"] == 1 and [row["id"] for row in viewed["images"]] == images, viewed
            results.append({"case": case, "second_waited_for_parent_lock": True,
                            "second": "success" if succeeds else "40001", "state": state})
        finally:
            for process in [a, b]:
                if process is not None and process.poll() is None:
                    process.kill()
                    process.communicate()
    print(json.dumps({"passed": len(results), "races": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
