import { describe, expect, it } from 'vitest';
import { computeTax } from '@qr-imposto/core';
import { analyzeNfceQrUrl, extractAccessKey, parseNfceFromText, parseNfceQrUrl } from './index';

const accessKey = '35260412345678000195650010000001234567890123';

describe('parseNfceQrUrl', () => {
  it('accepts HTTP(S) NFC-e URLs and masks access keys', () => {
    const result = parseNfceQrUrl(
      `https://www.nfce.fazenda.sp.gov.br/qrcode?p=${accessKey}|2|1|ABC`,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.payload.accessKey).toBe(accessKey);
      expect(result.payload.uf).toBe('SP');
      expect(result.payload.sanitizedUrl).toContain('352604********************************890123');
    }
  });

  it('rejects non-web URLs', () => {
    expect(parseNfceQrUrl('javascript:alert(1)')).toMatchObject({
      ok: false,
      reason: 'unsupported_url',
    });
  });

  it('identifies synthetic access keys from other UFs for offline coverage', () => {
    const result = parseNfceQrUrl(
      `https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode?p=${makeAccessKey('33')}|2|1|SYNTHETIC`,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.payload.uf).toBe('RJ');
      expect(result.payload.accessKey?.startsWith('33')).toBe(true);
    }
  });
});

describe('extractAccessKey', () => {
  it('extracts a 44-digit access key from decoded text', () => {
    expect(extractAccessKey(`p=${accessKey}|2|1`)).toBe(accessKey);
  });
});

describe('parseNfceFromText', () => {
  it('parses XML totals with high-confidence source fields', () => {
    const invoice = parseNfceFromText(`
      <NFe>
        <infNFe Id="NFe${accessKey}">
          <emit><CNPJ>12345678000195</CNPJ><xNome>Mercado Exemplo</xNome></emit>
          <total><ICMSTot><vNF>123.45</vNF><vTotTrib>23.45</vTotTrib></ICMSTot></total>
          <dhEmi>2026-04-19T18:20:00-03:00</dhEmi>
        </infNFe>
      </NFe>
    `);

    expect(invoice).toMatchObject({
      issuerName: 'Mercado Exemplo',
      totalAmount: 123.45,
      approximateTaxAmount: 23.45,
      source: 'xml',
    });
  });

  it('parses public-page text with approximate tax labels', () => {
    const invoice = parseNfceFromText(`
      <html><body>
        <h1>Mercado Exemplo</h1>
        <p>Valor total da nota R$ 200,00</p>
        <p>Valor aproximado dos tributos R$ 44,00 - Lei 12.741/2012</p>
      </body></html>
    `);

    expect(invoice.totalAmount).toBe(200);
    expect(invoice.approximateTaxAmount).toBe(44);
    expect(invoice.source).toBe('public_page');
  });

  it('does not confuse Lei 12.741 with the tax amount', () => {
    const invoice = parseNfceFromText(`
      Informação dos Tributos Totais Incidentes (Lei Federal 12.741/2012) R$ 10,20
      Valor a pagar R$: 30,20
    `);

    expect(invoice.totalAmount).toBe(30.2);
    expect(invoice.approximateTaxAmount).toBe(10.2);
  });

  it.each([
    ['RJ', '33', 'https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode'],
    ['MG', '31', 'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml'],
    ['RS', '43', 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx'],
    ['PR', '41', 'http://www.fazenda.pr.gov.br/nfce/qrcode'],
    ['PE', '26', 'http://nfce.sefaz.pe.gov.br/nfce-web/consultarNFCe'],
    ['GO', '52', 'https://nfe.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe'],
  ])('parses synthetic %s fixture text without calling public portals', (uf, ufCode, baseUrl) => {
    const key = makeAccessKey(ufCode);
    const parsed = parseNfceQrUrl(`${baseUrl}?p=${key}|2|1|SYNTHETIC`);

    expect(parsed.ok).toBe(true);

    if (parsed.ok) {
      expect(parsed.payload.uf).toBe(uf);
    }

    const invoice = parseNfceFromText(
      `
        <html><body>
          <h1>Mercado Sintetico ${uf}</h1>
          <p>Valor total da nota R$ 120,00</p>
          <p>Valor aproximado dos tributos R$ 24,00 - Lei 12.741/2012</p>
        </body></html>
      `,
      { accessKey: key },
    );
    const computation = computeTax(invoice);

    expect(invoice.totalAmount).toBe(120);
    expect(invoice.approximateTaxAmount).toBe(24);
    expect(computation).toMatchObject({
      totalAmount: 120,
      approximateTaxAmount: 24,
      percentage: 20,
    });
  });

  it('blocks non-SP QR Codes in the live MVP flow before fetching the public page', async () => {
    const result = await analyzeNfceQrUrl(
      `https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode?p=${makeAccessKey('33')}|2|1|SYNTHETIC`,
      async () => {
        throw new Error('fetcher should not be called for unsupported UFs');
      },
    );

    expect(result).toMatchObject({
      ok: false,
      reason: 'unsupported_uf',
    });
  });
});

function makeAccessKey(ufCode: string): string {
  return `${ufCode}260412345678000195650010000001234567890123`;
}
