import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { ParsedInvoice, ScanResult, TaxComputation } from '@qr-imposto/core';

const STORAGE_KEY = '@qr-imposto/scan-history-v1';
const MAX_HISTORY_ENTRIES = 250;
const ACCESS_KEY_PATTERN = /^\d{44}$/;

export type ScanHistoryEntry = {
  id: string;
  scannedAt: string;
  dedupeKey?: string;
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

export type HistorySeriesPoint = HistorySummary & {
  key: string;
  label: string;
  startDate: Date;
  endDate: Date;
};

type SuccessfulScan = Extract<ScanResult, { ok: true }>;

export type SaveScanResultOutcome = {
  status: 'created' | 'duplicate';
  entries: ScanHistoryEntry[];
  entry: ScanHistoryEntry;
};

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

export async function saveScanResult(result: SuccessfulScan): Promise<SaveScanResultOutcome> {
  const entries = await loadScanHistory();
  const entry = await createHistoryEntry(result);

  if (entry.dedupeKey) {
    const duplicate = entries.find((existingEntry) => existingEntry.dedupeKey === entry.dedupeKey);

    if (duplicate) {
      return {
        status: 'duplicate',
        entries,
        entry: duplicate,
      };
    }
  }

  const nextEntries = [entry, ...entries].slice(0, MAX_HISTORY_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));

  return {
    status: 'created',
    entries: nextEntries,
    entry,
  };
}

export async function clearScanHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function removeScanHistoryEntry(id: string): Promise<ScanHistoryEntry[]> {
  const entries = await loadScanHistory();
  const nextEntries = entries.filter((entry) => entry.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
  return nextEntries;
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

export function buildWeeklyTaxSeries(entries: ScanHistoryEntry[], now = new Date()): HistorySeriesPoint[] {
  const weekStart = startOfWeek(now);
  return Array.from({ length: 7 }, (_, index) => {
    const startDate = addDays(weekStart, index);
    const endDate = addDays(startDate, 1);
    return buildSeriesPoint(entries, startDate, endDate, WEEKDAY_LABELS[index] ?? '', formatDateKey(startDate));
  });
}

export function buildMonthlyTaxSeries(entries: ScanHistoryEntry[], now = new Date()): HistorySeriesPoint[] {
  const monthStart = startOfMonth(now);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const startDate = addDays(monthStart, index);
    const endDate = addDays(startDate, 1);
    const day = String(index + 1);
    return buildSeriesPoint(entries, startDate, endDate, day, formatDateKey(startDate));
  });
}

export function buildYearlyTaxSeries(entries: ScanHistoryEntry[], now = new Date()): HistorySeriesPoint[] {
  const year = now.getFullYear();

  return Array.from({ length: 12 }, (_, index) => {
    const startDate = new Date(year, index, 1);
    const endDate = new Date(year, index + 1, 1);
    return buildSeriesPoint(entries, startDate, endDate, MONTH_LABELS[index] ?? '', `${year}-${pad2(index + 1)}`);
  });
}

async function createHistoryEntry(result: SuccessfulScan): Promise<ScanHistoryEntry> {
  const scannedAt = new Date().toISOString();

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scannedAt,
    dedupeKey: await createDedupeKey(result.invoice.accessKey),
    uf: result.invoice.accessKey?.slice(0, 2) === '35' ? 'SP' : undefined,
    issuerName: result.invoice.issuerName,
    totalAmount: result.computation.totalAmount,
    approximateTaxAmount: result.computation.approximateTaxAmount,
    percentage: result.computation.percentage,
    confidence: result.computation.confidence,
    source: result.invoice.source,
  };
}

async function createDedupeKey(accessKey?: string): Promise<string | undefined> {
  if (!accessKey || !ACCESS_KEY_PATTERN.test(accessKey)) {
    return undefined;
  }

  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, accessKey);
  return `nfce-access-key-sha256:${hash}`;
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

function buildSeriesPoint(
  entries: ScanHistoryEntry[],
  startDate: Date,
  endDate: Date,
  label: string,
  key: string,
): HistorySeriesPoint {
  return {
    key,
    label,
    startDate,
    endDate,
    ...summarize(entries.filter((entry) => isInRange(entry.scannedAt, startDate, endDate))),
  };
}

function isOnOrAfter(input: string, date: Date): boolean {
  const parsed = new Date(input);
  return Number.isFinite(parsed.getTime()) && parsed >= date;
}

function isInRange(input: string, startDate: Date, endDate: Date): boolean {
  const parsed = new Date(input);
  return Number.isFinite(parsed.getTime()) && parsed >= startDate && parsed < endDate;
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

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function isScanHistoryEntry(input: unknown): input is ScanHistoryEntry {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const entry = input as Partial<ScanHistoryEntry>;

  return (
    typeof entry.id === 'string' &&
    typeof entry.scannedAt === 'string' &&
    (entry.dedupeKey === undefined || typeof entry.dedupeKey === 'string') &&
    typeof entry.totalAmount === 'number' &&
    typeof entry.approximateTaxAmount === 'number' &&
    typeof entry.percentage === 'number' &&
    typeof entry.confidence === 'string' &&
    typeof entry.source === 'string'
  );
}

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
