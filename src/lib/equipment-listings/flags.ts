/** Public catalogue, listing pages, sitemap entries and menu item. */
export const equipmentCatalogEnabled = () =>
  process.env.EQUIPMENT_MARKETPLACE_ENABLED === 'true' &&
  process.env.EQUIPMENT_CATALOG_ENABLED === 'true';
