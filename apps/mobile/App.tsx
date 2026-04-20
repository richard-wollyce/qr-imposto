import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AtSign, Camera, Copy, Download, MessageCircle, Share2 } from 'lucide-react-native';
import { formatCurrency, formatPercentage, type ScanResult } from '@qr-imposto/core';
import { analyzeNfceQrUrl, type FetchLike } from '@qr-imposto/parsers';
import {
  clearScanHistory,
  loadScanHistory,
  removeScanHistoryEntry,
  saveScanResult,
  summarizeScanHistory,
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
  downloadShareCardImage,
  shareImageWithSystem,
  type ShareCardCaptureRef,
} from './src/share-capture';
import { QrScannerView } from './src/QrScannerView';

type ScreenState =
  | { status: 'scanning' }
  | { status: 'processing' }
  | { status: 'result'; result: Extract<ScanResult, { ok: true }> }
  | { status: 'history' }
  | { status: 'error'; message: string };

type ShareState =
  | { status: 'idle' }
  | { status: 'sharing'; action: ShareActionId }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

type ShareActionId = 'system' | 'whatsapp' | 'instagram' | 'x' | 'copy' | 'download';

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
  const [hasBypassedPromo, setHasBypassedPromo] = useState(Platform.OS !== 'web');
  const [screen, setScreen] = useState<ScreenState>({ status: 'scanning' });
  const [lastScannedValue, setLastScannedValue] = useState<string | undefined>();
  const [historyEntries, setHistoryEntries] = useState<ScanHistoryEntry[]>([]);
  const [historyNotice, setHistoryNotice] = useState<string | undefined>();
  const isHandlingScanRef = useRef(false);
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

  const openHistory = useCallback(() => {
    setScreen({ status: 'history' });
  }, []);

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

  if (!hasBypassedPromo) {
    return <PromoScreen onBypass={() => setHasBypassedPromo(true)} />;
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
      />
    );
  }

  if (screen.status === 'history') {
    return (
      <HistoryScreen
        entries={historyEntries}
        onBack={resetScanner}
        onClear={clearHistory}
        onRemoveEntry={removeHistoryEntry}
      />
    );
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
              paddingBottom: Math.max(insets.bottom + 28, 54),
            },
          ]}
        >
          <View style={styles.scannerHeader}>
            <View style={styles.scannerTopBar}>
              <Text style={styles.scannerBrand}>QR Imposto</Text>
              <Pressable style={styles.lightButton} onPress={openHistory}>
                <Text style={styles.lightButtonText}>Histórico</Text>
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
              <Text style={styles.scannerHint}>Use uma NFC-e de SP de mercado, loja, farmácia ou posto.</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function ResultScreen({
  result,
  historyNotice,
  onScanAgain,
  onOpenHistory,
}: {
  result: Extract<ScanResult, { ok: true }>;
  historyNotice?: string;
  onScanAgain: () => void;
  onOpenHistory: () => void;
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

        {historyNotice ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{historyNotice}</Text>
          </View>
        ) : null}

        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>Card compartilhável</Text>
          <ShareCardPanel payload={shareCardPayload} />
        </View>

        <Pressable style={styles.secondaryButton} onPress={onScanAgain}>
          <Text style={styles.secondaryButtonText}>Escanear outra nota</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onOpenHistory}>
          <Text style={styles.secondaryButtonText}>Ver acumulados locais</Text>
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
    shareState.status === 'sharing' && shareState.action === 'system' ? 'Gerando card...' : 'Compartilhar imagem';

  const runAction = useCallback(
    async (action: ShareActionId) => {
      if (isBusy) {
        return;
      }

      setShareState({ status: 'sharing', action });

      try {
        if (action === 'copy') {
          await Clipboard.setStringAsync(payload.shareText);
          setShareState({ status: 'success', message: 'Texto e link copiados.' });
          return;
        }

        if (action === 'whatsapp') {
          await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(payload.shareText)}`);
          setShareState({ status: 'success', message: 'Link aberto para compartilhar no WhatsApp.' });
          return;
        }

        if (action === 'x') {
          await Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(payload.shareText)}`);
          setShareState({ status: 'success', message: 'Link aberto para compartilhar no X.' });
          return;
        }

        const image = await captureShareCardImage(cardRef as ShareCardCaptureRef, payload.fileName);

        if (action === 'download') {
          await downloadShareCardImage(image);
          setShareState({ status: 'success', message: 'Card baixado como PNG.' });
          return;
        }

        const didShare = await shareImageWithSystem(image, payload.shareText);

        if (didShare) {
          setShareState({ status: 'success', message: 'Card pronto para compartilhar como imagem.' });
          return;
        }

        await downloadShareCardImage(image);
        setShareState({
          status: 'success',
          message:
            action === 'instagram'
              ? 'Imagem baixada. Publique no Instagram pelo app.'
              : 'Este navegador não anexou a imagem. Baixamos o PNG.',
        });
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
        onPress={() => runAction('system')}
        disabled={isBusy}
      >
        <Share2 color="#F8F4EA" size={18} strokeWidth={2.5} />
        <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
      </Pressable>

      <View style={styles.shareActionRow}>
        <ShareActionButton
          label="WhatsApp"
          disabled={isBusy}
          onPress={() => runAction('whatsapp')}
          icon={<MessageCircle color="#111111" size={21} strokeWidth={2.4} />}
        />
        <ShareActionButton
          label="Instagram"
          disabled={isBusy}
          onPress={() => runAction('instagram')}
          icon={<Camera color="#111111" size={21} strokeWidth={2.4} />}
        />
        <ShareActionButton
          label="X"
          disabled={isBusy}
          onPress={() => runAction('x')}
          icon={<AtSign color="#111111" size={21} strokeWidth={2.4} />}
        />
        <ShareActionButton
          label="Copiar"
          disabled={isBusy}
          onPress={() => runAction('copy')}
          icon={<Copy color="#111111" size={21} strokeWidth={2.4} />}
        />
        <ShareActionButton
          label="Download"
          disabled={isBusy}
          onPress={() => runAction('download')}
          icon={<Download color="#111111" size={21} strokeWidth={2.4} />}
        />
      </View>
    </View>
  );
}

function ShareActionButton({
  label,
  icon,
  disabled,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      style={[styles.shareActionButton, disabled ? styles.disabledShareActionButton : null]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.shareActionIcon}>{icon}</View>
      <Text style={styles.shareActionLabel} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </Pressable>
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
            <Text style={styles.shareCardPillText}>OPEN SOURCE</Text>
          </View>
        </View>

        <View style={styles.shareCardMain}>
          <Text style={styles.shareCardEyebrow}>{payload.eyebrow}</Text>
          <Text style={styles.shareCardAmount} numberOfLines={1} adjustsFontSizeToFit>
            {payload.primaryAmount}
          </Text>
          <Text style={styles.shareCardTaxLabel}>{payload.primaryLabel}</Text>
        </View>

        <View style={styles.shareCardStats}>
          {payload.statRows.map((row) => (
            <View key={row.label} style={styles.shareCardStatRow}>
              <Text style={styles.shareCardStatLabel}>{row.label}</Text>
              <Text style={styles.shareCardStatValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.shareCardMethodology}>
          <Text style={styles.shareCardMethodologyText} numberOfLines={2}>
            {payload.note}
          </Text>
        </View>

        <View style={styles.shareCardFooter}>
          <Text style={styles.shareCardCta}>{payload.cta}</Text>
          <Text style={styles.shareCardUrl}>{payload.url}</Text>
          <Text style={styles.shareCardSignature}>{payload.signature}</Text>
        </View>
      </View>
    </View>
  );
}

function HistoryScreen({
  entries,
  onBack,
  onClear,
  onRemoveEntry,
}: {
  entries: ScanHistoryEntry[];
  onBack: () => void;
  onClear: () => void;
  onRemoveEntry: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const summaries = useMemo(() => summarizeScanHistory(entries), [entries]);
  const latestEntries = entries.slice(0, 6);
  const [selectedSummaryPayload, setSelectedSummaryPayload] = useState<ShareCardPayload | null>(null);
  const openSummaryCard = useCallback((periodKey: SharePeriodKey, summary: HistorySummary) => {
    setSelectedSummaryPayload(buildSummaryShareCardPayload(periodKey, summary));
  }, []);

  return (
    <View style={styles.resultScreen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.historyContent,
          {
            paddingTop: Math.max(insets.top + 16, 32),
            paddingBottom: Math.max(insets.bottom + 34, 64),
          },
        ]}
      >
        <View style={styles.historyTopBar}>
          <Text style={styles.brand}>QR Imposto</Text>
          <Pressable style={styles.secondaryButtonSmall} onPress={onBack}>
            <Text style={styles.secondaryButtonText}>Voltar</Text>
          </Pressable>
        </View>

        <Text style={styles.historyTitle}>Seus tributos aproximados</Text>
        <Text style={styles.historyText}>
          Histórico salvo somente neste dispositivo ou navegador. Sem login, sem sincronização em nuvem.
        </Text>

        <View style={styles.summaryGrid}>
          <SummaryCard label="Hoje" summary={summaries.today} onPress={() => openSummaryCard('today', summaries.today)} />
          <SummaryCard label="Semana" summary={summaries.week} onPress={() => openSummaryCard('week', summaries.week)} />
          <SummaryCard label="Mês" summary={summaries.month} onPress={() => openSummaryCard('month', summaries.month)} />
          <SummaryCard label="Ano" summary={summaries.year} onPress={() => openSummaryCard('year', summaries.year)} />
          <SummaryCard label="Total local" summary={summaries.all} wide />
        </View>

        {latestEntries.length > 0 ? (
          <View style={styles.latestSection}>
            <Text style={styles.sectionTitle}>Leituras recentes</Text>
            {latestEntries.map((entry) => (
              <View key={entry.id} style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <Text style={styles.historyItemTitle} numberOfLines={1}>
                    {entry.issuerName ?? 'Estabelecimento não identificado'}
                  </Text>
                  <Text style={styles.historyItemDate}>{formatHistoryDate(entry.scannedAt)}</Text>
                </View>
                <View style={styles.historyItemFooter}>
                  <Text style={styles.historyItemDetail}>
                    {formatCurrency(entry.approximateTaxAmount)} de {formatCurrency(entry.totalAmount)} -{' '}
                    {formatPercentage(entry.percentage)}
                  </Text>
                  <Pressable style={styles.removeButton} onPress={() => onRemoveEntry(entry.id)}>
                    <Text style={styles.removeButtonText}>Remover</Text>
                  </Pressable>
                </View>
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
            <Text style={styles.dangerButtonText}>Limpar histórico local</Text>
          </Pressable>
        ) : null}
      </ScrollView>
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

function SummaryCard({
  label,
  summary,
  wide = false,
  onPress,
}: {
  label: string;
  summary: HistorySummary;
  wide?: boolean;
  onPress?: () => void;
}) {
  const countLabel = summary.count === 1 ? 'nota' : 'notas';
  const content = (
    <>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(summary.approximateTaxAmount)}
      </Text>
      <Text style={styles.summaryDetail}>
        {summary.count} {countLabel} - {formatPercentage(summary.percentage)}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        style={[styles.summaryCard, wide ? styles.summaryCardWide : null, styles.summaryCardPressable]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.summaryCard, wide ? styles.summaryCardWide : null]}>
      {content}
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

function PromoScreen({ onBypass }: { onBypass: () => void }) {
  const insets = useSafeAreaInsets();

  const handleDownload = () => {
    Linking.openURL('https://github.com/richard-wollyce/qr-imposto/releases/latest/download/qr-imposto.apk').catch(() => {
      // Fallback if the URL fails to open
    });
  };

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
        <Text style={styles.permissionTitle}>Melhor experiência no App Android</Text>
        <Text style={styles.permissionText}>
          O leitor de QR Code pelo navegador das câmeras de alguns celulares pode ser instável. Recomendamos instalar o pqueno app nativo para uma leitura super rápida, com total privacidade e histórico offline.
        </Text>
        <Pressable style={styles.primaryButton} onPress={handleDownload}>
          <Download color="#F8F4EA" size={20} strokeWidth={2.4} style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Baixar App (Recomendado)</Text>
        </Pressable>
        <Pressable style={[styles.secondaryButton, { marginTop: 12 }]} onPress={onBypass}>
          <Text style={styles.secondaryButtonText}>Continuar pelo Navegador</Text>
        </Pressable>
      </View>
    </View>
  );
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
    color: '#3E3A33',
    fontSize: 16,
    lineHeight: 23,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#F8F4EA',
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
  noticeBox: {
    borderRadius: 8,
    backgroundColor: '#EFE6CF',
    borderWidth: 1,
    borderColor: '#D8CFBA',
    padding: 12,
  },
  noticeText: {
    color: '#3E3A33',
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
  shareActionRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 6,
  },
  shareActionButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 66,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DAC7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 5,
  },
  disabledShareActionButton: {
    opacity: 0.58,
  },
  shareActionIcon: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareActionLabel: {
    color: '#111111',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 0,
  },
  shareCard: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 9 / 16,
    borderRadius: 8,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#2F7D4F',
    padding: 20,
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
    color: '#F8F4EA',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  shareCardPill: {
    minHeight: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F6C453',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  shareCardPillText: {
    color: '#F6C453',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
  },
  shareCardMain: {
    gap: 7,
  },
  shareCardEyebrow: {
    color: '#A7D7AF',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  shareCardAmount: {
    color: '#F8F4EA',
    fontSize: 48,
    lineHeight: 54,
    fontWeight: '900',
    letterSpacing: 0,
  },
  shareCardTaxLabel: {
    color: '#F6C453',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: 0,
  },
  shareCardStats: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#355F40',
  },
  shareCardStatRow: {
    minHeight: 52,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#243F2B',
    gap: 3,
  },
  shareCardStatLabel: {
    color: '#A7D7AF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  shareCardStatValue: {
    color: '#F8F4EA',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  shareCardMethodology: {
    minHeight: 48,
    justifyContent: 'center',
  },
  shareCardMethodologyText: {
    color: '#D8CFBA',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  shareCardFooter: {
    gap: 6,
  },
  shareCardCta: {
    color: '#F8F4EA',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  shareCardUrl: {
    color: '#F6C453',
    fontSize: 15,
    fontWeight: '900',
  },
  shareCardSignature: {
    color: '#A7D7AF',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
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
  summaryCardPressable: {
    borderColor: '#111111',
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
  shareModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.48)',
    justifyContent: 'flex-end',
  },
  shareModalSheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#F8F4EA',
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
    flex: 1,
    color: '#3E3A33',
    fontSize: 14,
    lineHeight: 20,
  },
  historyItemFooter: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  removeButton: {
    minHeight: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8A2E2E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  removeButtonText: {
    color: '#8A2E2E',
    fontSize: 12,
    fontWeight: '900',
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
