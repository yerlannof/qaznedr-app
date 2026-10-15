/**
 * Browser-side photo preparation: phone cameras produce 3–8 MB images, the
 * upload limit is 3 MB. Large or exotic images are redrawn as JPEG with the
 * long side capped; small JPEG/PNG/WebP files are sent untouched.
 */
export const UPLOAD_LIMIT_BYTES = 3 * 1024 * 1024;
const TARGET_BYTES = 2.8 * 1024 * 1024;
const PASSTHROUGH = new Set(['image/jpeg', 'image/png', 'image/webp']);
const STEPS: ReadonlyArray<[maxSide: number, quality: number]> = [
  [2560, 0.85],
  [2560, 0.72],
  [2048, 0.72],
  [1600, 0.7],
];

export class PhotoPrepareError extends Error {}

type Decoded = { source: CanvasImageSource; width: number; height: number };

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      });
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // Fall back to <img>, which some browsers decode more broadly (HEIC on Safari).
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new PhotoPrepareError())),
      'image/jpeg',
      quality
    )
  );
}

export async function prepareListingPhoto(file: File): Promise<File> {
  if (file.size < 1) throw new PhotoPrepareError();
  if (PASSTHROUGH.has(file.type) && file.size <= TARGET_BYTES) return file;
  if (file.type && !file.type.startsWith('image/'))
    throw new PhotoPrepareError();
  let decoded: Decoded;
  try {
    decoded = await decode(file);
  } catch {
    throw new PhotoPrepareError();
  }
  if (!decoded.width || !decoded.height) throw new PhotoPrepareError();
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new PhotoPrepareError();
  for (const [maxSide, quality] of STEPS) {
    const scale = Math.min(
      1,
      maxSide / Math.max(decoded.width, decoded.height)
    );
    canvas.width = Math.round(decoded.width * scale);
    canvas.height = Math.round(decoded.height * scale);
    context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
    const blob = await toBlob(canvas, quality);
    if (blob.size <= TARGET_BYTES) {
      const name = (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
      return new File([blob], name, { type: 'image/jpeg' });
    }
  }
  throw new PhotoPrepareError();
}
