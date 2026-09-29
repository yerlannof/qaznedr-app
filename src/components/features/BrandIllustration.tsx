import Image from 'next/image';

const illustrations = {
  archive: {
    src: '/brand/archive-to-field-chalk-1536.webp',
    width: 1536,
    height: 1024,
    sizes: '(max-width: 560px) 170vw, (max-width: 1023px) 115vw, 900px',
  },
  cutaway: {
    src: '/brand/geology-cutaway-960.webp',
    width: 960,
    height: 480,
    sizes: '(max-width: 768px) 90vw, 550px',
  },
} as const;

export default function BrandIllustration({
  kind,
  className,
  priority = false,
  sizes,
}: {
  kind: keyof typeof illustrations;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const image = illustrations[kind];
  return (
    <Image
      src={image.src}
      alt=""
      width={image.width}
      height={image.height}
      sizes={sizes ?? image.sizes}
      priority={priority}
      className={className}
    />
  );
}
