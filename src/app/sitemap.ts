import { MetadataRoute } from 'next';

// Stable build-time date to avoid lastModified churn on every deploy.
const BUILD_DATE = new Date('2026-05-31');

const baseUrl = 'https://qaznedr.kz';
const locales = ['ru', 'kz', 'en', 'zh'] as const;

// hreflang codes: kz uses ISO 'kk'
const hreflangFor = (locale: string) => (locale === 'kz' ? 'kk' : locale);

// Build alternates.languages map for a given page path (without locale prefix).
function languagesFor(page: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[hreflangFor(l)] = `${baseUrl}/${l}${page}`;
  }
  languages['x-default'] = `${baseUrl}/ru${page}`;
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages (no /favorites — user-private)
  const staticPages = [
    '',
    '/leads',
    '/listings',
    '/services',
    '/services/catalog',
    '/services/geological',
    '/services/legal',
    '/services/equipment',
    '/services/investors',
    '/companies',
    '/blog',
    '/education',
    '/news',
    '/knowledge',
    '/map',
    '/about',
    '/support',
    '/legal/terms',
    '/faq',
  ];
  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1.0 : 0.8,
      alternates: { languages: languagesFor(page) },
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

    listingEntries = allDeposits.flatMap((deposit) => {
      const lastModified = new Date(
        deposit.updatedAt || deposit.createdAt || BUILD_DATE
      );
      return locales.map((locale) => ({
        url: `${baseUrl}/${locale}/listings/${deposit.id}`,
        lastModified,
        changeFrequency: 'daily' as const,
        priority: 0.9,
        alternates: { languages: languagesFor(`/listings/${deposit.id}`) },
      }));
    });
  } catch {
    // If API is unavailable, return only static entries
  }

  // Dynamic PUBLISHED lead teasers (NOT /full — that is noindex)
  let leadEntries: MetadataRoute.Sitemap = [];
  try {
    let codes: { code: string }[] = [];
    let lpage = 1;
    let lhasMore = true;
    while (lhasMore) {
      const res = await fetch(`${baseUrl}/api/leads?limit=50&page=${lpage}`, {
        next: { revalidate: 3600 },
      });
      const data = await res.json();
      if (data.success && data.data?.leads?.length) {
        codes = [
          ...codes,
          ...data.data.leads.map((l: { code: string }) => ({ code: l.code })),
        ];
        lhasMore = lpage < (data.data.totalPages ?? 1);
        lpage++;
      } else {
        lhasMore = false;
      }
    }
    leadEntries = codes.flatMap((l) =>
      locales.map((locale) => ({
        url: `${baseUrl}/${locale}/leads/${l.code}`,
        lastModified: BUILD_DATE,
        changeFrequency: 'daily' as const,
        priority: 0.9,
        alternates: { languages: languagesFor(`/leads/${l.code}`) },
      }))
    );
  } catch {
    // If API is unavailable, skip lead entries
  }

  return [...staticEntries, ...listingEntries, ...leadEntries];
}
