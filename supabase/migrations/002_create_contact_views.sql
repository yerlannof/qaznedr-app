-- Contact views tracking for future monetization
CREATE TABLE IF NOT EXISTS contact_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id TEXT NOT NULL,
  listing_id TEXT,
  seller_id TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_views_viewer ON contact_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_contact_views_seller ON contact_views(seller_id);
