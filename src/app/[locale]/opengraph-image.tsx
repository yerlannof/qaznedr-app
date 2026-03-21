import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'QAZNEDR — Платформа геологической отрасли Казахстана';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const titles: Record<string, string> = {
    ru: 'Платформа геологической\nотрасли Казахстана',
    kz: 'Қазақстанның геология\nсаласының платформасы',
    en: "Kazakhstan's Geology\nIndustry Platform",
    zh: '哈萨克斯坦\n地质行业平台',
  };

  const subtitles: Record<string, string> = {
    ru: 'Лицензии · Услуги · Компании · Данные',
    kz: 'Лицензиялар · Қызметтер · Компаниялар · Деректер',
    en: 'Licenses · Services · Companies · Data',
    zh: '许可证 · 服务 · 公司 · 数据',
  };

  const currentLocale = locale || 'ru';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            marginBottom: '24px',
          }}
        >
          QAZNEDR.KZ
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#111827',
            lineHeight: 1.1,
            letterSpacing: '-1px',
            whiteSpace: 'pre-line',
          }}
        >
          {titles[currentLocale] || titles.ru}
        </div>
        <div style={{ fontSize: 24, color: '#6B7280', marginTop: '24px' }}>
          {subtitles[currentLocale] || subtitles.ru}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '80px',
            fontSize: 16,
            color: '#9CA3AF',
          }}
        >
          qaznedr.kz
        </div>
      </div>
    ),
    { ...size }
  );
}
