import {
  PhotoPrepareError,
  prepareListingPhoto,
} from '@/lib/equipment-listings/photo-prepare';

const MB = 1024 * 1024;
const file = (bytes: number, type = 'image/jpeg', name = 'IMG_0001.JPG') =>
  new File([new Uint8Array(bytes)], name, { type });

let blobSizes: number[];
beforeEach(() => {
  blobSizes = [];
  (globalThis as { createImageBitmap?: unknown }).createImageBitmap = jest
    .fn()
    .mockResolvedValue({ width: 4032, height: 3024 });
  jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue({ drawImage: jest.fn() } as never);
  jest
    .spyOn(HTMLCanvasElement.prototype, 'toBlob')
    .mockImplementation(function (this: HTMLCanvasElement, done) {
      const size = blobSizes.shift() ?? MB;
      done(new Blob([new Uint8Array(size)], { type: 'image/jpeg' }));
    });
});
afterEach(() => jest.restoreAllMocks());

it('sends small supported photos untouched', async () => {
  const small = file(2 * MB);
  await expect(prepareListingPhoto(small)).resolves.toBe(small);
  expect(createImageBitmap).not.toHaveBeenCalled();
});

it('shrinks a large phone photo to a JPEG under the limit', async () => {
  const result = await prepareListingPhoto(file(7 * MB));
  expect(result.type).toBe('image/jpeg');
  expect(result.name).toBe('IMG_0001.jpg');
  expect(result.size).toBeLessThanOrEqual(3 * MB);
});

it('tries smaller sizes until the photo fits', async () => {
  blobSizes = [4 * MB, 3.5 * MB, MB];
  const result = await prepareListingPhoto(file(9 * MB));
  expect(result.size).toBe(MB);
  expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledTimes(3);
});

it('rejects empty files and non-images', async () => {
  await expect(prepareListingPhoto(file(0))).rejects.toBeInstanceOf(
    PhotoPrepareError
  );
  await expect(
    prepareListingPhoto(file(5 * MB, 'application/pdf', 'a.pdf'))
  ).rejects.toBeInstanceOf(PhotoPrepareError);
});
