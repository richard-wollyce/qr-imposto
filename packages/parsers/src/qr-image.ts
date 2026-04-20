import {
  BinaryBitmap,
  HybridBinarizer,
  QRCodeReader,
  RGBLuminanceSource,
} from '@zxing/library';
import jsQR from 'jsqr';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

export function decodeQrImage(buffer: Buffer): string | undefined {
  const bitmap = decodeBitmap(buffer);
  const rgba = new Uint8ClampedArray(bitmap.data);
  const code = decodePreparedBitmap({ data: rgba, width: bitmap.width, height: bitmap.height });

  if (code) {
    return code;
  }

  for (const cropWindow of CROP_WINDOWS) {
    const cropped = cropBitmap({ data: rgba, width: bitmap.width, height: bitmap.height }, cropWindow);

    for (const threshold of THRESHOLDS) {
      const binarized = thresholdBitmap(cropped, threshold);
      const result = decodePreparedBitmap(binarized);

      if (result) {
        return result;
      }
    }
  }

  return undefined;
}

export const decodeQrPng = decodeQrImage;

function decodeBitmap(buffer: Buffer): { data: Uint8Array; width: number; height: number } {
  if (isJpeg(buffer)) {
    return jpeg.decode(buffer, { useTArray: true });
  }

  const png = PNG.sync.read(trimTrailingPngData(buffer));
  return {
    data: png.data,
    width: png.width,
    height: png.height,
  };
}

function decodeWithZxing(data: Uint8ClampedArray, width: number, height: number): string | undefined {
  try {
    const rgb = new Uint8ClampedArray(width * height * 3);

    for (let source = 0, target = 0; source < data.length; source += 4, target += 3) {
      rgb[target] = data[source] ?? 0;
      rgb[target + 1] = data[source + 1] ?? 0;
      rgb[target + 2] = data[source + 2] ?? 0;
    }

    const source = new RGBLuminanceSource(rgb, width, height);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(source));
    return new QRCodeReader().decode(binaryBitmap).getText();
  } catch {
    return undefined;
  }
}

const CROP_WINDOWS: Array<[number, number, number, number]> = [
  [0, 0, 1, 1],
  [0.05, 0.05, 0.95, 0.95],
  [0.1, 0.2, 0.9, 0.85],
  [0.18, 0.25, 0.82, 0.78],
  [0.2, 0.3, 0.78, 0.76],
  [0.25, 0.28, 0.78, 0.78],
];

const THRESHOLDS = [120, 100, 140, 80, 160, 180, 200];

function decodePreparedBitmap(bitmap: { data: Uint8ClampedArray; width: number; height: number }): string | undefined {
  return (
    jsQR(bitmap.data, bitmap.width, bitmap.height, { inversionAttempts: 'attemptBoth' })?.data ??
    decodeWithZxing(bitmap.data, bitmap.width, bitmap.height)
  );
}

function cropBitmap(
  bitmap: { data: Uint8ClampedArray; width: number; height: number },
  [left, top, right, bottom]: [number, number, number, number],
): { data: Uint8ClampedArray; width: number; height: number } {
  const sourceX = Math.floor(left * bitmap.width);
  const sourceY = Math.floor(top * bitmap.height);
  const width = Math.max(1, Math.floor((right - left) * bitmap.width));
  const height = Math.max(1, Math.floor((bottom - top) * bitmap.height));
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = ((sourceY + y) * bitmap.width + sourceX + x) * 4;
      const targetIndex = (y * width + x) * 4;

      data[targetIndex] = bitmap.data[sourceIndex] ?? 0;
      data[targetIndex + 1] = bitmap.data[sourceIndex + 1] ?? 0;
      data[targetIndex + 2] = bitmap.data[sourceIndex + 2] ?? 0;
      data[targetIndex + 3] = 255;
    }
  }

  return { data, width, height };
}

function thresholdBitmap(
  bitmap: { data: Uint8ClampedArray; width: number; height: number },
  threshold: number,
): { data: Uint8ClampedArray; width: number; height: number } {
  const data = new Uint8ClampedArray(bitmap.data.length);

  for (let index = 0; index < bitmap.data.length; index += 4) {
    const gray =
      (bitmap.data[index] ?? 0) * 0.299 +
      (bitmap.data[index + 1] ?? 0) * 0.587 +
      (bitmap.data[index + 2] ?? 0) * 0.114;
    const value = gray < threshold ? 0 : 255;

    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }

  return {
    data,
    width: bitmap.width,
    height: bitmap.height,
  };
}

function isJpeg(buffer: Buffer): boolean {
  return buffer[0] === 0xff && buffer[1] === 0xd8;
}

function trimTrailingPngData(buffer: Buffer): Buffer {
  const iendIndex = buffer.indexOf(Buffer.from('IEND'));

  if (iendIndex === -1) {
    return buffer;
  }

  return buffer.subarray(0, iendIndex + 8);
}
