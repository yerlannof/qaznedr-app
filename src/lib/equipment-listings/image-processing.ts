import 'server-only';

import sharp from 'sharp';

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_PIXELS = 24_000_000;

export class ImageInputError extends Error {
  constructor(public readonly code: 'INVALID' | 'TOO_LARGE' | 'UNSUPPORTED') {
    super(code);
    this.name = 'ImageInputError';
  }
}

type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

function detectFormat(input: Buffer): ImageMime | null {
  if (
    input.length >= 3 &&
    input[0] === 0xff &&
    input[1] === 0xd8 &&
    input[2] === 0xff
  )
    return 'image/jpeg';
  if (
    input.length >= 8 &&
    input.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
  )
    return 'image/png';
  if (
    input.length >= 12 &&
    input.toString('ascii', 0, 4) === 'RIFF' &&
    input.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'image/webp';
  return null;
}

function hasPngAnimation(input: Buffer): boolean {
  // libvips can expose only the first frame of APNG, without metadata.pages.
  // Inspect the actual PNG chunk structure rather than searching arbitrary bytes.
  let offset = 8;
  while (offset + 12 <= input.length) {
    const length = input.readUInt32BE(offset);
    if (length > input.length - offset - 12)
      throw new ImageInputError('INVALID');
    if (input.toString('ascii', offset + 4, offset + 8) === 'acTL') return true;
    offset += length + 12;
  }
  return false;
}

export async function processEquipmentImage(
  input: Buffer,
  mime: string
): Promise<{ buffer: Buffer; width: number; height: number }> {
  if (input.length > MAX_IMAGE_BYTES) throw new ImageInputError('TOO_LARGE');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime))
    throw new ImageInputError('UNSUPPORTED');
  if (detectFormat(input) !== mime) throw new ImageInputError('INVALID');
  if (mime === 'image/png' && hasPngAnimation(input))
    throw new ImageInputError('INVALID');

  try {
    const options = {
      failOn: 'warning' as const,
      limitInputPixels: MAX_PIXELS,
      pages: 1,
    };
    const metadata = await sharp(input, options).metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > MAX_PIXELS ||
      (metadata.pages ?? 1) !== 1 ||
      `image/${metadata.format}` !== mime
    )
      throw new ImageInputError('INVALID');

    const { data, info } = await sharp(input, options)
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .timeout({ seconds: 5 })
      .toBuffer({ resolveWithObject: true });
    if (data.length > MAX_IMAGE_BYTES) throw new ImageInputError('TOO_LARGE');
    return { buffer: data, width: info.width, height: info.height };
  } catch (error) {
    if (error instanceof ImageInputError) throw error;
    throw new ImageInputError('INVALID');
  }
}
