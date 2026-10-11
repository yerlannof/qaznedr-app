import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import ProspectingDetail from '@/components/prospecting/ProspectingDetail';
import { getContactConfig } from '@/lib/config/contacts';
import { getPublicPlot, listPublicPlots } from '@/lib/prospecting/plots';
import { plotJsonLd, plotPath, plotSeoText } from '@/lib/prospecting/present';
import { translate } from '@/lib/i18n/translations';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { LOCALES, toLocale } from '@/lib/seo/site';

// Static data: every published plot is prerendered in four languages.
// Unknown or hidden codes render notFound().
export function generateStaticParams() {
  return listPublicPlots().flatMap((plot) =>
    LOCALES.map((locale) => ({ locale, code: plot.code }))
  );
}

type Params = Promise<{ locale: string; code: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale: raw, code } = await params;
  const locale = toLocale(raw);
  const plot = getPublicPlot(code);
  if (!plot) {
    return {
      title: translate(locale, 'seo.lead.notFound'),
      robots: { index: false, follow: false },
    };
  }
  return buildPageMetadata({
    locale,
    path: plotPath(plot.code),
    ...plotSeoText(plot, locale),
  });
}

export default async function ProspectingPlotPage({
  params,
}: {
  params: Params;
}) {
  const { locale: raw, code } = await params;
  const locale = toLocale(raw);
  const plot = getPublicPlot(code);
  if (!plot) notFound();
  const { place, breadcrumb } = plotJsonLd(plot, locale);
  return (
    <>
      <Navigation />
      <div className="bg-brand-bg text-brand-ink pt-20 lg:pt-24">
        <ProspectingDetail
          plot={plot}
          locale={locale}
          contacts={getContactConfig()}
        />
      </div>
      <Footer />
      {[place, breadcrumb].map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
