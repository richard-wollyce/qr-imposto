import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ParsedInvoice, ScanResult, TaxComputation } from '@qr-imposto/core';

const STORAGE_KEY = '@qr-imposto/scan-history-v1';
const MAX_HISTORY_ENTRIES = 250;

export type ScanHistoryEntry = {
  id: string;
  scannedAt: string;
  uf?: string;
  issuerName?: string;
  totalAmount: number;
  approximateTaxAmount: number;
  percentage: number;
  confidence: TaxComputation['confidence'];
  source: ParsedInvoice['source'];
};

export type HistorySummary = {
  count: number;
  totalAmount: number;
  approximateTaxAmount: number;
  percentage: number;
};

export type HistorySummaries = {
  today: HistorySummary;
  week: HistorySummary;
  month: HistorySummary;
  year: HistorySummary;
  all: HistorySummary;
};

type SuccessfulScan = Extract<ScanResult, { ok: true }>;

export async function loadScanHistory(): Promise<ScanHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isScanHistoryEntry).slice(0, MAX_HISTORY_ENTRIES) : [];
  } catch {
    return [];
  }
}

export async function saveScanResult(result: SuccessfulScan): Promise<ScanHistoryEntry[]> {
  const entries = await loadScanHistory();
  const nextEntries = [createHistoryEntry(result), ...entries].slice(0, MAX_HISTORY_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
  return nextEntries;
}

export async function clearScanHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function summarizeScanHistory(entries: ScanHistoryEntry[], now = new Date()): HistorySummaries {
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  return {
    today: summarize(entries.filter((entry) => isOnOrAfter(entry.scannedAt, todayStart))),
    week: summarize(entries.filter((entry) => isOnOrAfter(entry.scannedAt, weekStart))),
    month: summarize(entries.filter((entry) => isOnOrAfter(entry.scannedAt, monthStart))),
    year: summarize(entries.filter((entry) => isOnOrAfter(entry.scannedAt, yearStart))),
    all: summarize(entries),
  };
}

function createHistoryEntry(result: SuccessfulScan): ScanHistoryEntry {
  const scannedAt = new Date().toISOString();

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scannedAt,
    uf: result.invoice.accessKey?.slice(0, 2) === '35' ? 'SP' : undefined,
    issuerName: result.invoice.issuerName,
    totalAmount: result.computation.totalAmount,
    approximateTaxAmount: result.computation.approximateTaxAmount,
    percentage: result.computation.percentage,
    confidence: result.computation.confidence,
    source: result.invoice.source,
  };
}

function summarize(entries: ScanHistoryEntry[]): HistorySummary {
  const totalAmount = entries.reduce((total, entry) => total + entry.totalAmount, 0);
  const approximateTaxAmount = entries.reduce((total, entry) => total + entry.approximateTaxAmount, 0);

  return {
    count: entries.length,
    totalAmount,
    approximateTaxAmount,
    percentage: totalAmount > 0 ? (approximateTaxAmount / totalAmount) * 100 : 0,
  };
}

function isOnOrAfter(input: string, date: Date): boolean {
  const parsed = new Date(input);
  return Number.isFinite(parsed.getTime()) && parsed >= date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  const day = start.getDay();
  const daysSinceMonday = (day + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function isScanHistoryEntry(input: unknown): input is ScanHistoryEntry {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const entry = input as Partial<ScanHistoryEntry>;

  return (
    typeof entry.id === 'string' &&
    typeof entry.scannedAt === 'string' &&
    typeof entry.totalAmount === 'number' &&
    typeof entry.approximateTaxAmount === 'number' &&
    typeof entry.percentage === 'number' &&
    typeof entry.confidence === 'string' &&
    typeof entry.source === 'string'
  );
}
