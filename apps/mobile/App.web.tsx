import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import {
	Download,
	ExternalLink,
	HelpCircle,
	ShieldCheck,
} from "lucide-react-native";
import {
	Linking,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import {
	SafeAreaProvider,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

const APK_DOWNLOAD_URL =
	"https://github.com/richard-wollyce/qr-imposto/releases/download/v2.1.0/qr-imposto-v2.1.apk";
const GITHUB_URL = "https://github.com/richard-wollyce/qr-imposto";
const PRIVACY_POLICY_PATH = "/privacidade";
const PRIVACY_POLICY_URL = `https://qr.richardwollyce.com${PRIVACY_POLICY_PATH}`;

export default function App() {
	return (
		<SafeAreaProvider>
			<WebRouter />
		</SafeAreaProvider>
	);
}

function WebRouter() {
	return getCurrentPath() === PRIVACY_POLICY_PATH ? (
		<PrivacyPolicyPage />
	) : (
		<LandingPage />
	);
}

function getCurrentPath(): string {
	if (typeof window === "undefined") {
		return "/";
	}

	return window.location.pathname.replace(/\/+$/, "") || "/";
}

function LandingPage() {
	const insets = useSafeAreaInsets();

	const openDownload = () => {
		Linking.openURL(APK_DOWNLOAD_URL).catch(() => undefined);
	};

	const openGithub = () => {
		Linking.openURL(GITHUB_URL).catch(() => undefined);
	};

	const openPrivacy = () => {
		Linking.openURL(PRIVACY_POLICY_URL).catch(() => undefined);
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
					<Text style={styles.title}>
						Descubra os tributos das suas compras.
					</Text>
					<Text style={styles.description}>
						App nativo Android para escanear QR Codes de NFC-e e mostrar os
						tributos aproximados informados na nota fiscal.
					</Text>

					<View style={styles.actions}>
						<Pressable
							accessibilityRole="link"
							style={styles.primaryButton}
							onPress={openDownload}
						>
							<Download color="#F8F4EA" size={20} strokeWidth={2.4} />
							<Text style={styles.primaryButtonText}>Baixar APK Android</Text>
						</Pressable>
						<Pressable
							accessibilityRole="link"
							style={styles.secondaryButton}
							onPress={openGithub}
						>
							<ExternalLink color="#111111" size={20} strokeWidth={2.4} />
							<Text style={styles.secondaryButtonText}>Ver no GitHub</Text>
						</Pressable>
						<Pressable
							accessibilityRole="link"
							style={styles.secondaryButton}
							onPress={openPrivacy}
						>
							<ShieldCheck color="#111111" size={20} strokeWidth={2.4} />
							<Text style={styles.secondaryButtonText}>Privacidade</Text>
						</Pressable>
					</View>
				</View>

				<View style={styles.infoGrid}>
					<InfoBlock
						icon={<Download color="#111111" size={22} strokeWidth={2.4} />}
						title="1. Baixe o arquivo"
						text="O arquivo oficial e servido pelo GitHub Releases com o nome qr-imposto-v2.1.apk."
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

function PrivacyPolicyPage() {
	const insets = useSafeAreaInsets();

	const openHome = () => {
		Linking.openURL("https://qr.richardwollyce.com").catch(() => undefined);
	};

	return (
		<View style={styles.screen}>
			<StatusBar style="dark" />
			<ScrollView
				contentContainerStyle={[
					styles.policyContent,
					{
						paddingTop: Math.max(insets.top + 24, 40),
						paddingBottom: Math.max(insets.bottom + 32, 56),
					},
				]}
			>
				<View style={styles.policyHeader}>
					<Text style={styles.brand}>QR Imposto</Text>
					<Text style={styles.policyTitle}>Politica de Privacidade</Text>
					<Text style={styles.policyUpdated}>
						Ultima atualizacao: 22/04/2026.
					</Text>
				</View>

				<PolicySection
					title="O que o app faz"
					text="O QR Imposto le QR Codes de NFC-e de compras de consumo e mostra os tributos aproximados informados na nota fiscal. O app nao tem login, cadastro, backend proprio ou sincronizacao em nuvem."
				/>
				<PolicySection
					title="Permissao de camera"
					text="A permissao de camera e usada somente para apontar para o QR Code da NFC-e e identificar a URL publica da nota. O app nao salva fotos ou videos da camera e nao envia imagens para servidor proprio."
				/>
				<PolicySection
					title="Dados tratados"
					text="Para funcionar, o app pode tratar a URL publica HTTPS lida do QR Code, dados exibidos na consulta publica da NFC-e, valor total, tributos aproximados, estabelecimento quando disponivel e resumo local das leituras. Ao escanear uma nota, o app transmite essa URL para a pagina publica da SEFAZ ou Secretaria da Fazenda responsavel, usando HTTPS."
				/>
				<PolicySection
					title="Historico local"
					text="O historico fica salvo somente no dispositivo. Ele pode ser apagado ao limpar o historico no app, desinstalar o app ou apagar os dados locais do aplicativo."
				/>
				<PolicySection
					title="Retencao e exclusao"
					text="O QR Imposto nao mantem retencao propria em servidor. Os dados locais permanecem no dispositivo ate a pessoa limpar o historico no app, desinstalar o app ou apagar os dados locais do aplicativo."
				/>
				<PolicySection
					title="Compartilhamento"
					text="Cards de compartilhamento sao gerados apenas quando a pessoa usa a acao de compartilhar. Esses cards mostram resumo de valores e nao incluem a URL completa do QR Code, chave completa de acesso, HTML, XML ou itens da compra."
				/>
				<PolicySection
					title="Venda de dados"
					text="O QR Imposto nao vende dados pessoais e nao compartilha o historico local com terceiros."
				/>
				<PolicySection
					title="Desenvolvedor e contato"
					text="O QR Imposto e mantido por Richard Wollyce. Para pedidos sobre privacidade ou seguranca, use o canal publico do projeto no GitHub em github.com/richard-wollyce/qr-imposto ou as informacoes disponibilizadas em qr.richardwollyce.com."
				/>

				<Pressable
					accessibilityRole="link"
					style={styles.secondaryButton}
					onPress={openHome}
				>
					<ExternalLink color="#111111" size={20} strokeWidth={2.4} />
					<Text style={styles.secondaryButtonText}>Voltar ao site</Text>
				</Pressable>
			</ScrollView>
		</View>
	);
}

function PolicySection({ title, text }: { title: string; text: string }) {
	return (
		<View style={styles.policySection}>
			<Text style={styles.policySectionTitle}>{title}</Text>
			<Text style={styles.policyText}>{text}</Text>
		</View>
	);
}

function InfoBlock({
	icon,
	title,
	text,
}: {
	icon: ReactNode;
	title: string;
	text: string;
}) {
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
		backgroundColor: "#F8F4EA",
	},
	content: {
		flexGrow: 1,
		justifyContent: "center",
		width: "100%",
		maxWidth: 760,
		alignSelf: "center",
		paddingHorizontal: 24,
		gap: 34,
	},
	policyContent: {
		flexGrow: 1,
		width: "100%",
		maxWidth: 760,
		alignSelf: "center",
		paddingHorizontal: 24,
		gap: 22,
	},
	hero: {
		gap: 18,
	},
	policyHeader: {
		gap: 12,
	},
	brand: {
		color: "#111111",
		fontSize: 18,
		fontWeight: "900",
		letterSpacing: 0,
	},
	title: {
		color: "#111111",
		fontSize: 46,
		lineHeight: 52,
		fontWeight: "900",
		letterSpacing: 0,
		maxWidth: 650,
	},
	policyTitle: {
		color: "#111111",
		fontSize: 42,
		lineHeight: 48,
		fontWeight: "900",
		letterSpacing: 0,
		maxWidth: 650,
	},
	policyUpdated: {
		color: "#5C564A",
		fontSize: 15,
		lineHeight: 22,
		fontWeight: "800",
	},
	description: {
		color: "#3E3A33",
		fontSize: 18,
		lineHeight: 27,
		maxWidth: 620,
	},
	actions: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		marginTop: 8,
	},
	primaryButton: {
		minHeight: 54,
		borderRadius: 8,
		backgroundColor: "#111111",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingHorizontal: 18,
	},
	primaryButtonText: {
		color: "#F8F4EA",
		fontSize: 16,
		fontWeight: "800",
	},
	secondaryButton: {
		minHeight: 54,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#111111",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingHorizontal: 18,
	},
	secondaryButtonText: {
		color: "#111111",
		fontSize: 16,
		fontWeight: "800",
	},
	infoGrid: {
		gap: 12,
	},
	policySection: {
		gap: 7,
	},
	policySectionTitle: {
		color: "#111111",
		fontSize: 20,
		lineHeight: 25,
		fontWeight: "900",
	},
	policyText: {
		color: "#3E3A33",
		fontSize: 16,
		lineHeight: 24,
	},
	infoBlock: {
		minHeight: 92,
		borderRadius: 8,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E2DAC7",
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		padding: 16,
	},
	infoIcon: {
		width: 42,
		height: 42,
		borderRadius: 8,
		backgroundColor: "#F6C453",
		alignItems: "center",
		justifyContent: "center",
	},
	infoTextGroup: {
		flex: 1,
		gap: 5,
	},
	infoTitle: {
		color: "#111111",
		fontSize: 16,
		lineHeight: 21,
		fontWeight: "900",
	},
	infoText: {
		color: "#5C564A",
		fontSize: 14,
		lineHeight: 20,
	},
});
