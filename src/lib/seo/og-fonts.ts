import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const font = (file: string) =>
  new Uint8Array(
    readFileSync(path.join(process.cwd(), 'public/brand/fonts', file))
  ).buffer;

// Supply Latin/Cyrillic/Kazakh and Chinese locally. ImageResponse otherwise
// attempts Google Fonts for missing glyphs during builds and live requests.
function readOgFonts() {
  return [
    {
      name: 'Plex',
      data: font('IBMPlexSans-Regular.ttf'),
      weight: 400 as const,
      style: 'normal' as const,
    },
    {
      name: 'Plex',
      data: font('IBMPlexSans-SemiBold.ttf'),
      weight: 600 as const,
      style: 'normal' as const,
    },
    {
      name: 'NotoSC',
      data: font('NotoSansSC-OG-Regular.ttf'),
      weight: 400 as const,
      style: 'normal' as const,
    },
    {
      name: 'NotoSC',
      data: font('NotoSansSC-OG-Bold.ttf'),
      weight: 700 as const,
      style: 'normal' as const,
    },
  ];
}

let cached: ReturnType<typeof readOgFonts> | undefined;

/** Next imports image metadata during ordinary page rendering too. Read files
 * only when generating the image, whose server trace contains these assets. */
export function getOgFonts() {
  return (cached ??= readOgFonts());
}
