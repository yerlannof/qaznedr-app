import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'QAZNEDR Listing';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  let title = 'Объявление';
  let region = '';
  let price = '';
  let typeLabel = '';

  try {
    const res = await fetch(`https://qaznedr.kz/api/listings/${id}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const listing = data?.data || data;

    title = listing?.title || 'Объявление';
    region = listing?.region || '';
    price = listing?.price ? `₸ ${Number(listing.price).toLocaleString()}` : '';

    const typeLabels: Record<string, string> = {
      MINING_LICENSE: 'Горнодобывающая лицензия',
      EXPLORATION_LICENSE: 'Участок разведки',
      MINERAL_OCCURRENCE: 'Минеральное проявление',
    };
    typeLabel = typeLabels[listing?.type] || '';
  } catch {
    // Use defaults if fetch fails
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '16px',
            }}
          >
            {typeLabel}
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.2,
              letterSpacing: '-0.5px',
            }}
          >
            {title.length > 60 ? title.slice(0, 60) + '...' : title}
          </div>
          {region && (
            <div style={{ fontSize: 24, color: '#6B7280', marginTop: '16px' }}>
              {region}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          {price ? (
            <div style={{ fontSize: 36, fontWeight: 700, color: '#111827' }}>
              {price}
            </div>
          ) : (
            <div />
          )}
          <div style={{ fontSize: 16, color: '#9CA3AF' }}>qaznedr.kz</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
