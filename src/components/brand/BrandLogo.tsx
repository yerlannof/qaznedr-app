import Image from 'next/image';

export default function BrandLogo({
  className = '',
  inverse = false,
}: {
  className?: string;
  /** Force the chalk logo, e.g. on a photo or video. */
  inverse?: boolean;
}) {
  return (
    <span className={`inline-block ${className}`}>
      <Image
        src="/brand/logo-horizontal.svg"
        alt="QAZNEDR HOLDING"
        width={640}
        height={150}
        className={`block w-full h-auto dark:hidden ${inverse ? '!hidden' : ''}`}
      />
      <Image
        src="/brand/logo-horizontal-inverse.svg"
        alt="QAZNEDR HOLDING"
        width={640}
        height={150}
        className={`w-full h-auto ${inverse ? '!block' : 'hidden dark:block'}`}
      />
    </span>
  );
}
