import { ogTitleSize } from './og';

/** 1200×630 card in the approved D2 palette, using local Latin/CJK fonts. */
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
        backgroundColor: '#253740',
        fontFamily: 'Plex, NotoSC',
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 400,
          color: '#CAD2CA',
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
          fontWeight: 600,
          color: '#E9ECE6',
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
          color: '#CAD2CA',
        }}
      >
        {footer}
      </div>
    </div>
  );
}
