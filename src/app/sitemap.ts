import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://qaznedr.vercel.app';
  const locales = ['ru', 'kz', 'en', 'zh'];

  // Static pages
  const staticPages = [
    '',
    '/listings',
    '/services',
    '/services/catalog',
    '/map',
  ];
  const staticEntries = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1.0 : 0.8,
    }))
  );

  // Dynamic listing pages - fetch from Supabase via API
  let listingEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${baseUrl}/api/listings?limit=100`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    if (data.success && data.data?.deposits) {
      listingEntries = data.data.deposits.flatMap(
        (deposit: { id: string; updatedAt?: string; createdAt?: string }) =>
          locales.map((locale) => ({
            url: `${baseUrl}/${locale}/listings/${deposit.id}`,
            lastModified: new Date(
              deposit.updatedAt || deposit.createdAt || new Date()
            ),
            changeFrequency: 'daily' as const,
            priority: 0.9,
          }))
      );
    }
  } catch {
    // If API is unavailable, return only static entries
  }

  return [...staticEntries, ...listingEntries];
}
