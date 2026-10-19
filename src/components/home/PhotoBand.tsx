import Image from 'next/image';

/** Full-bleed photo section with a dark scrim; children sit on top. */
export default function PhotoBand({
  src,
  label,
  children,
  className = '',
  labelledBy,
}: {
  src: string;
  /** Visible «Иллюстрация» label: the photo is generated, not an area. */
  label: string;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section className={`photo-band ${className}`} aria-labelledby={labelledBy}>
      <Image src={src} alt="" fill sizes="100vw" className="object-cover" />
      <div className="photo-band-scrim" aria-hidden="true" />
      <div className="relative z-[1] brand-container py-24 md:py-32 lg:py-44">
        {children}
      </div>
      <span className="absolute z-[1] right-5 bottom-3 text-[11px] text-brand-chalk/55">
        {label}
      </span>
    </section>
  );
}
