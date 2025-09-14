import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { locales } from '@/i18n/config';

// Temporarily use dynamic rendering to avoid build issues
// export function generateStaticParams() {
//   return locales.map((locale) => ({ locale }));
// }

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }
  
  // Load messages directly
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <NextIntlClientProvider 
      locale={locale}
      messages={messages}
    >
      <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
        <h1>QAZNEDR.KZ - {locale.toUpperCase()}</h1>
        <nav style={{ marginBottom: '20px' }}>
          <a href="/ru" style={{ marginRight: '10px' }}>RU</a>
          <a href="/kz" style={{ marginRight: '10px' }}>KZ</a>
          <a href="/en" style={{ marginRight: '10px' }}>EN</a>
          <a href="/zh">ZH</a>
        </nav>
        <main>{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}