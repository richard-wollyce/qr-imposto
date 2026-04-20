import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { formatCurrency, formatPercentage, type ScanResult } from '@qr-imposto/core';
import { analyzeNfceQrUrl, type FetchLike } from '@qr-imposto/parsers';
import {
  clearScanHistory,
  loadScanHistory,
  saveScanResult,
  summarizeScanHistory,
  type HistorySummary,
  type ScanHistoryEntry,
} from './src/history';

type ScreenState =
  | { status: 'scanning' }
  | { status: 'processing' }
  | { status: 'result'; result: Extract<ScanResult, { ok: true }> }
  | { status: 'history' }
  | { status: 'error'; message: string };

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [screen, setScreen] = useState<ScreenState>({ status: 'scanning' });
  const [lastScannedValue, setLastScannedValue] = useState<string | undefined>();
  const [historyEntries, setHistoryEntries] = useState<ScanHistoryEntry[]>([]);
  const pageFetcher = useMemo<FetchLike>(
    () => (Platform.OS === 'web' ? fetchNfcePageViaProxy : (fetch as FetchLike)),
    [],
  );

  const isScannerActive = screen.status === 'scanning' && permission?.granted;

  useEffect(() => {
    let isMounted = true;

    loadScanHistory()
      .then((entries) => {
        if (isMounted) {
          setHistoryEntries(entries);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBarcodeScanned = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      if (!data || screen.status !== 'scanning' || data === lastScannedValue) {
        return;
      }

      setLastScannedValue(data);
      setScreen({ status: 'processing' });

      const result = await analyzeNfceQrUrl(data, pageFetcher);

      if (result.ok) {
        setScreen({ status: 'result', result });

        try {
          const entries = await saveScanResult(result);
          setHistoryEntries(entries);
        } catch {
          // The scan result stays visible even if local storage is unavailable.
        }
      } else {
        setScreen({ status: 'error', message: result.message });
      }
    },
    [lastScannedValue, pageFetcher, screen.status],
  );

  const resetScanner = useCallback(() => {
    setLastScannedValue(undefined);
    setScreen({ status: 'scanning' });
  }, []);

  const openHistory = useCallback(() => {
    setScreen({ status: 'history' });
  }, []);

  const clearHistory = useCallback(async () => {
    await clearScanHistory();
    setHistoryEntries([]);
  }, []);

  if (!permission) {
    return <LoadingScreen message="Preparando camera..." />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <StatusBar style="dark" />
        <View style={styles.permissionContent}>
          <Text style={styles.brand}>QR Imposto</Text>
          <Text style={styles.permissionTitle}>A camera e necessaria para ler o QR Code da NFC-e.</Text>
          <Text style={styles.permissionText}>
            A leitura acontece no seu dispositivo. No MVP, o historico fica local e nao e salvo em nuvem.
          </Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Permitir camera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (screen.status === 'result') {
    return <ResultScreen result={screen.result} onScanAgain={resetScanner} onOpenHistory={openHistory} />;
  }

  if (screen.status === 'history') {
    return <HistoryScreen entries={historyEntries} onBack={resetScanner} onClear={clearHistory} />;
  }

  if (screen.status === 'error') {
    return <ErrorScreen message={screen.message} onScanAgain={resetScanner} />;
  }

  return (
    <View style={styles.scannerScreen}>
      <StatusBar style="light" />
      {isScannerActive ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
      ) : null}
      <View style={styles.scannerOverlay}>
        <SafeAreaView style={styles.scannerSafeArea}>
          <View style={styles.scannerHeader}>
            <View style={styles.scannerTopBar}>
              <Text style={styles.scannerBrand}>QR Imposto</Text>
              <Pressable style={styles.lightButton} onPress={openHistory}>
                <Text style={styles.lightButtonText}>Historico</Text>
              </Pressable>
            </View>
            <Text style={styles.scannerSubtitle}>Aponte para o QR Code da nota fiscal de compra.</Text>
          </View>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.scannerFooter}>
            {screen.status === 'processing' ? (
              <View style={styles.processingPill}>
                <ActivityIndicator color="#111111" />
                <Text style={styles.processingText}>Consultando NFC-e...</Text>
              </View>
            ) : (
              <Text style={styles.scannerHint}>Use uma NFC-e de SP de mercado, loja, farmacia ou posto.</Text>
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

function ResultScreen({
  result,
  onScanAgain,
  onOpenHistory,
}: {
  result: Extract<ScanResult, { ok: true }>;
  onScanAgain: () => void;
  onOpenHistory: () => void;
}) {
  const percent = useMemo(() => formatPercentage(result.computation.percentage), [result.computation.percentage]);
  const issuer = result.invoice.issuerName ?? 'Estabelecimento nao identificado';

  return (
    <SafeAreaView style={styles.resultScreen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.resultContent}>
        <Text style={styles.brand}>QR Imposto</Text>
        <Text style={styles.resultEyebrow}>{issuer}</Text>
        <Text style={styles.resultTitle}>{result.insight.fact}</Text>
        <Text style={styles.resultContext}>{result.insight.context}</Text>

        <View style={styles.metricGrid}>
          <Metric label="Compra" value={formatCurrency(result.computation.totalAmount)} />
          <Metric label="Tributos" value={formatCurrency(result.computation.approximateTaxAmount)} />
          <Metric label="Peso" value={percent} />
        </View>

        <View style={styles.confidenceBand}>
          <Text style={styles.confidenceLabel}>{result.insight.confidenceLabel}</Text>
          <View style={styles.confidenceTrack}>
            <View
              style={[
                styles.confidenceFill,
                result.computation.confidence === 'high' ? styles.confidenceHigh : styles.confidenceMedium,
              ]}
            />
          </View>
          <Text style={styles.methodology}>{result.insight.methodology}</Text>
        </View>

        <Text style={styles.impactText}>{result.insight.impact}</Text>

        <Pressable style={styles.primaryButton} onPress={onScanAgain}>
          <Text style={styles.primaryButtonText}>Escanear outra nota</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onOpenHistory}>
          <Text style={styles.secondaryButtonText}>Ver acumulados locais</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function HistoryScreen({
  entries,
  onBack,
  onClear,
}: {
  entries: ScanHistoryEntry[];
  onBack: () => void;
  onClear: () => void;
}) {
  const summaries = useMemo(() => summarizeScanHistory(entries), [entries]);
  const latestEntries = entries.slice(0, 6);

  return (
    <SafeAreaView style={styles.resultScreen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.historyContent}>
        <View style={styles.historyTopBar}>
          <Text style={styles.brand}>QR Imposto</Text>
          <Pressable style={styles.secondaryButtonSmall} onPress={onBack}>
            <Text style={styles.secondaryButtonText}>Voltar</Text>
          </Pressable>
        </View>

        <Text style={styles.historyTitle}>Seus tributos aproximados</Text>
        <Text style={styles.historyText}>
          Historico salvo somente neste dispositivo ou navegador. Sem login, sem sincronizacao em nuvem.
        </Text>

        <View style={styles.summaryGrid}>
          <SummaryCard label="Hoje" summary={summaries.today} />
          <SummaryCard label="Semana" summary={summaries.week} />
          <SummaryCard label="Mes" summary={summaries.month} />
          <SummaryCard label="Ano" summary={summaries.year} />
          <SummaryCard label="Total local" summary={summaries.all} wide />
        </View>

        {latestEntries.length > 0 ? (
          <View style={styles.latestSection}>
            <Text style={styles.sectionTitle}>Leituras recentes</Text>
            {latestEntries.map((entry) => (
              <View key={entry.id} style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <Text style={styles.historyItemTitle} numberOfLines={1}>
                    {entry.issuerName ?? 'Estabelecimento nao identificado'}
                  </Text>
                  <Text style={styles.historyItemDate}>{formatHistoryDate(entry.scannedAt)}</Text>
                </View>
                <Text style={styles.historyItemDetail}>
                  {formatCurrency(entry.approximateTaxAmount)} de {formatCurrency(entry.totalAmount)} -{' '}
                  {formatPercentage(entry.percentage)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyHistory}>
            <Text style={styles.sectionTitle}>Nenhuma leitura salva ainda.</Text>
            <Text style={styles.historyText}>Quando uma NFC-e de SP for lida com sucesso, ela aparece aqui.</Text>
          </View>
        )}

        {entries.length > 0 ? (
          <Pressable style={styles.dangerButton} onPress={onClear}>
            <Text style={styles.dangerButtonText}>Limpar historico local</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, summary, wide = false }: { label: string; summary: HistorySummary; wide?: boolean }) {
  const countLabel = summary.count === 1 ? 'nota' : 'notas';

  return (
    <View style={[styles.summaryCard, wide ? styles.summaryCardWide : null]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(summary.approximateTaxAmount)}
      </Text>
      <Text style={styles.summaryDetail}>
        {summary.count} {countLabel} - {formatPercentage(summary.percentage)}
      </Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function ErrorScreen({ message, onScanAgain }: { message: string; onScanAgain: () => void }) {
  return (
    <SafeAreaView style={styles.errorScreen}>
      <StatusBar style="dark" />
      <View style={styles.errorContent}>
        <Text style={styles.brand}>QR Imposto</Text>
        <Text style={styles.errorTitle}>Nao deu para ler essa NFC-e.</Text>
        <Text style={styles.errorText}>{message}</Text>
        <Pressable style={styles.primaryButton} onPress={onScanAgain}>
          <Text style={styles.primaryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <SafeAreaView style={styles.permissionScreen}>
      <StatusBar style="dark" />
      <View style={styles.loadingContent}>
        <ActivityIndicator color="#111111" />
        <Text style={styles.permissionText}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

async function fetchNfcePageViaProxy(
  input: string,
  init?: {
    signal?: AbortSignal;
  },
) {
  const response = await fetch('/api/nfce-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: input }),
    signal: init?.signal,
  });

  return {
    ok: response.ok,
    status: response.status,
    text: () => response.text(),
  };
}

function formatHistoryDate(input: string): string {
  const date = new Date(input);

  if (!Number.isFinite(date.getTime())) {
    return '';
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  scannerScreen: {
    flex: 1,
    backgroundColor: '#111111',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  scannerSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 22,
  },
  scannerHeader: {
    gap: 8,
  },
  scannerTopBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  scannerBrand: {
    color: '#F8F4EA',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
  },
  lightButton: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F8F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  lightButtonText: {
    color: '#F8F4EA',
    fontSize: 14,
    fontWeight: '800',
  },
  scannerSubtitle: {
    color: '#F8F4EA',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 0,
    maxWidth: 340,
  },
  scanFrame: {
    alignSelf: 'center',
    width: '78%',
    aspectRatio: 1,
    maxWidth: 330,
    maxHeight: 330,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderColor: '#F6C453',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
  },
  cornerBottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 5,
    borderBottomWidth: 5,
  },
  scannerFooter: {
    minHeight: 66,
    justifyContent: 'center',
  },
  scannerHint: {
    color: '#F8F4EA',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  processingPill: {
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: '#F8F4EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  processingText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: '#F8F4EA',
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 18,
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  brand: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  permissionTitle: {
    color: '#111111',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: 0,
  },
  permissionText: {
    color: '#3E3A33',
    fontSize: 16,
    lineHeight: 23,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#F8F4EA',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButtonSmall: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
  resultScreen: {
    flex: 1,
    backgroundColor: '#F8F4EA',
  },
  resultContent: {
    padding: 24,
    gap: 18,
  },
  resultEyebrow: {
    color: '#4E6B4F',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginTop: 18,
  },
  resultTitle: {
    color: '#111111',
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900',
    letterSpacing: 0,
  },
  resultContext: {
    color: '#3E3A33',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    flex: 1,
    minHeight: 88,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DAC7',
    padding: 12,
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: '#6B6254',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  metricValue: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  confidenceBand: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D8CFBA',
    paddingVertical: 16,
    gap: 10,
  },
  confidenceLabel: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
  },
  confidenceTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D8CFBA',
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 5,
  },
  confidenceHigh: {
    width: '100%',
    backgroundColor: '#2F7D4F',
  },
  confidenceMedium: {
    width: '66%',
    backgroundColor: '#C77D2A',
  },
  methodology: {
    color: '#5D5548',
    fontSize: 14,
    lineHeight: 20,
  },
  impactText: {
    color: '#3E3A33',
    fontSize: 16,
    lineHeight: 23,
  },
  historyContent: {
    padding: 24,
    gap: 18,
  },
  historyTopBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyTitle: {
    color: '#111111',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: 0,
  },
  historyText: {
    color: '#3E3A33',
    fontSize: 15,
    lineHeight: 22,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 112,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DAC7',
    padding: 12,
    justifyContent: 'space-between',
  },
  summaryCardWide: {
    flexBasis: '100%',
  },
  summaryValue: {
    color: '#111111',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0,
  },
  summaryDetail: {
    color: '#5D5548',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  latestSection: {
    gap: 10,
  },
  sectionTitle: {
    color: '#111111',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  historyItem: {
    minHeight: 82,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DAC7',
    padding: 12,
    gap: 8,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  historyItemTitle: {
    flex: 1,
    color: '#111111',
    fontSize: 15,
    fontWeight: '900',
  },
  historyItemDate: {
    color: '#6B6254',
    fontSize: 12,
    fontWeight: '800',
  },
  historyItemDetail: {
    color: '#3E3A33',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyHistory: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D8CFBA',
    paddingVertical: 18,
    gap: 8,
  },
  dangerButton: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8A2E2E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  dangerButtonText: {
    color: '#8A2E2E',
    fontSize: 15,
    fontWeight: '900',
  },
  errorScreen: {
    flex: 1,
    backgroundColor: '#F8F4EA',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 18,
  },
  errorTitle: {
    color: '#111111',
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: 0,
  },
  errorText: {
    color: '#5A2B2B',
    fontSize: 16,
    lineHeight: 23,
  },
});
