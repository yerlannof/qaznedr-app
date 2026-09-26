import { ogTitleSize } from './og';

/** 1200×630 card in the current neutral style (until the approved design). */
export function ogCard({
  eyebrow,
  title,
  footer,
}: {
  eyebrow: string;
  title: string;
  footer: string;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 500,
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          marginBottom: '24px',
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: ogTitleSize(title),
          fontWeight: 700,
          color: '#111827',
          lineHeight: 1.15,
          letterSpacing: '-1px',
          maxWidth: '1040px',
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '80px',
          fontSize: 16,
          color: '#9CA3AF',
        }}
      >
        {footer}
      </div>
    </div>
  );
}
