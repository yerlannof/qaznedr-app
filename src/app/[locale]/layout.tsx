import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

// Define locales directly to avoid build issues
const locales = ['ru', 'kz', 'en', 'zh'] as const;

// Temporarily disable static generation to fix deployment
// export function generateStaticParams() {
//   return locales.map((locale) => ({ locale }));
// }

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default async function LocaleLayout({
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
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}