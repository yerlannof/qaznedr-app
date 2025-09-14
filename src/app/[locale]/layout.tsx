import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['ru', 'kz', 'en', 'zh'] as const;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure the locale is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Get messages for the locale
  let messages;
  try {
    messages = await getMessages({ locale });
  } catch (error) {
    console.error('Error loading messages for locale:', locale, error);
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
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