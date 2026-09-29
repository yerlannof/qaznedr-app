/** @jest-environment node */
jest.mock('server-only', () => ({}));

import sharp from 'sharp';
import {
  MAX_IMAGE_BYTES,
  ImageInputError,
  processEquipmentImage,
} from '@/lib/equipment-listings/image-processing';

const expectCode = async (input: Buffer, mime: string, code: string) => {
  await expect(processEquipmentImage(input, mime)).rejects.toMatchObject({
    code,
  });
};

it('normalizes a real JPEG to bounded WebP without EXIF metadata', async () => {
  const jpeg = await sharp({
    create: { width: 1800, height: 900, channels: 3, background: '#f00' },
  })
    .jpeg()
    .withExif({ IFD0: { Artist: 'private photographer' } })
    .toBuffer();
  const result = await processEquipmentImage(jpeg, 'image/jpeg');
  const metadata = await sharp(result.buffer).metadata();
  expect(result.width).toBe(1600);
  expect(result.height).toBe(800);
  expect(metadata.format).toBe('webp');
  expect(metadata.exif).toBeUndefined();
  expect(result.buffer.length).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
});

it('accepts PNG and WebP and does not enlarge a small image', async () => {
  for (const [format, mime] of [
    ['png', 'image/png'],
    ['webp', 'image/webp'],
  ] as const) {
    const source = await sharp({
      create: { width: 80, height: 40, channels: 3, background: '#0f0' },
    })
      .toFormat(format)
      .toBuffer();
    const result = await processEquipmentImage(source, mime);
    expect([result.width, result.height]).toEqual([80, 40]);
    expect((await sharp(result.buffer).metadata()).format).toBe('webp');
  }
});

it('applies EXIF orientation while stripping the orientation tag', async () => {
  const sideways = await sharp({
    create: { width: 10, height: 20, channels: 3, background: '#f00' },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const result = await processEquipmentImage(sideways, 'image/jpeg');
  expect([result.width, result.height]).toEqual([20, 10]);
  expect((await sharp(result.buffer).metadata()).orientation).toBeUndefined();
});

it('rejects MIME spoofing and non-raster input before decoding', async () => {
  const png = await sharp({
    create: { width: 2, height: 2, channels: 3, background: '#fff' },
  })
    .png()
    .toBuffer();
  await expectCode(png, 'image/jpeg', 'INVALID');
  await expectCode(Buffer.from('ffd8ff000000', 'hex'), 'image/jpeg', 'INVALID');
  await expectCode(Buffer.from('<svg/>'), 'image/png', 'INVALID');
  await expectCode(png, 'image/svg+xml', 'UNSUPPORTED');
  expect(ImageInputError).toBeDefined();
});

it('rejects oversized input, oversized dimensions, and truncated bytes', async () => {
  await expectCode(
    Buffer.alloc(MAX_IMAGE_BYTES + 1),
    'image/jpeg',
    'TOO_LARGE'
  );
  const wide = await sharp({
    create: { width: 6000, height: 5000, channels: 3, background: '#fff' },
  })
    .png()
    .toBuffer();
  await expectCode(wide, 'image/png', 'INVALID');
  const valid = await sharp({
    create: { width: 100, height: 100, channels: 3, background: '#fff' },
  })
    .png()
    .toBuffer();
  await expectCode(valid.subarray(0, 40), 'image/png', 'INVALID');
});

it('rejects animated WebP instead of accepting its first frame', async () => {
  // Two synthetic testsrc frames encoded as animated WebP.
  const animated = Buffer.from(
    'UklGRs4BAABXRUJQVlA4WAoAAAACAAAADwAADwAAQU5JTQYAAAD/////AABBTk1G9AAAAAAAAAAAAA8AAA8AAPQBAAJWUDgg3AAAADADAJ0BKhAAEAACADQlsAJ0RgBlgHSJj6PzJAus2lMurcAA/vlX9qXpLas+vE7GIiHrHzfHrzpee3lX8b7Q7d2wCe7Gv/iG/3vtzq9yB07+f6nyScMeXeDr/4q19d9kBH4JDmcv8g8HzW/3nGO0yhd3nijpW/+/13avNX3Pl4TkbCns2Zl98VgnP3mzy/9H/91mdS6F8d5h/5oug2PfcRpOif7Dr38X4Ljb/Svkw/rEuMcBuKXT/hL7yH9RHb5JMMHbIf3af9XRlZP/8jq4RYaY+4unfS3JIj2AAABBTk1GpgAAAAAAAAAAAAgAAAoAAPQBAABWUDggjgAAABQCAJ0BKgkACwAAADQlsAJ0MFDBRxBwqyAA/vibwhL0l6YP/dGcSX/06Owf3BaLX28CCKCmZee3q0/M8E/G9r4EqgI4ypGenfO/9vZ97qUbOHpk08zF/5O5/4+464n4DfoRHU+XvfXM4f9aaVeJSzG/3hPPftv+P5Sz74wa2Jwyz/z5lta/6fW5LgkAAAA=',
    'base64'
  );
  expect((await sharp(animated).metadata()).pages).toBe(2);
  await expectCode(animated, 'image/webp', 'INVALID');
});

it('rejects a real APNG even when the decoder reports only its first frame', async () => {
  const animated = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAACXBIWXMAAAABAAAAAQBPJcTWAAAACGFjVEwAAAACAAAAAPONk3AAAAAaZmNUTAAAAAAAAAAQAAAAEAAAAAAAAAAAAAEAAgAAbVWenQAAAI1JREFUeJzlUskNwzAMI4EM0k2SUdxNnE08SrNJN2ElGc3RuAiQRz7hwxYFSSQgEQHFS63iIPt8hy1EsQbx85ueC5YGSiKaEFlnLA2U2rUrkD7z19IhupD656Uhckrhfg2+sCeV8O6RheLJAUhEkILHhNG4n8fL+AWWfMcFMmlg1PZaE2hWgQxlt2RWhw944TQ1vqoCpgAAABpmY1RMAAAAAQAAABAAAAADAAAAAAAAAAwAAQACAABkmesLAAAANmZkQVQAAAACeJxj/N/AwJDAcECeYQEDw0IGBhAHiB7Yg/gLGBwegvjxIHEwX+EgCwOJgGQNAGQzCymAFrBnAAAAAElFTkSuQmCC',
    'base64'
  );
  await expectCode(animated, 'image/png', 'INVALID');
});
