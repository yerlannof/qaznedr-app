import Image from 'next/image';
import { FileText } from 'lucide-react';

/**
 * A scan fragment exactly as delivered: no re-encoding (unoptimized), no crop,
 * no overlay; space reserved from the real size, never wider than 2x.
 */
export default function ScanFigure({
  url,
  v,
  width,
  height,
  caption,
  captionLang,
  openLabel,
}: {
  url: string;
  v: string;
  width: number;
  height: number;
  caption: string;
  captionLang?: string;
  openLabel: string;
}) {
  const src = `${url}?v=${v}`;
  return (
    <figure className="m-0">
      <a
        href={src}
        target="_blank"
        rel="noopener"
        aria-label={openLabel}
        className="brand-focus block overflow-hidden border border-brand-line bg-white"
        style={{ maxWidth: `min(100%, ${width * 2}px)` }}
      >
        <Image
          src={src}
          width={width}
          height={height}
          alt={caption}
          unoptimized
          sizes="(max-width: 1264px) 100vw, 1200px"
          className="block h-auto w-full"
        />
      </a>
      <figcaption
        lang={captionLang}
        className="mt-2 flex items-center gap-2 text-sm text-brand-muted"
      >
        <FileText aria-hidden className="size-4 shrink-0" />
        {caption}
      </figcaption>
    </figure>
  );
}
