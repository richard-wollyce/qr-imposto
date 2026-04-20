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
export const SHARE_CARD_SIGNATURE = 'Open-source • Desenvolvido por Richard Wollyce';

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
      { label: 'Confiança', value: result.insight.confidenceLabel },
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
  const countLabel = summary.count === 1 ? 'nota' : 'notas';
  const shareText = [
    `${period.text}, ${taxAmount} foram tributos aproximados nas minhas compras.`,
    `${summary.count} ${countLabel} • ${percentage} do valor pago.`,
    `Veja quanto imposto existe nas suas compras: ${SHARE_CARD_APP_URL}`,
  ].join(' ');

  return {
    kind: 'summary',
    brand: SHARE_CARD_BRAND,
    eyebrow: period.eyebrow,
    primaryAmount: taxAmount,
    primaryLabel: 'em tributos aproximados',
    statRows: [
      { label: 'Notas', value: `${summary.count} ${countLabel}` },
      { label: 'Total comprado', value: totalAmount },
      { label: 'Peso médio', value: `${percentage} do valor pago` },
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
