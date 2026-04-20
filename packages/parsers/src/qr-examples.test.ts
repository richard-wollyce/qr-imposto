import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseNfceQrUrl } from './index';
import { decodeQrImage } from './qr-image';

describe('qr-examples fixtures', () => {
  it('decodes every PNG QR example into a supported NFC-e URL', () => {
    const dir = resolve(process.cwd(), 'qr-examples');
    if (!existsSync(dir)) {
      return;
    }

    const files = readdirSync(dir).filter((file) => /\.(png|jpe?g)$/i.test(file));
    if (files.length === 0) {
      return;
    }

    for (const file of files) {
      const data = decodeQrImage(readFileSync(resolve(dir, file)));
      expect(data, `${file} should contain a readable QR code`).toBeTruthy();

      const parsed = parseNfceQrUrl(data ?? '');
      expect(parsed, `${file} should contain a supported web URL`).toMatchObject({ ok: true });
    }
  }, 15000);
});
