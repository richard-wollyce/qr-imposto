import {
  buildDisplayInsight,
  computeTax,
  maskAccessKey,
  parseBrazilianCurrency,
  type ParsedInvoice,
  type ScanResult,
} from '@qr-imposto/core';

export type NfceQrPayload = {
  originalUrl: string;
  sanitizedUrl: string;
  accessKey?: string;
  ufCode?: string;
  uf?: string;
  host: string;
  query: Record<string, string>;
};

export type NfceQrParseResult =
  | { ok: true; payload: NfceQrPayload }
  | Extract<ScanResult, { ok: false }>;

export type FetchLike = (
  input: string,
  init?: {
    signal?: AbortSignal;
    headers?: Record<string, string>;
  },
) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

const UF_BY_CODE: Record<string, string> = {
  '11': 'RO',
  '12': 'AC',
  '13': 'AM',
  '14': 'RR',
  '15': 'PA',
  '16': 'AP',
  '17': 'TO',
  '21': 'MA',
  '22': 'PI',
  '23': 'CE',
  '24': 'RN',
  '25': 'PB',
  '26': 'PE',
  '27': 'AL',
  '28': 'SE',
  '29': 'BA',
  '31': 'MG',
  '32': 'ES',
  '33': 'RJ',
  '35': 'SP',
  '41': 'PR',
  '42': 'SC',
  '43': 'RS',
  '50': 'MS',
  '51': 'MT',
  '52': 'GO',
  '53': 'DF',
};

const ACCESS_KEY_PATTERN = /\b\d{44}\b/;
const MVP_SUPPORTED_UF = 'SP';
const MVP_SUPPORTED_HOSTS = new Set(['www.nfce.fazenda.sp.gov.br']);

export function parseNfceQrUrl(input: string): NfceQrParseResult {
  const trimmed = input.trim();

  if (trimmed.length < 12 || trimmed.length > 4096) {
    return {
      ok: false,
      reason: 'invalid_qr',
      message: 'O QR Code lido não parece conter uma URL de NFC-e válida.',
    };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return {
      ok: false,
      reason: 'invalid_qr',
      message: 'O QR Code não contém uma URL válida.',
    };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return {
      ok: false,
      reason: 'unsupported_url',
      message: 'Por segurança, apenas URLs HTTP ou HTTPS de consulta de NFC-e são aceitas.',
    };
  }

  const query = Object.fromEntries(url.searchParams.entries());
  const accessKey = extractAccessKey(trimmed);
  const ufCode = accessKey?.slice(0, 2);

  return {
    ok: true,
    payload: {
      originalUrl: trimmed,
      sanitizedUrl: maskAccessKey(trimmed),
      accessKey,
      ufCode,
      uf: ufCode ? UF_BY_CODE[ufCode] : undefined,
      host: url.host,
      query,
    },
  };
}

export async function analyzeNfceQrUrl(input: string, fetcher: FetchLike = fetch): Promise<ScanResult> {
  const parsed = parseNfceQrUrl(input);

  if (!parsed.ok) {
    return parsed;
  }

  if (!isSupportedMvpNfce(parsed.payload)) {
    return {
      ok: false,
      reason: 'unsupported_uf',
      message: 'Nesta primeira versao, o QR Imposto consulta NFC-e de SP. Outros estados entram nas proximas versoes.',
    };
  }

  let pageText: string;
  try {
    pageText = await fetchNfcePublicPage(parsed.payload.originalUrl, fetcher);
  } catch {
    return {
      ok: false,
      reason: 'network_error',
      message: 'Não foi possível consultar a NFC-e agora. Tente novamente em alguns instantes.',
    };
  }

  const invoice = parseNfceFromText(pageText, parsed.payload);
  const computation = computeTax(invoice);

  if ('ok' in computation) {
    return computation;
  }

  return {
    ok: true,
    invoice,
    computation,
    insight: buildDisplayInsight(computation),
  };
}

export async function fetchNfcePublicPage(url: string, fetcher: FetchLike = fetch): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetcher(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`NFC-e public page returned ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function isSupportedMvpNfce(payload: Pick<NfceQrPayload, 'uf' | 'host'>): boolean {
  if (payload.uf === MVP_SUPPORTED_UF) {
    return true;
  }

  return MVP_SUPPORTED_HOSTS.has(payload.host.toLowerCase());
}

export function parseNfceFromText(input: string, payload?: Partial<NfceQrPayload>): ParsedInvoice {
  const xmlInvoice = parseXmlInvoice(input, payload);

  if (xmlInvoice.totalAmount || xmlInvoice.approximateTaxAmount) {
    return xmlInvoice;
  }

  const text = htmlToText(input);
  const totalAmount = findCurrencyAfterLabels(text, [
    'valor total da nota',
    'valor total',
    'valor a pagar',
    'total da nfce',
    'total r$',
  ]);
  const approximateTaxAmount = findCurrencyAfterLabels(text, [
    'valor aproximado dos tributos',
    'tributos aproximados',
    'tributos totais incidentes',
    'total aproximado de tributos',
    'total de tributos',
    'lei 12.741',
  ]);

  return {
    accessKey: payload?.accessKey ?? extractAccessKey(text),
    issuerName: findIssuerName(text),
    issuedAt: findIssuedAt(text),
    totalAmount,
    approximateTaxAmount,
    source: 'public_page',
    rawLabels: collectMatchedLabels(text),
  };
}

export function extractAccessKey(input: string): string | undefined {
  const decoded = safeDecodeURIComponent(input);
  const direct = decoded.match(ACCESS_KEY_PATTERN)?.[0];

  if (direct) {
    return direct;
  }

  const p = new URLSearchParams(decoded.split('?')[1] ?? '').get('p');
  return p?.match(ACCESS_KEY_PATTERN)?.[0];
}

function parseXmlInvoice(input: string, payload?: Partial<NfceQrPayload>): ParsedInvoice {
  const total = parseXmlNumber(tagValue(input, 'vNF'));
  const tax = parseXmlNumber(tagValue(input, 'vTotTrib'));

  return {
    accessKey: payload?.accessKey ?? tagValue(input, 'chNFe') ?? extractAccessKey(input),
    issuerName: tagValue(input, 'xNome'),
    issuerDocument: tagValue(input, 'CNPJ'),
    issuedAt: tagValue(input, 'dhEmi'),
    totalAmount: total,
    approximateTaxAmount: tax,
    source: total || tax ? 'xml' : 'unknown',
    rawLabels: [],
  };
}

function tagValue(input: string, tag: string): string | undefined {
  const match = input.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
  return match?.[1]?.trim();
}

function parseXmlNumber(input?: string): number | undefined {
  if (!input) {
    return undefined;
  }

  const value = Number(input.replace(',', '.'));
  return Number.isFinite(value) ? value : undefined;
}

function htmlToText(input: string): string {
  return decodeHtmlEntities(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function findCurrencyAfterLabels(text: string, labels: string[]): number | undefined {
  const folded = fold(text);

  for (const label of labels) {
    const index = folded.indexOf(fold(label));

    if (index === -1) {
      continue;
    }

    const window = text.slice(index, index + 280);
    const value = parseCurrencyWithSymbol(window) ?? parseBrazilianCurrency(window);

    if (typeof value === 'number') {
      return value;
    }
  }

  return undefined;
}

function parseCurrencyWithSymbol(input: string): number | undefined {
  const match = input.match(/R\$\s*:?\s*\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|R\$\s*:?\s*\d+(?:,\d{1,2})?/i);

  if (!match?.[0]) {
    return undefined;
  }

  return parseBrazilianCurrency(match[0]);
}

function findIssuerName(text: string): string | undefined {
  const compact = text.replace(/\s+/g, ' ').trim();
  const labelMatch = compact.match(/(?:raz[aã]o social|emitente|estabelecimento)\s*:?\s*([^|]{4,80})/i);

  if (labelMatch?.[1]) {
    return cleanLabelValue(labelMatch[1]);
  }

  return compact.split(/\s{2,}|\|/)[0]?.slice(0, 80).trim() || undefined;
}

function findIssuedAt(text: string): string | undefined {
  return text.match(/\b\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}(?::\d{2})?)?\b/)?.[0];
}

function collectMatchedLabels(text: string): string[] {
  const folded = fold(text);
  return [
    'valor total',
    'valor aproximado dos tributos',
    'tributos aproximados',
    'tributos totais incidentes',
    'lei 12.741',
  ].filter((label) => folded.includes(fold(label)));
}

function cleanLabelValue(input: string): string {
  return input.replace(/\s{2,}.*/, '').replace(/\bCNPJ\b.*/i, '').trim();
}

function fold(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function safeDecodeURIComponent(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}
