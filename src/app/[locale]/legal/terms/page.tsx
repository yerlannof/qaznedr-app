import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import { buildTranslatedPageMetadata } from '@/lib/seo/metadata';
import { termsFor } from '@/lib/content/terms';
import { HREFLANG, toLocale } from '@/lib/seo/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildTranslatedPageMetadata(locale, '/legal/terms', 'terms');
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = toLocale((await params).locale);
  const terms = termsFor(locale);

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-brand-bg text-brand-ink pt-20 lg:pt-24">
        <section
          lang={HREFLANG[locale]}
          className="brand-container max-w-[760px] pt-12 pb-16 lg:pt-16 lg:pb-24"
        >
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold uppercase text-brand-muted">
              {terms.eyebrow}
            </span>
          </div>
          <h1 className="font-serif font-light text-4xl lg:text-5xl tracking-tight text-brand-ink leading-[1.05]">
            {terms.heading}
          </h1>
          <p className="mt-4 text-sm text-brand-muted">{terms.updated}</p>

          <div className="mt-12 space-y-12">
            {terms.sections.map(({ heading, body }) => (
              <section key={heading}>
                <h2 className="font-serif text-2xl lg:text-3xl text-brand-ink tracking-tight mb-4">
                  {heading}
                </h2>
                <div className="space-y-4">
                  {body.map((p, i) => (
                    <p
                      key={i}
                      className="text-base text-brand-muted leading-relaxed"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
            <section>
              <h2 className="font-serif text-2xl lg:text-3xl text-brand-ink tracking-tight mb-4">
                {terms.contactHeading}
              </h2>
              <p className="text-base text-brand-muted leading-relaxed">
                {terms.contactBeforeLink}
                <Link
                  href={`/${locale}/contact`}
                  className="brand-focus text-brand-ink underline underline-offset-4 decoration-brand-line hover:text-brand-muted"
                >
                  {terms.contactLink}
                </Link>
                {terms.contactAfterLink}
              </p>
            </section>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
