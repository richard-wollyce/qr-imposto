import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useCameraPermissions } from 'expo-camera';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ArrowLeft,
  ChartColumn,
  History as HistoryIcon,
  QrCode,
  ScanLine,
  Share2,
  Trash2,
} from 'lucide-react-native';
import { confidenceLabel as formatConfidenceLabel, formatCurrency, formatPercentage, type ScanResult } from '@qr-imposto/core';
import { analyzeNfceQrUrl, type FetchLike } from '@qr-imposto/parsers';
import {
  buildMonthlyTaxSeries,
  buildWeeklyTaxSeries,
  buildYearlyTaxSeries,
  clearScanHistory,
  loadScanHistory,
  removeScanHistoryEntry,
  saveScanResult,
  summarizeScanHistory,
  type HistorySeriesPoint,
  type HistorySummary,
  type ScanHistoryEntry,
} from './src/history';
import {
  buildScanShareCardPayload,
  buildSummaryShareCardPayload,
  type ShareCardPayload,
  type SharePeriodKey,
} from './src/share-card';
import {
  captureShareCardImage,
  shareImageWithSystem,
  type ShareCardCaptureRef,
} from './src/share-capture';
import { QrScannerView } from './src/QrScannerView';

type ScreenState =
  | { status: 'scanning' }
  | { status: 'processing' }
  | { status: 'result'; result: Extract<ScanResult, { ok: true }> }
  | { status: 'history' }
  | { status: 'insights' }
  | { status: 'error'; message: string };

type MainTab = 'scanner' | 'history' | 'insights';

type ShareState =
  | { status: 'idle' }
  | { status: 'sharing'; action: ShareActionId }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

type ShareActionId = 'system';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [screen, setScreen] = useState<ScreenState>({ status: 'scanning' });
  const [lastScannedValue, setLastScannedValue] = useState<string | undefined>();
  const [historyEntries, setHistoryEntries] = useState<ScanHistoryEntry[]>([]);
  const [historyNotice, setHistoryNotice] = useState<string | undefined>();
  const isHandlingScanRef = useRef(false);
  const pageFetcher = useMemo<FetchLike>(() => fetch as FetchLike, []);

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

  const handleQrScanned = useCallback(
    async (data: string) => {
      const scannedValue = data.trim();

      if (
        !scannedValue ||
        screen.status !== 'scanning' ||
        isHandlingScanRef.current ||
        scannedValue === lastScannedValue
      ) {
        return;
      }

      isHandlingScanRef.current = true;
      setLastScannedValue(scannedValue);
      setScreen({ status: 'processing' });

      const result = await analyzeNfceQrUrl(scannedValue, pageFetcher);

      if (result.ok) {
        setScreen({ status: 'result', result });

        try {
          const saveOutcome = await saveScanResult(result);
          setHistoryEntries(saveOutcome.entries);
          setHistoryNotice(
            saveOutcome.status === 'duplicate'
              ? 'Esta NFC-e já estava no histórico. Não somamos novamente.'
              : undefined,
          );
        } catch {
          setHistoryNotice(undefined);
          // The scan result stays visible even if local storage is unavailable.
        }
      } else {
        setScreen({ status: 'error', message: result.message });
      }
    },
    [lastScannedValue, pageFetcher, screen.status],
  );

  const handleScannerError = useCallback(
    (message: string) => {
      if (screen.status === 'scanning') {
        setScreen({ status: 'error', message });
      }
    },
    [screen.status],
  );

  const resetScanner = useCallback(() => {
    isHandlingScanRef.current = false;
    setLastScannedValue(undefined);
    setHistoryNotice(undefined);
    setScreen({ status: 'scanning' });
  }, []);

  const selectMainTab = useCallback(
    (tab: MainTab) => {
      if (tab === 'scanner') {
        resetScanner();
        return;
      }

      isHandlingScanRef.current = false;
      setLastScannedValue(undefined);
      setHistoryNotice(undefined);
      setScreen({ status: tab });
    },
    [resetScanner],
  );

  const openHistory = useCallback(() => {
    selectMainTab('history');
  }, [selectMainTab]);

  const openInsights = useCallback(() => {
    selectMainTab('insights');
  }, [selectMainTab]);

  const clearHistory = useCallback(async () => {
    await clearScanHistory();
    setHistoryEntries([]);
    setHistoryNotice(undefined);
  }, []);

  const removeHistoryEntry = useCallback(async (id: string) => {
    const entries = await removeScanHistoryEntry(id);
    setHistoryEntries(entries);
  }, []);

  if (!permission) {
    return <LoadingScreen message="Preparando câmera..." />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <StatusBar style="dark" />
        <View
          style={[
            styles.permissionContent,
            {
              paddingTop: Math.max(insets.top + 16, 32),
              paddingBottom: Math.max(insets.bottom + 28, 52),
            },
          ]}
        >
          <Text style={styles.brand}>QR Imposto</Text>
          <Text style={styles.permissionTitle}>A câmera é necessária para ler o QR Code da NFC-e.</Text>
          <Text style={styles.permissionText}>
            A leitura acontece no seu dispositivo. No MVP, o histórico fica local e não é salvo em nuvem.
          </Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Permitir câmera</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (screen.status === 'result') {
    return (
      <ResultScreen
        result={screen.result}
        historyNotice={historyNotice}
        onScanAgain={resetScanner}
        onOpenHistory={openHistory}
        onOpenInsights={openInsights}
      />
    );
  }

  if (screen.status === 'history') {
    return (
      <HistoryScreen
        entries={historyEntries}
        onSelectTab={selectMainTab}
        onClear={clearHistory}
        onRemoveEntry={removeHistoryEntry}
      />
    );
  }

  if (screen.status === 'insights') {
    return <InsightsScreen entries={historyEntries} onSelectTab={selectMainTab} />;
  }

  if (screen.status === 'error') {
    return <ErrorScreen message={screen.message} onScanAgain={resetScanner} />;
  }

  return (
    <View style={styles.scannerScreen}>
      <StatusBar style="light" />
      {isScannerActive ? (
        <QrScannerView
          active={isScannerActive}
          style={StyleSheet.absoluteFill}
          onScan={handleQrScanned}
          onError={handleScannerError}
        />
      ) : null}
      <View style={styles.scannerOverlay}>
        <View
          style={[
            styles.scannerSafeArea,
            {
              paddingTop: Math.max(insets.top + 14, 32),
              paddingBottom: Math.max(insets.bottom + 112, 132),
            },
          ]}
        >
          <View style={styles.scannerHeader}>
            <View style={styles.scannerTopBar}>
              <Text style={styles.scannerBrand}>QR Imposto</Text>
              <View style={styles.scannerModePill}>
                <QrCode color="#F8F4EA" size={17} strokeWidth={2.4} />
                <Text style={styles.scannerModeText}>Scanner</Text>
              </View>
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
              <Text style={styles.scannerHint}>Use uma NFC-e de mercado, loja, farmácia ou posto.</Text>
            )}
          </View>
        </View>
        <BottomTabBar
          activeTab="scanner"
          bottomInset={insets.bottom}
          disabled={screen.status === 'processing'}
          onSelectTab={selectMainTab}
          variant="dark"
        />
      </View>
    </View>
  );
}

function BottomTabBar({
  activeTab,
  bottomInset,
  disabled = false,
  onSelectTab,
  variant = 'light',
}: {
  activeTab: MainTab;
  bottomInset: number;
  disabled?: boolean;
  onSelectTab: (tab: MainTab) => void;
  variant?: 'light' | 'dark';
}) {
  const isDark = variant === 'dark';
  const activeColor = isDark ? '#FFFFFF' : '#1349EC';
  const inactiveColor = isDark ? '#B7C5FF' : '#6B7280';
  const tabItems = [
    {
      id: 'scanner' as const,
      label: 'Scanner',
      icon: (color: string) => <ScanLine color={color} size={21} strokeWidth={2.4} />,
    },
    {
      id: 'history' as const,
      label: 'Histórico',
      icon: (color: string) => <HistoryIcon color={color} size={21} strokeWidth={2.4} />,
    },
    {
      id: 'insights' as const,
      label: 'Insights',
      icon: (color: string) => <ChartColumn color={color} size={21} strokeWidth={2.4} />,
    },
  ];

  return (
    <View
      style={[
        styles.bottomTabBar,
        isDark ? styles.bottomTabBarDark : styles.bottomTabBarLight,
        { bottom: Math.max(bottomInset + 8, 16) },
      ]}
    >
      {tabItems.map((item) => {
        const isActive = activeTab === item.id;
        const color = isActive ? activeColor : inactiveColor;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={[
              styles.bottomTabButton,
              isActive ? (isDark ? styles.bottomTabButtonActiveDark : styles.bottomTabButtonActiveLight) : null,
              disabled && !isActive ? styles.disabledButton : null,
            ]}
            onPress={() => onSelectTab(item.id)}
            disabled={disabled && !isActive}
          >
            {item.icon(color)}
            <Text style={[styles.bottomTabLabel, { color }]} numberOfLines={1} adjustsFontSizeToFit>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ResultScreen({
  result,
  historyNotice,
  onScanAgain,
  onOpenHistory,
  onOpenInsights,
}: {
  result: Extract<ScanResult, { ok: true }>;
  historyNotice?: string;
  onScanAgain: () => void;
  onOpenHistory: () => void;
  onOpenInsights: () => void;
}) {
  const insets = useSafeAreaInsets();
  const percent = useMemo(() => formatPercentage(result.computation.percentage), [result.computation.percentage]);
  const shareCardPayload = useMemo(() => buildScanShareCardPayload(result), [result]);
  const issuer = result.invoice.issuerName ?? 'Estabelecimento não identificado';

  return (
    <View style={styles.resultScreen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.resultContent,
          {
            paddingTop: Math.max(insets.top + 16, 32),
            paddingBottom: Math.max(insets.bottom + 34, 64),
          },
        ]}
      >
        <ScreenHeader title="Resumo da nota" subtitle={issuer} onBack={onScanAgain} />

        <View style={styles.resultHeroCard}>
          <Text style={styles.resultHeroLabel}>Tributos aproximados</Text>
          <Text style={styles.resultHeroAmount} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(result.computation.approximateTaxAmount)}
          </Text>
          <Text style={styles.resultHeroDetail}>{percent} do valor pago nesta compra.</Text>
        </View>

        <View style={styles.metricGrid}>
          <Metric label="Compra" value={formatCurrency(result.computation.totalAmount)} />
          <Metric label="Peso" value={percent} />
          <Metric label="Confiança" value={result.insight.confidenceLabel} />
        </View>

        <View style={styles.resultInfoCard}>
          <Text style={styles.resultInfoTitle}>Como calculamos</Text>
          <Text style={styles.resultInfoText}>{result.insight.methodology}</Text>
          <Text style={styles.resultInfoText}>{result.insight.impact}</Text>
        </View>

        {historyNotice ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{historyNotice}</Text>
          </View>
        ) : null}

        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>Card compartilhável</Text>
          <ShareCardPanel payload={shareCardPayload} />
        </View>

        <Pressable style={styles.primaryButton} onPress={onScanAgain}>
          <ScanLine color="#FFFFFF" size={18} strokeWidth={2.5} />
          <Text style={styles.primaryButtonText}>Escanear outra nota</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onOpenHistory}>
          <HistoryIcon color="#1349EC" size={18} strokeWidth={2.5} />
          <Text style={styles.secondaryButtonText}>Ver histórico</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onOpenInsights}>
          <ChartColumn color="#1349EC" size={18} strokeWidth={2.5} />
          <Text style={styles.secondaryButtonText}>Ver insights</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ShareCardPanel({ payload }: { payload: ShareCardPayload }) {
  const cardRef = useRef<View>(null);
  const [shareState, setShareState] = useState<ShareState>({ status: 'idle' });
  const isBusy = shareState.status === 'sharing';
  const primaryLabel =
    shareState.status === 'sharing' && shareState.action === 'system' ? 'Gerando card...' : 'Compartilhar card';

  const shareCard = useCallback(
    async () => {
      if (isBusy) {
        return;
      }

      setShareState({ status: 'sharing', action: 'system' });

      try {
        const image = await captureShareCardImage(cardRef as ShareCardCaptureRef, payload.fileName);
        const didShare = await shareImageWithSystem(image, payload.shareText);

        if (didShare) {
          setShareState({ status: 'success', message: 'Opções de compartilhamento abertas.' });
          return;
        }

        setShareState({ status: 'error', message: 'Compartilhamento indisponível neste dispositivo.' });
      } catch (error) {
        console.error('[share-card]', error);
        setShareState({
          status: 'error',
          message: 'Não deu para gerar o card agora. Tente novamente.',
        });
      }
    },
    [isBusy, payload],
  );

  return (
    <View style={styles.sharePanel}>
      <ShareCardPreview payload={payload} cardRef={cardRef as ShareCardCaptureRef} />

      {shareState.status === 'success' || shareState.status === 'error' ? (
        <View style={shareState.status === 'error' ? styles.errorNoticeBox : styles.noticeBox}>
          <Text style={shareState.status === 'error' ? styles.errorNoticeText : styles.noticeText}>
            {shareState.message}
          </Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.primaryButton, isBusy ? styles.disabledButton : null]}
        onPress={shareCard}
        disabled={isBusy}
      >
        <Share2 color="#FFFFFF" size={18} strokeWidth={2.5} />
        <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
      </Pressable>
    </View>
  );
}

function ShareCardPreview({
  payload,
  cardRef,
}: {
  payload: ShareCardPayload;
  cardRef: ShareCardCaptureRef;
}) {
  return (
    <View style={styles.sharePreviewFrame}>
      <View ref={cardRef} collapsable={false} style={styles.shareCard}>
        <View style={styles.shareCardHeader}>
          <Text style={styles.shareCardBrand}>{payload.brand}</Text>
          <View style={styles.shareCardPill}>
            <Text style={styles.shareCardPillText}>{payload.eyebrow}</Text>
          </View>
        </View>

        <View style={styles.shareCardMain}>
          {payload.primaryIntro ? <Text style={styles.shareCardIntro}>{payload.primaryIntro}</Text> : null}
          <Text style={styles.shareCardAmount} numberOfLines={1} adjustsFontSizeToFit>
            {payload.primaryAmount}
          </Text>
          <Text style={styles.shareCardTaxLabel}>{payload.primaryLabel}</Text>
        </View>

        <View style={styles.shareCardStats}>
          {payload.statRows.map((row) => (
            <View key={row.label} style={styles.shareCardStatRow}>
              <Text style={styles.shareCardStatLabel} numberOfLines={1} adjustsFontSizeToFit>
                {row.label}
              </Text>
              <Text style={styles.shareCardStatValue} numberOfLines={1} adjustsFontSizeToFit>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.shareCardFooter}>
          <Text style={styles.shareCardUrl}>{payload.url}</Text>
        </View>
      </View>
    </View>
  );
}

function HistoryScreen({
  entries,
  onSelectTab,
  onClear,
  onRemoveEntry,
}: {
  entries: ScanHistoryEntry[];
  onSelectTab: (tab: MainTab) => void;
  onClear: () => void;
  onRemoveEntry: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.resultScreen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.historyContent,
          {
            paddingTop: Math.max(insets.top + 16, 32),
            paddingBottom: Math.max(insets.bottom + 112, 132),
          },
        ]}
      >
        <ScreenHeader
          title="Histórico"
          subtitle="NFC-es salvas somente neste dispositivo. Sem login, sem sincronização em nuvem."
          onBack={() => onSelectTab('scanner')}
        />

        {entries.length > 0 ? (
          <View style={styles.latestSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notas escaneadas</Text>
              <Text style={styles.sectionCount}>{entries.length} leituras</Text>
            </View>
            {entries.map((entry) => (
              <HistoryEntryCard key={entry.id} entry={entry} onRemove={() => onRemoveEntry(entry.id)} />
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
            <Text style={styles.dangerButtonText}>Limpar histórico local</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <BottomTabBar activeTab="history" bottomInset={insets.bottom} onSelectTab={onSelectTab} />
    </View>
  );
}

function InsightsScreen({ entries, onSelectTab }: { entries: ScanHistoryEntry[]; onSelectTab: (tab: MainTab) => void }) {
  const insets = useSafeAreaInsets();
  const now = useMemo(() => new Date(), [entries]);
  const summaries = useMemo(() => summarizeScanHistory(entries, now), [entries, now]);
  const weeklySeries = useMemo(() => buildWeeklyTaxSeries(entries, now), [entries, now]);
  const monthlySeries = useMemo(() => buildMonthlyTaxSeries(entries, now), [entries, now]);
  const yearlySeries = useMemo(() => buildYearlyTaxSeries(entries, now), [entries, now]);
  const [selectedSummaryPayload, setSelectedSummaryPayload] = useState<ShareCardPayload | null>(null);
  const openSummaryCard = useCallback((periodKey: SharePeriodKey, summary: HistorySummary) => {
    setSelectedSummaryPayload(buildSummaryShareCardPayload(periodKey, summary));
  }, []);

  return (
    <View style={styles.resultScreen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.insightsContent,
          {
            paddingTop: Math.max(insets.top + 16, 32),
            paddingBottom: Math.max(insets.bottom + 112, 132),
          },
        ]}
      >
        <ScreenHeader
          title="Insights"
          subtitle="Evolução dos tributos aproximados nas NFC-es lidas neste aparelho."
          onBack={() => onSelectTab('scanner')}
        />

        <TodayTotalCard summary={summaries.today} onPress={() => openSummaryCard('today', summaries.today)} />

        <View style={styles.periodGrid}>
          <PeriodInsightCard label="Semana" summary={summaries.week} onPress={() => openSummaryCard('week', summaries.week)} />
          <PeriodInsightCard label="Mês" summary={summaries.month} onPress={() => openSummaryCard('month', summaries.month)} />
          <PeriodInsightCard label="Ano" summary={summaries.year} onPress={() => openSummaryCard('year', summaries.year)} />
        </View>

        <TaxEvolutionCard title="Evolução dos tributos na semana" subtitle="Dia a dia da semana atual" series={weeklySeries} />
        <TaxEvolutionCard title="Evolução dos tributos no mês" subtitle="Dia a dia do mês atual" series={monthlySeries} />
        <TaxEvolutionCard title="Evolução dos tributos no ano" subtitle="Mês a mês do ano atual" series={yearlySeries} />

        <View style={styles.methodologyCard}>
          <Text style={styles.methodologyTitle}>Metodologia</Text>
          <Text style={styles.methodologyBody}>
            Os valores são aproximados e calculados a partir das NFC-es lidas localmente. O histórico não é enviado para
            servidor e pode variar conforme os dados públicos disponíveis em cada nota.
          </Text>
        </View>
      </ScrollView>
      <BottomTabBar activeTab="insights" bottomInset={insets.bottom} onSelectTab={onSelectTab} />
      <Modal
        animationType="slide"
        transparent
        visible={selectedSummaryPayload !== null}
        onRequestClose={() => setSelectedSummaryPayload(null)}
      >
        <View style={styles.shareModalBackdrop}>
          <View style={styles.shareModalSheet}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Card do período</Text>
              <Pressable style={styles.secondaryButtonSmall} onPress={() => setSelectedSummaryPayload(null)}>
                <Text style={styles.secondaryButtonText}>Fechar</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.shareModalContent}>
              {selectedSummaryPayload ? <ShareCardPanel payload={selectedSummaryPayload} /> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ScreenHeader({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <View style={styles.screenHeader}>
      <View style={styles.screenHeaderText}>
        <Text style={styles.brand}>QR Imposto</Text>
        <Text style={styles.historyTitle}>{title}</Text>
        <Text style={styles.historyText}>{subtitle}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar ao scanner" style={styles.iconButton} onPress={onBack}>
        <ArrowLeft color="#111111" size={22} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

function HistoryEntryCard({ entry, onRemove }: { entry: ScanHistoryEntry; onRemove: () => void }) {
  return (
    <View style={styles.historyItem}>
      <View style={styles.historyItemHeader}>
        <View style={styles.historyItemTitleGroup}>
          <Text style={styles.historyItemTitle} numberOfLines={1}>
            {entry.issuerName ?? 'Estabelecimento não identificado'}
          </Text>
          <Text style={styles.historyItemDate}>{formatHistoryDate(entry.scannedAt)}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Remover leitura" style={styles.removeIconButton} onPress={onRemove}>
          <Trash2 color="#8A2E2E" size={18} strokeWidth={2.4} />
        </Pressable>
      </View>
      <View style={styles.historyItemMetrics}>
        <HistoryMetric label="Compra" value={formatCurrency(entry.totalAmount)} tone="purchase" />
        <HistoryMetric label="Impostos" value={formatCurrency(entry.approximateTaxAmount)} tone="tax" />
        <HistoryMetric label="Peso" value={formatPercentage(entry.percentage)} />
      </View>
      <Text style={styles.historyItemDetail}>{formatConfidenceLabel(entry.confidence)}</Text>
    </View>
  );
}

function HistoryMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'purchase' | 'tax';
}) {
  return (
    <View style={styles.historyMetric}>
      <Text style={styles.historyMetricLabel}>{label}</Text>
      <Text
        style={[
          styles.historyMetricValue,
          tone === 'purchase' ? styles.historyMetricValuePurchase : null,
          tone === 'tax' ? styles.historyMetricValueTax : null,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

function TodayTotalCard({ summary, onPress }: { summary: HistorySummary; onPress: () => void }) {
  const countLabel = summary.count === 1 ? 'nota' : 'notas';

  return (
    <Pressable accessibilityRole="button" style={styles.todayCard} onPress={onPress}>
      <View style={styles.todayCardHeader}>
        <Text style={styles.todayCardLabel}>Total do dia</Text>
        <View style={styles.todayCardAction}>
          <Share2 color="#F8F4EA" size={16} strokeWidth={2.4} />
          <Text style={styles.todayCardActionText}>Card</Text>
        </View>
      </View>
      <Text style={styles.todayCardValue} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(summary.approximateTaxAmount)}
      </Text>
      <Text style={styles.todayCardDetail}>
        {summary.count} {countLabel} • {formatPercentage(summary.percentage)} do valor pago
      </Text>
    </Pressable>
  );
}

function PeriodInsightCard({ label, summary, onPress }: { label: string; summary: HistorySummary; onPress: () => void }) {
  const countLabel = summary.count === 1 ? 'nota' : 'notas';

  return (
    <Pressable accessibilityRole="button" style={styles.periodCard} onPress={onPress}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.periodCardValue} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(summary.approximateTaxAmount)}
      </Text>
      <Text style={styles.periodCardDetail}>
        {summary.count} {countLabel} - {formatPercentage(summary.percentage)}
      </Text>
    </Pressable>
  );
}

function TaxEvolutionCard({
  title,
  subtitle,
  series,
}: {
  title: string;
  subtitle: string;
  series: HistorySeriesPoint[];
}) {
  const totalTax = series.reduce((total, point) => total + point.approximateTaxAmount, 0);
  const totalCount = series.reduce((total, point) => total + point.count, 0);
  const countLabel = totalCount === 1 ? 'nota' : 'notas';

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartCardHeader}>
        <View style={styles.chartCardTitleGroup}>
          <Text style={styles.chartCardTitle}>{title}</Text>
          <Text style={styles.chartCardSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.chartTotalPill}>
          <Text style={styles.chartTotalText}>{formatCurrency(totalTax)}</Text>
        </View>
      </View>
      <TaxLineChart series={series} />
      <Text style={styles.chartCardFooter}>
        {totalCount} {countLabel} no período
      </Text>
    </View>
  );
}

function TaxLineChart({ series }: { series: HistorySeriesPoint[] }) {
  const chartPoints = buildChartPoints(series);
  const linePath = buildLinePath(chartPoints);
  const areaPath = buildAreaPath(chartPoints);
  const labels = buildChartLabels(series);
  const hasValues = series.some((point) => point.approximateTaxAmount > 0);

  return (
    <View style={styles.chartBox}>
      <Svg width="100%" height={132} viewBox="0 0 320 132">
        <Path d="M 16 108 H 304" stroke="#D9E0EF" strokeWidth={1} />
        <Path d="M 16 72 H 304" stroke="#EEF2F8" strokeWidth={1} />
        <Path d="M 16 36 H 304" stroke="#EEF2F8" strokeWidth={1} />
        {areaPath ? <Path d={areaPath} fill="#EAF0FF" /> : null}
        {linePath ? <Path d={linePath} fill="none" stroke="#1349EC" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {chartPoints
          .filter((point) => series.length <= 12 || point.index === 0 || point.index === series.length - 1 || point.value > 0)
          .map((point) => (
            <Circle key={`${point.index}-${point.x}`} cx={point.x} cy={point.y} r={4} fill={point.value > 0 ? '#1349EC' : '#AEB8CB'} />
          ))}
      </Svg>
      <View style={styles.chartAxisLabels}>
        {labels.map((label) => (
          <Text key={label} style={styles.chartAxisLabel}>
            {label}
          </Text>
        ))}
      </View>
      {!hasValues ? <Text style={styles.chartEmptyText}>Sem leituras neste período.</Text> : null}
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
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.errorScreen}>
      <StatusBar style="dark" />
      <View
        style={[
          styles.errorContent,
          {
            paddingTop: Math.max(insets.top + 16, 32),
            paddingBottom: Math.max(insets.bottom + 28, 52),
          },
        ]}
      >
        <Text style={styles.brand}>QR Imposto</Text>
        <Text style={styles.errorTitle}>Não deu para ler essa NFC-e.</Text>
        <Text style={styles.errorText}>{message}</Text>
        <Pressable style={styles.primaryButton} onPress={onScanAgain}>
          <Text style={styles.primaryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LoadingScreen({ message }: { message: string }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.permissionScreen}>
      <StatusBar style="dark" />
      <View
        style={[
          styles.loadingContent,
          {
            paddingTop: Math.max(insets.top + 16, 32),
            paddingBottom: Math.max(insets.bottom + 28, 52),
          },
        ]}
      >
        <ActivityIndicator color="#111111" />
        <Text style={styles.permissionText}>{message}</Text>
      </View>
    </View>
  );
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

type ChartPoint = {
  index: number;
  value: number;
  x: number;
  y: number;
};

function buildChartPoints(series: HistorySeriesPoint[]): ChartPoint[] {
  const left = 16;
  const right = 304;
  const top = 18;
  const bottom = 108;
  const maxValue = Math.max(...series.map((point) => point.approximateTaxAmount), 1);
  const divisor = Math.max(series.length - 1, 1);

  return series.map((point, index) => {
    const x = series.length === 1 ? (left + right) / 2 : left + ((right - left) * index) / divisor;
    const ratio = point.approximateTaxAmount / maxValue;
    const y = bottom - (bottom - top) * ratio;

    return {
      index,
      value: point.approximateTaxAmount,
      x,
      y,
    };
  });
}

function buildLinePath(points: ChartPoint[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
}

function buildAreaPath(points: ChartPoint[]): string {
  if (points.length === 0) {
    return '';
  }

  const bottom = 108;
  const linePath = buildLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];

  return `${linePath} L ${last.x.toFixed(2)} ${bottom} L ${first.x.toFixed(2)} ${bottom} Z`;
}

function buildChartLabels(series: HistorySeriesPoint[]): string[] {
  if (series.length === 0) {
    return [];
  }

  const middle = series[Math.floor((series.length - 1) / 2)]?.label;
  const labels = [series[0]?.label, middle, series[series.length - 1]?.label].filter(Boolean) as string[];
  return Array.from(new Set(labels));
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
  scannerModePill: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(248, 244, 234, 0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
  },
  scannerModeText: {
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
  bottomTabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 6,
    gap: 6,
  },
  bottomTabBarDark: {
    backgroundColor: '#0F33B5',
    borderColor: 'rgba(248, 244, 234, 0.2)',
  },
  bottomTabBarLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E0EF',
  },
  bottomTabButton: {
    flex: 1,
    minWidth: 0,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bottomTabButtonActiveDark: {
    backgroundColor: '#3154D4',
  },
  bottomTabButtonActiveLight: {
    backgroundColor: '#ECF2FF',
  },
  bottomTabLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: '#F6F8FE',
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
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
    color: '#5D6472',
    fontSize: 16,
    lineHeight: 23,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: '#1349EC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.62,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9D4EA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  secondaryButtonSmall: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9D4EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: '#1349EC',
    fontSize: 15,
    fontWeight: '800',
  },
  resultScreen: {
    flex: 1,
    backgroundColor: '#F6F8FE',
  },
  resultContent: {
    padding: 24,
    gap: 16,
  },
  resultHeroCard: {
    minHeight: 188,
    borderRadius: 8,
    backgroundColor: '#1349EC',
    padding: 18,
    justifyContent: 'space-between',
    gap: 12,
  },
  resultHeroLabel: {
    color: '#D9E3FF',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  resultHeroAmount: {
    color: '#FFFFFF',
    fontSize: 50,
    lineHeight: 58,
    fontWeight: '900',
    letterSpacing: 0,
  },
  resultHeroDetail: {
    color: '#EAF0FF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  resultInfoCard: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E0EF',
    padding: 14,
    gap: 8,
  },
  resultInfoTitle: {
    color: '#111111',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  resultInfoText: {
    color: '#5D6472',
    fontSize: 14,
    lineHeight: 20,
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
    borderColor: '#D9E0EF',
    padding: 12,
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  metricValue: {
    color: '#1349EC',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
  },
  noticeBox: {
    borderRadius: 8,
    backgroundColor: '#ECF2FF',
    borderWidth: 1,
    borderColor: '#D9E0EF',
    padding: 12,
  },
  noticeText: {
    color: '#1349EC',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  errorNoticeBox: {
    borderRadius: 8,
    backgroundColor: '#F7DEDE',
    borderWidth: 1,
    borderColor: '#D9A7A7',
    padding: 12,
  },
  errorNoticeText: {
    color: '#5A2B2B',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  shareSection: {
    gap: 12,
  },
  sharePanel: {
    gap: 12,
  },
  sharePreviewFrame: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  shareCard: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 9 / 16,
    borderRadius: 8,
    backgroundColor: '#1349EC',
    borderWidth: 1,
    borderColor: '#0F33B5',
    padding: 22,
    justifyContent: 'space-between',
  },
  shareCardHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  shareCardBrand: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  shareCardPill: {
    minHeight: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  shareCardPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
  },
  shareCardMain: {
    gap: 8,
  },
  shareCardIntro: {
    color: '#EAF0FF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: 0,
  },
  shareCardAmount: {
    color: '#FFFFFF',
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '900',
    letterSpacing: 0,
  },
  shareCardTaxLabel: {
    color: '#EAF0FF',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    letterSpacing: 0,
  },
  shareCardStats: {
    gap: 10,
  },
  shareCardStatRow: {
    minHeight: 58,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    gap: 4,
  },
  shareCardStatLabel: {
    color: '#B7C5FF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  shareCardStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  shareCardFooter: {
    gap: 6,
  },
  shareCardUrl: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  historyContent: {
    padding: 24,
    gap: 18,
  },
  insightsContent: {
    padding: 24,
    gap: 16,
  },
  screenHeader: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  screenHeaderText: {
    flex: 1,
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9D4EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    color: '#111111',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: 0,
  },
  historyText: {
    color: '#5D6472',
    fontSize: 15,
    lineHeight: 22,
  },
  todayCard: {
    minHeight: 190,
    borderRadius: 8,
    backgroundColor: '#1349EC',
    padding: 18,
    justifyContent: 'space-between',
    gap: 14,
  },
  todayCardHeader: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  todayCardLabel: {
    color: '#F8F4EA',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  todayCardAction: {
    minHeight: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(248, 244, 234, 0.42)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  todayCardActionText: {
    color: '#F8F4EA',
    fontSize: 12,
    fontWeight: '900',
  },
  todayCardValue: {
    color: '#F8F4EA',
    fontSize: 46,
    lineHeight: 54,
    fontWeight: '900',
    letterSpacing: 0,
  },
  todayCardDetail: {
    color: '#D9E3FF',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  periodGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  periodCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 104,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E0EF',
    padding: 12,
    justifyContent: 'space-between',
    gap: 8,
  },
  periodCardValue: {
    color: '#111111',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0,
  },
  periodCardDetail: {
    color: '#5D6472',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  chartCard: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E0EF',
    padding: 14,
    gap: 12,
  },
  chartCardHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  chartCardTitleGroup: {
    flex: 1,
    gap: 3,
  },
  chartCardTitle: {
    color: '#111111',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  chartCardSubtitle: {
    color: '#5D6472',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  chartTotalPill: {
    minHeight: 30,
    maxWidth: 116,
    borderRadius: 8,
    backgroundColor: '#ECF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  chartTotalText: {
    color: '#1349EC',
    fontSize: 12,
    fontWeight: '900',
  },
  chartBox: {
    minHeight: 164,
    gap: 6,
  },
  chartAxisLabels: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chartAxisLabel: {
    color: '#7A8191',
    fontSize: 11,
    fontWeight: '800',
  },
  chartEmptyText: {
    color: '#7A8191',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  chartCardFooter: {
    color: '#5D6472',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  methodologyCard: {
    borderRadius: 8,
    backgroundColor: '#EEF4F1',
    borderWidth: 1,
    borderColor: '#C9DCD1',
    padding: 14,
    gap: 7,
  },
  methodologyTitle: {
    color: '#111111',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  methodologyBody: {
    color: '#3E4B43',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  shareModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.48)',
    justifyContent: 'flex-end',
  },
  shareModalSheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#F6F8FE',
    padding: 18,
    gap: 12,
  },
  shareModalHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  shareModalTitle: {
    flex: 1,
    color: '#111111',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    letterSpacing: 0,
  },
  shareModalContent: {
    gap: 12,
    paddingBottom: 10,
  },
  latestSection: {
    gap: 10,
  },
  sectionHeader: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: '#111111',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  sectionCount: {
    color: '#1349EC',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  historyItem: {
    minHeight: 138,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E0EF',
    padding: 14,
    gap: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  historyItemTitleGroup: {
    flex: 1,
    gap: 4,
  },
  historyItemTitle: {
    flex: 1,
    color: '#111111',
    fontSize: 15,
    fontWeight: '900',
  },
  historyItemDate: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '800',
  },
  historyItemDetail: {
    flex: 1,
    color: '#5D6472',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  historyItemMetrics: {
    minHeight: 58,
    flexDirection: 'row',
    gap: 8,
  },
  historyMetric: {
    flex: 1,
    minWidth: 0,
    borderRadius: 8,
    backgroundColor: '#F4F7FE',
    padding: 9,
    justifyContent: 'space-between',
    gap: 4,
  },
  historyMetricLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  historyMetricValue: {
    color: '#111111',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  historyMetricValuePurchase: {
    color: '#1349EC',
  },
  historyMetricValueTax: {
    color: '#E60000',
  },
  removeIconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6C2C2',
    backgroundColor: '#FFF7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistory: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E0EF',
    padding: 16,
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
    backgroundColor: '#F6F8FE',
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
