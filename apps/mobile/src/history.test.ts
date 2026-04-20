import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScanResult } from '@qr-imposto/core';
import {
  loadScanHistory,
  removeScanHistoryEntry,
  saveScanResult,
  summarizeScanHistory,
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
