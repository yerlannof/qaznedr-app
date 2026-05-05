-- Admin role hierarchy on profiles
-- 'user'        — regular user (default)
-- 'admin'       — moderator: can manage all listings (CRUD, status, featured)
-- 'super_admin' — owner: admin powers + can manage user roles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin', 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role)
  WHERE role IN ('admin', 'super_admin');

-- DELETED status for soft-deleted listings
ALTER TABLE kazakhstan_deposits
  DROP CONSTRAINT IF EXISTS kazakhstan_deposits_status_check;

ALTER TABLE kazakhstan_deposits
  ADD CONSTRAINT kazakhstan_deposits_status_check
  CHECK (status IN (
    'ACTIVE', 'PENDING', 'PENDING_MODERATION', 'REJECTED',
    'SOLD', 'EXPIRED', 'DRAFT', 'DELETED'
  ));
