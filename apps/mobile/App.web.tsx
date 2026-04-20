import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Download, ExternalLink, HelpCircle, ShieldCheck } from 'lucide-react-native';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const APK_DOWNLOAD_URL = 'https://github.com/richard-wollyce/qr-imposto/releases/latest/download/qr-imposto.apk';
const GITHUB_URL = 'https://github.com/richard-wollyce/qr-imposto';

export default function App() {
  return (
    <SafeAreaProvider>
      <LandingPage />
    </SafeAreaProvider>
  );
}

function LandingPage() {
  const insets = useSafeAreaInsets();

  const openDownload = () => {
    Linking.openURL(APK_DOWNLOAD_URL).catch(() => undefined);
  };

  const openGithub = () => {
    Linking.openURL(GITHUB_URL).catch(() => undefined);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 24, 40),
            paddingBottom: Math.max(insets.bottom + 32, 56),
          },
        ]}
      >
        <View style={styles.hero}>
          <Text style={styles.brand}>QR Imposto</Text>
          <Text style={styles.title}>Descubra os tributos das suas compras.</Text>
          <Text style={styles.description}>
            App nativo Android para escanear QR Codes de NFC-e e mostrar os tributos aproximados informados na
            nota fiscal.
          </Text>

          <View style={styles.actions}>
            <Pressable accessibilityRole="link" style={styles.primaryButton} onPress={openDownload}>
              <Download color="#F8F4EA" size={20} strokeWidth={2.4} />
              <Text style={styles.primaryButtonText}>Baixar APK Android</Text>
            </Pressable>
            <Pressable accessibilityRole="link" style={styles.secondaryButton} onPress={openGithub}>
              <ExternalLink color="#111111" size={20} strokeWidth={2.4} />
              <Text style={styles.secondaryButtonText}>Ver no GitHub</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <InfoBlock
            icon={<Download color="#111111" size={22} strokeWidth={2.4} />}
            title="1. Baixe o arquivo"
            text="O arquivo oficial e servido pelo GitHub Releases com o nome qr-imposto.apk."
          />
          <InfoBlock
            icon={<ShieldCheck color="#111111" size={22} strokeWidth={2.4} />}
            title="2. Autorize a instalacao"
            text="Como ainda nao esta na Play Store, o Android pode pedir permissao para instalar por este navegador."
          />
          <InfoBlock
            icon={<HelpCircle color="#111111" size={22} strokeWidth={2.4} />}
            title="3. Abra e escaneie"
            text="Permita o uso da camera no app e aponte para o QR Code de uma NFC-e suportada."
          />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoBlock({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <View style={styles.infoBlock}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoTextGroup}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F4EA',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 24,
    gap: 34,
  },
  hero: {
    gap: 18,
  },
  brand: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  title: {
    color: '#111111',
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '900',
    letterSpacing: 0,
    maxWidth: 650,
  },
  description: {
    color: '#3E3A33',
    fontSize: 18,
    lineHeight: 27,
    maxWidth: 620,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
  },
  infoGrid: {
    gap: 12,
  },
  infoBlock: {
    minHeight: 92,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DAC7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#F6C453',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextGroup: {
    flex: 1,
    gap: 5,
  },
  infoTitle: {
    color: '#111111',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  infoText: {
    color: '#5C564A',
    fontSize: 14,
    lineHeight: 20,
  },
});
