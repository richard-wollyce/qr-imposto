import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScanResult } from '@qr-imposto/core';
import {
  buildMonthlyTaxSeries,
  buildWeeklyTaxSeries,
  buildYearlyTaxSeries,
  loadScanHistory,
  removeScanHistoryEntry,
  saveScanResult,
  summarizeScanHistory,
  type ScanHistoryEntry,
} from './history';

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
  },
}));

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
  digestStringAsync: vi.fn(async (_algorithm: string, input: string) => `sha256-${input}`),
}));

const storageKey = '@qr-imposto/scan-history-v1';
const accessKeyA = '35260412345678000195650010000001234567890123';
const accessKeyB = '35260412345678000195650010000001234567890124';

describe('scan history', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it('does not create a second entry for the same NFC-e access key', async () => {
    const firstSave = await saveScanResult(makeScanResult(accessKeyA));
    const secondSave = await saveScanResult(makeScanResult(accessKeyA));

    expect(firstSave.status).toBe('created');
    expect(secondSave.status).toBe('duplicate');
    expect(secondSave.entries).toHaveLength(1);
    expect(summarizeScanHistory(secondSave.entries).all).toMatchObject({
      count: 1,
      totalAmount: 100,
      approximateTaxAmount: 20,
    });
  });

  it('keeps two NFC-e entries with identical values when access keys differ', async () => {
    await saveScanResult(makeScanResult(accessKeyA));
    const secondSave = await saveScanResult(makeScanResult(accessKeyB));

    expect(secondSave.status).toBe('created');
    expect(secondSave.entries).toHaveLength(2);
    expect(summarizeScanHistory(secondSave.entries).all).toMatchObject({
      count: 2,
      totalAmount: 200,
      approximateTaxAmount: 40,
    });
  });

  it('removes one history entry and returns the updated list', async () => {
    const firstSave = await saveScanResult(makeScanResult(accessKeyA));
    const secondSave = await saveScanResult(makeScanResult(accessKeyB));

    const entries = await removeScanHistoryEntry(firstSave.entry.id);

    expect(secondSave.entries).toHaveLength(2);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe(secondSave.entry.id);
  });

  it('loads legacy entries that do not have a dedupe key', async () => {
    storage.set(
      storageKey,
      JSON.stringify([
        {
          id: 'legacy-entry',
          scannedAt: '2026-04-20T12:00:00.000Z',
          uf: 'SP',
          issuerName: 'Mercado legado',
          totalAmount: 30.2,
          approximateTaxAmount: 10.2,
          percentage: 33.77483443708609,
          confidence: 'medium',
          source: 'public_page',
        },
      ]),
    );

    const entries = await loadScanHistory();

    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe('legacy-entry');
    expect(entries[0]?.dedupeKey).toBeUndefined();
  });

  it('summarizes the current day without including previous readings', () => {
    const now = new Date(2026, 3, 20, 18, 0, 0);
    const entries = [
      makeHistoryEntry({ scannedAt: new Date(2026, 3, 20, 9, 0, 0).toISOString(), totalAmount: 100, approximateTaxAmount: 20 }),
      makeHistoryEntry({ scannedAt: new Date(2026, 3, 19, 21, 0, 0).toISOString(), totalAmount: 80, approximateTaxAmount: 8 }),
    ];

    expect(summarizeScanHistory(entries, now).today).toMatchObject({
      count: 1,
      totalAmount: 100,
      approximateTaxAmount: 20,
      percentage: 20,
    });
  });

  it('builds a weekly tax series with seven points and zero-value days', () => {
    const now = new Date(2026, 3, 23, 12, 0, 0);
    const entries = [
      makeHistoryEntry({ scannedAt: new Date(2026, 3, 20, 9, 0, 0).toISOString(), totalAmount: 200, approximateTaxAmount: 50 }),
      makeHistoryEntry({ scannedAt: new Date(2026, 3, 22, 10, 0, 0).toISOString(), totalAmount: 100, approximateTaxAmount: 10 }),
      makeHistoryEntry({ scannedAt: new Date(2026, 3, 27, 9, 0, 0).toISOString(), totalAmount: 999, approximateTaxAmount: 999 }),
    ];

    const series = buildWeeklyTaxSeries(entries, now);

    expect(series).toHaveLength(7);
    expect(series.map((point) => point.label)).toEqual(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']);
    expect(series[0]).toMatchObject({ count: 1, totalAmount: 200, approximateTaxAmount: 50, percentage: 25 });
    expect(series[1]).toMatchObject({ count: 0, totalAmount: 0, approximateTaxAmount: 0, percentage: 0 });
    expect(series[2]).toMatchObject({ count: 1, totalAmount: 100, approximateTaxAmount: 10, percentage: 10 });
  });

  it('builds a monthly tax series for every day in the current month', () => {
    const now = new Date(2026, 3, 20, 12, 0, 0);
    const entries = [
      makeHistoryEntry({ scannedAt: new Date(2026, 3, 1, 9, 0, 0).toISOString(), totalAmount: 50, approximateTaxAmount: 5 }),
      makeHistoryEntry({ scannedAt: new Date(2026, 3, 30, 18, 0, 0).toISOString(), totalAmount: 120, approximateTaxAmount: 30 }),
      makeHistoryEntry({ scannedAt: new Date(2026, 2, 31, 23, 0, 0).toISOString(), totalAmount: 999, approximateTaxAmount: 999 }),
    ];

    const series = buildMonthlyTaxSeries(entries, now);

    expect(series).toHaveLength(30);
    expect(series[0]).toMatchObject({ key: '2026-04-01', label: '1', count: 1, approximateTaxAmount: 5 });
    expect(series[19]).toMatchObject({ key: '2026-04-20', label: '20', count: 0, approximateTaxAmount: 0 });
    expect(series[29]).toMatchObject({ key: '2026-04-30', label: '30', count: 1, approximateTaxAmount: 30 });
  });

  it('builds a yearly tax series with twelve monthly points', () => {
    const now = new Date(2026, 3, 20, 12, 0, 0);
    const entries = [
      makeHistoryEntry({ scannedAt: new Date(2026, 0, 10, 9, 0, 0).toISOString(), totalAmount: 90, approximateTaxAmount: 9 }),
      makeHistoryEntry({ scannedAt: new Date(2026, 11, 25, 9, 0, 0).toISOString(), totalAmount: 300, approximateTaxAmount: 60 }),
      makeHistoryEntry({ scannedAt: new Date(2025, 11, 25, 9, 0, 0).toISOString(), totalAmount: 999, approximateTaxAmount: 999 }),
    ];

    const series = buildYearlyTaxSeries(entries, now);

    expect(series).toHaveLength(12);
    expect(series[0]).toMatchObject({ key: '2026-01', label: 'Jan', count: 1, approximateTaxAmount: 9 });
    expect(series[3]).toMatchObject({ key: '2026-04', label: 'Abr', count: 0, approximateTaxAmount: 0 });
    expect(series[11]).toMatchObject({ key: '2026-12', label: 'Dez', count: 1, approximateTaxAmount: 60 });
  });
});

function makeScanResult(accessKey: string): Extract<ScanResult, { ok: true }> {
  return {
    ok: true,
    invoice: {
      accessKey,
      issuerName: 'Mercado Exemplo',
      totalAmount: 100,
      approximateTaxAmount: 20,
      source: 'public_page',
    },
    computation: {
      totalAmount: 100,
      approximateTaxAmount: 20,
      percentage: 20,
      confidence: 'medium',
      method: 'public_page_total_tax',
    },
    insight: {
      fact: 'R$ 20,00 em tributos aproximados.',
      context: 'Isso representa 20% desta compra de R$ 100,00.',
      impact: 'A cada R$ 100,00 nesse padrão de compra, cerca de R$ 20,00 aparecem como tributos aproximados.',
      confidenceLabel: 'Média confiança',
      methodology: 'Valor identificado na consulta pública da NFC-e.',
    },
  };
}

function makeHistoryEntry(overrides: Partial<ScanHistoryEntry>): ScanHistoryEntry {
  const totalAmount = overrides.totalAmount ?? 100;
  const approximateTaxAmount = overrides.approximateTaxAmount ?? 20;

  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    scannedAt: overrides.scannedAt ?? new Date(2026, 3, 20, 12, 0, 0).toISOString(),
    issuerName: overrides.issuerName ?? 'Mercado Exemplo',
    totalAmount,
    approximateTaxAmount,
    percentage: totalAmount > 0 ? (approximateTaxAmount / totalAmount) * 100 : 0,
    confidence: overrides.confidence ?? 'medium',
    source: overrides.source ?? 'public_page',
    dedupeKey: overrides.dedupeKey,
    uf: overrides.uf,
  };
}
