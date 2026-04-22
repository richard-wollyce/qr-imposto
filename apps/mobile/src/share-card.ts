import { formatCurrency, formatPercentage, type ScanResult } from '@qr-imposto/core';
import type { HistorySummary } from './history';

type SuccessfulScan = Extract<ScanResult, { ok: true }>;

export type ShareCardKind = 'scan' | 'summary';
export type SharePeriodKey = 'today' | 'week' | 'month' | 'year';

export type ShareCardStat = {
  label: string;
  value: string;
};

export type ShareCardPayload = {
  kind: ShareCardKind;
  brand: string;
  eyebrow: string;
  primaryIntro?: string;
  primaryAmount: string;
  primaryLabel: string;
  statRows: ShareCardStat[];
  note: string;
  cta: string;
  signature: string;
  url: string;
  shareUrl: string;
  shareText: string;
  fileName: string;
};

const SHARE_CARD_BRAND = 'QR Imposto';
const SHARE_CARD_DISPLAY_URL = 'qr.richardwollyce.com';
export const SHARE_CARD_APP_URL = `https://${SHARE_CARD_DISPLAY_URL}`;
export const SHARE_CARD_SIGNATURE = SHARE_CARD_DISPLAY_URL;

const PERIOD_LABELS: Record<SharePeriodKey, { eyebrow: string; text: string; slug: string }> = {
  today: { eyebrow: 'Hoje', text: 'Hoje', slug: 'hoje' },
  week: { eyebrow: 'Nesta semana', text: 'Nesta semana', slug: 'semana' },
  month: { eyebrow: 'Neste mês', text: 'Neste mês', slug: 'mes' },
  year: { eyebrow: 'Neste ano', text: 'Neste ano', slug: 'ano' },
};

export function buildScanShareCardPayload(result: SuccessfulScan, now = new Date()): ShareCardPayload {
  const taxAmount = formatCardCurrency(result.computation.approximateTaxAmount);
  const totalAmount = formatCardCurrency(result.computation.totalAmount);
  const percentage = formatPercentage(result.computation.percentage);
  const shareText = [
    `Nesta compra, ${taxAmount} foram tributos aproximados.`,
    `Isso representa ${percentage} do valor pago.`,
    `Veja quanto imposto existe nas suas compras: ${SHARE_CARD_APP_URL}`,
  ].join(' ');

  return {
    kind: 'scan',
    brand: SHARE_CARD_BRAND,
    eyebrow: 'Nesta compra',
    primaryAmount: taxAmount,
    primaryLabel: 'foram tributos aproximados',
    statRows: [
      { label: 'Compra', value: totalAmount },
      { label: 'Peso', value: `${percentage} do valor pago` },
    ],
    note: result.insight.methodology,
    cta: 'Veja quanto imposto existe nas suas compras',
    signature: SHARE_CARD_SIGNATURE,
    url: SHARE_CARD_DISPLAY_URL,
    shareUrl: SHARE_CARD_APP_URL,
    shareText,
    fileName: buildShareCardFileName(now, 'compra'),
  };
}

export function buildSummaryShareCardPayload(
  periodKey: SharePeriodKey,
  summary: HistorySummary,
  now = new Date(),
): ShareCardPayload {
  const period = PERIOD_LABELS[periodKey];
  const taxAmount = formatCardCurrency(summary.approximateTaxAmount);
  const totalAmount = formatCardCurrency(summary.totalAmount);
  const percentage = formatPercentage(summary.percentage);
  const isSingleNote = summary.count === 1;
  const purchaseLabel = isSingleNote ? 'VALOR DA COMPRA' : 'VALOR DAS COMPRAS';
  const purchasePhrase = isSingleNote ? 'na minha compra' : 'nas minhas compras';
  const countDescription = `${summary.count} ${isSingleNote ? 'nota escaneada' : 'notas escaneadas'}`;
  const percentageDescription = `${percentage} do valor ${isSingleNote ? 'da compra' : 'das compras'}`;
  const shareText = [
    `${period.text}, paguei ${taxAmount} em tributos aproximados ${purchasePhrase}.`,
    `${countDescription} • ${percentageDescription}.`,
    `Veja quanto imposto existe nas suas compras: ${SHARE_CARD_APP_URL}`,
  ].join(' ');

  return {
    kind: 'summary',
    brand: SHARE_CARD_BRAND,
    eyebrow: period.eyebrow,
    primaryIntro: `${period.text}, paguei`,
    primaryAmount: taxAmount,
    primaryLabel: 'em tributos aproximados',
    statRows: [
      { label: purchaseLabel, value: totalAmount },
      { label: 'NOTAS DE COMPRA NFC-E', value: countDescription },
      { label: 'PORCENTAGEM DE IMPOSTO', value: percentageDescription },
    ],
    note: 'Resumo local deste dispositivo. Sem login e sem envio para servidor.',
    cta: 'Veja quanto imposto existe nas suas compras',
    signature: SHARE_CARD_SIGNATURE,
    url: SHARE_CARD_DISPLAY_URL,
    shareUrl: SHARE_CARD_APP_URL,
    shareText,
    fileName: buildShareCardFileName(now, period.slug),
  };
}

export function buildShareCardPayload(result: SuccessfulScan, now = new Date()): ShareCardPayload {
  return buildScanShareCardPayload(result, now);
}

export function buildShareCardFileName(now = new Date(), slug = 'compra'): string {
  const datePart = Number.isFinite(now.getTime()) ? now.toISOString().slice(0, 10) : 'card';
  return `qr-imposto-${slug}-${datePart}.png`;
}

function formatCardCurrency(value: number): string {
  return formatCurrency(value).replace(/\u00a0/g, ' ');
}
