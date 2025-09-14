export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale}>
      <body>
        <h1>Test Page - Locale: {locale}</h1>
        <div>
          {children}
        </div>
      </body>
    </html>
  );
}