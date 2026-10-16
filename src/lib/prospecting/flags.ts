/**
 * Prospecting plots on the public site: list, plot pages, catalogue cards,
 * home cards and sitemap entries. Off since 2026-10-16 (owner: «убрать пока
 * что»); set PROSPECTING_ENABLED=true to bring them back.
 */
export const prospectingEnabled = () =>
  process.env.PROSPECTING_ENABLED === 'true';
