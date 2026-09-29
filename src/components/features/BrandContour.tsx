export default function BrandContour({
  variant,
  className,
}: {
  variant: 'hero' | 'services';
  className?: string;
}) {
  return variant === 'hero' ? (
    <svg
      viewBox="0 0 260 170"
      className={className}
      data-brand-contour="hero"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M4 99c37-25 77-45 116-25s79-27 137-55M4 121c47-31 85-42 118-25s83-22 135-42M4 143c49-29 87-36 121-20s88-14 132-31" />
      </g>
    </svg>
  ) : (
    <svg
      viewBox="0 0 280 100"
      className={className}
      data-brand-contour="services"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M0 71c44-36 64-26 97-51s61 20 91 8 41 12 92 3M0 82c40-29 69-27 103-43s56 12 86 5 52 9 91 0M0 91c38-20 67-22 109-33s51 8 82 4 55 6 89-2" />
      </g>
      <path d="M14 94h28" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
