import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { computeTax, maskAccessKey } from '@qr-imposto/core';
import { decodeQrImage } from '../src/qr-image';
import { fetchNfcePublicPage, parseNfceFromText, parseNfceQrUrl } from '../src';

const dir = resolve(process.cwd(), 'qr-examples');

async function main() {
  if (!existsSync(dir)) {
    console.log('qr-examples/ not found. Add private local QR images to run live analysis.');
    return;
  }

  const files = readdirSync(dir).filter((file) => /\.(png|jpe?g)$/i.test(file));

  if (files.length === 0) {
    console.log('qr-examples/ has no PNG or JPEG files.');
    return;
  }

  for (const file of files) {
    console.log(`\n${file}`);

    const qr = decodeQrImage(readFileSync(resolve(dir, file)));

    if (!qr) {
      console.log('  QR: não foi possível decodificar a imagem.');
      continue;
    }

    const parsed = parseNfceQrUrl(qr);

    if (!parsed.ok) {
      console.log(`  QR: ${parsed.message}`);
      continue;
    }

    console.log(`  URL: ${maskAccessKey(parsed.payload.sanitizedUrl)}`);
    console.log(`  Portal: ${parsed.payload.host}`);
    console.log(`  UF: ${parsed.payload.uf ?? 'não identificada'}`);

    try {
      const page = await fetchNfcePublicPage(parsed.payload.originalUrl);
      const invoice = parseNfceFromText(page, parsed.payload);
      const tax = computeTax(invoice);

      if ('ok' in tax) {
        console.log(`  Consulta: ${tax.message}`);
        continue;
      }

      console.log(`  Total: ${invoice.totalAmount?.toFixed(2) ?? 'não encontrado'}`);
      console.log(`  Tributos aproximados: ${invoice.approximateTaxAmount?.toFixed(2) ?? 'não encontrado'}`);
      console.log(`  Percentual: ${tax.percentage.toFixed(1)}%`);
      console.log(`  Fonte: ${invoice.source}`);
    } catch (error) {
      console.log(`  Consulta: falhou (${error instanceof Error ? error.message : 'erro desconhecido'})`);
    }
  }
}

main();
