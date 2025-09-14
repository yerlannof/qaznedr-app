import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

// Define locales directly to avoid build issues
const locales = ['ru', 'kz', 'en', 'zh'] as const;

export default async function MinimalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate the locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
            <h1>Minimal Layout Test</h1>
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}