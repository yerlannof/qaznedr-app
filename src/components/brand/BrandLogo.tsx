import Image from 'next/image';

export default function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-block ${className}`}>
      <Image
        src="/brand/logo-horizontal.svg"
        alt="QAZNEDR HOLDING"
        width={640}
        height={150}
        className="block w-full h-auto dark:hidden"
      />
      <Image
        src="/brand/logo-horizontal-inverse.svg"
        alt="QAZNEDR HOLDING"
        width={640}
        height={150}
        className="hidden w-full h-auto dark:block"
      />
    </span>
  );
}
