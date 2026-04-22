import { describe, expect, it } from 'vitest';
import type { ScanResult } from '@qr-imposto/core';
import {
  SHARE_CARD_APP_URL,
  SHARE_CARD_SIGNATURE,
  buildScanShareCardPayload,
  buildShareCardFileName,
  buildShareCardPayload,
  buildSummaryShareCardPayload,
  type SharePeriodKey,
} from './share-card';
import type { HistorySummary } from './history';

describe('share card payload', () => {
  it('formats the individual scan card without sensitive NFC-e data', () => {
    const payload = buildScanShareCardPayload(makeSensitiveScanResult(), new Date('2026-04-20T12:00:00.000Z'));
    const serialized = JSON.stringify(payload);

    expect(payload).toMatchObject({
      kind: 'scan',
      primaryAmount: 'R$ 18,40',
      primaryLabel: 'foram tributos aproximados',
      signature: SHARE_CARD_SIGNATURE,
      url: 'qr.richardwollyce.com',
      shareUrl: SHARE_CARD_APP_URL,
      fileName: 'qr-imposto-compra-2026-04-20.png',
    });
    expect(payload.statRows).toEqual([
      { label: 'Compra', value: 'R$ 92,00' },
      { label: 'Peso', value: '20% do valor pago' },
    ]);
    expect(payload.shareText).toContain('tributos aproximados');
    expect(payload.shareText).toContain(SHARE_CARD_APP_URL);
    expect(serialized).not.toContain('Open-source');
    expect(serialized).not.toContain('Mercado Sensível');
    expect(serialized).not.toContain('35260412345678000195650010000001234567890123');
    expect(serialized).not.toContain('12.345.678/0001-95');
    expect(serialized).not.toContain('nfce.fazenda.sp.gov.br/qrcode');
  });

  it('keeps the previous builder as the scan-card entrypoint', () => {
    expect(buildShareCardPayload(makeSensitiveScanResult()).kind).toBe('scan');
  });

  it.each<[SharePeriodKey, string, string]>([
    ['today', 'Hoje', 'qr-imposto-hoje-2026-04-20.png'],
    ['week', 'Nesta semana', 'qr-imposto-semana-2026-04-20.png'],
    ['month', 'Neste mês', 'qr-imposto-mes-2026-04-20.png'],
    ['year', 'Neste ano', 'qr-imposto-ano-2026-04-20.png'],
  ])('formats the %s summary card', (periodKey, eyebrow, fileName) => {
    const payload = buildSummaryShareCardPayload(periodKey, makeSummary(), new Date('2026-04-20T12:00:00.000Z'));

    expect(payload).toMatchObject({
      kind: 'summary',
      eyebrow,
      primaryIntro: `${eyebrow}, paguei`,
      primaryAmount: 'R$ 40,00',
      primaryLabel: 'em tributos aproximados',
      fileName,
      signature: SHARE_CARD_SIGNATURE,
      shareUrl: SHARE_CARD_APP_URL,
    });
    expect(payload.statRows).toEqual([
      { label: 'VALOR DAS COMPRAS', value: 'R$ 200,00' },
      { label: 'NOTAS DE COMPRA NFC-E', value: '2 notas escaneadas' },
      { label: 'PORCENTAGEM DE IMPOSTO', value: '20% do valor das compras' },
    ]);
    expect(payload.shareText).toContain(`${eyebrow}, paguei R$ 40,00 em tributos aproximados`);
    expect(payload.shareText).toContain('2 notas escaneadas');
    expect(payload.shareText).toContain('20% do valor das compras');
    expect(payload.shareText).toContain(SHARE_CARD_APP_URL);
  });

  it('uses singular copy for a one-note summary card', () => {
    const payload = buildSummaryShareCardPayload(
      'today',
      { count: 1, totalAmount: 92, approximateTaxAmount: 18.4, percentage: 20 },
      new Date('2026-04-20T12:00:00.000Z'),
    );

    expect(payload.statRows).toEqual([
      { label: 'VALOR DA COMPRA', value: 'R$ 92,00' },
      { label: 'NOTAS DE COMPRA NFC-E', value: '1 nota escaneada' },
      { label: 'PORCENTAGEM DE IMPOSTO', value: '20% do valor da compra' },
    ]);
    expect(payload.shareText).toContain('Hoje, paguei R$ 18,40 em tributos aproximados na minha compra');
    expect(payload.shareText).toContain('1 nota escaneada');
    expect(payload.shareText).toContain('20% do valor da compra');
  });

  it('does not break summary cards with zero notes', () => {
    const payload = buildSummaryShareCardPayload(
      'today',
      { count: 0, totalAmount: 0, approximateTaxAmount: 0, percentage: 0 },
      new Date('2026-04-20T12:00:00.000Z'),
    );

    expect(payload.primaryAmount).toBe('R$ 0,00');
    expect(payload.statRows).toContainEqual({ label: 'VALOR DAS COMPRAS', value: 'R$ 0,00' });
    expect(payload.statRows).toContainEqual({ label: 'NOTAS DE COMPRA NFC-E', value: '0 notas escaneadas' });
    expect(payload.statRows).toContainEqual({ label: 'PORCENTAGEM DE IMPOSTO', value: '0% do valor das compras' });
    expect(payload.shareText).toContain('0 notas escaneadas');
  });

  it('builds a stable PNG filename', () => {
    expect(buildShareCardFileName(new Date('2026-04-20T12:00:00.000Z'), 'hoje')).toBe(
      'qr-imposto-hoje-2026-04-20.png',
    );
  });
});

function makeSummary(): HistorySummary {
  return {
    count: 2,
    totalAmount: 200,
    approximateTaxAmount: 40,
    percentage: 20,
  };
}

function makeSensitiveScanResult(): Extract<ScanResult, { ok: true }> {
  return {
    ok: true,
    invoice: {
      accessKey: '35260412345678000195650010000001234567890123',
      issuerName: 'Mercado Sensível',
      issuerDocument: '12.345.678/0001-95',
      totalAmount: 92,
      approximateTaxAmount: 18.4,
      source: 'public_page',
      rawLabels: [
        'https://www.nfce.fazenda.sp.gov.br/qrcode?p=35260412345678000195650010000001234567890123',
      ],
    },
    computation: {
      totalAmount: 92,
      approximateTaxAmount: 18.4,
      percentage: 20,
      confidence: 'medium',
      method: 'public_page_total_tax',
    },
    insight: {
      fact: 'R$ 18,40 em tributos aproximados.',
      context: 'Isso representa 20% desta compra de R$ 92,00.',
      impact: 'A cada R$ 100,00 nesse padrão de compra, cerca de R$ 20,00 aparecem como tributos aproximados.',
      confidenceLabel: 'Média confiança',
      methodology: 'Valor identificado na consulta pública da NFC-e.',
    },
  };
}
