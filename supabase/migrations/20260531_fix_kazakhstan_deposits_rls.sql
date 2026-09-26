-- Fix overly-permissive SELECT RLS on kazakhstan_deposits.
--
-- The original policy ("Public deposits are viewable by everyone", USING (true))
-- let the anon key read DRAFT/PENDING/SOLD/etc. rows — including owner_id,
-- license_number, coordinates and documents — for listings that are not public.
--
-- Every legitimate read path already restricts to ACTIVE:
--   * /api/listings + /api/listings/[id] filter status = 'ACTIVE'
--   * ListingsMap (browser anon client) queries .eq('status','ACTIVE')
--   * Owner/admin reads of drafts use the service-role client, which bypasses RLS.
-- So enforcing status = 'ACTIVE' at the RLS layer is defense-in-depth with no
-- functional regression.

DROP POLICY IF EXISTS "Public deposits are viewable by everyone" ON kazakhstan_deposits;
DROP POLICY IF EXISTS "Allow public read access" ON kazakhstan_deposits;

CREATE POLICY "Public can view active deposits" ON kazakhstan_deposits
  FOR SELECT USING (status = 'ACTIVE');
