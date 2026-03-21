import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://qaznedr.kz';
  const locales = ['ru', 'kz', 'en', 'zh'];

  // Static pages
  const staticPages = [
    '',
    '/listings',
    '/services',
    '/services/catalog',
    '/services/geological',
    '/services/legal',
    '/services/equipment',
    '/services/investors',
    '/companies',
    '/news',
    '/knowledge',
    '/favorites',
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

  // Dynamic listing pages - fetch ALL listings from Supabase via API
  let listingEntries: MetadataRoute.Sitemap = [];
  try {
    let allDeposits: { id: string; updatedAt?: string; createdAt?: string }[] =
      [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `${baseUrl}/api/listings?limit=100&page=${page}`,
        {
          next: { revalidate: 3600 },
        }
      );
      const data = await res.json();
      if (data.success && data.data?.deposits) {
        allDeposits = [...allDeposits, ...data.data.deposits];
        hasMore = data.data.pagination?.hasNext ?? false;
        page++;
      } else {
        hasMore = false;
      }
    }

    listingEntries = allDeposits.flatMap((deposit) =>
      locales.map((locale) => ({
        url: `${baseUrl}/${locale}/listings/${deposit.id}`,
        lastModified: new Date(
          deposit.updatedAt || deposit.createdAt || new Date()
        ),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }))
    );
  } catch {
    // If API is unavailable, return only static entries
  }

  return [...staticEntries, ...listingEntries];
}
