// Faint tiled watermark over gated content (buyer email + token) — traceability.
export default function LeadWatermark({ label }: { label: string }) {
  const tiles = Array.from({ length: 80 });
  return (
    <div
      aria-hidden
      className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
    >
      <div className="absolute -inset-1/4 flex flex-wrap gap-x-16 gap-y-12 -rotate-[30deg] opacity-[0.05]">
        {tiles.map((_, i) => (
          <span
            key={i}
            className="whitespace-nowrap text-[11px] font-mono text-gray-900 dark:text-gray-100"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
