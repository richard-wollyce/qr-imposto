export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export type TaxComputationMethod =
  | 'xml_vTotTrib'
  | 'public_page_total_tax'
  | 'ibpt_ncm'
  | 'cnae_average'
  | 'unsupported';

export type ParsedInvoice = {
  accessKey?: string;
  issuerName?: string;
  issuerDocument?: string;
  issuedAt?: string;
  totalAmount?: number;
  approximateTaxAmount?: number;
  source: 'xml' | 'public_page' | 'fixture' | 'unknown';
  rawLabels?: string[];
};

export type TaxComputation = {
  totalAmount: number;
  approximateTaxAmount: number;
  percentage: number;
  confidence: ConfidenceLevel;
  method: TaxComputationMethod;
};

export type DisplayInsight = {
  fact: string;
  context: string;
  impact: string;
  confidenceLabel: string;
  methodology: string;
};

export type ScanFailureReason =
  | 'invalid_qr'
  | 'unsupported_url'
  | 'unsupported_uf'
  | 'network_error'
  | 'missing_total'
  | 'missing_tax'
  | 'parse_error';

export type ScanResult =
  | {
      ok: true;
      invoice: ParsedInvoice;
      computation: TaxComputation;
      insight: DisplayInsight;
    }
  | {
      ok: false;
      reason: ScanFailureReason;
      message: string;
    };

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

export function parseBrazilianCurrency(input: string): number | undefined {
  const trimmed = input.trim();
  const match = trimmed.match(/-?\s*(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?/);

  if (!match) {
    return undefined;
  }

  const integerPart = match[1]?.replace(/\./g, '') ?? '';
  const decimalPart = (match[2] ?? '00').padEnd(2, '0');
  const value = Number(`${integerPart}.${decimalPart}`);

  return Number.isFinite(value) ? value : undefined;
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatPercentage(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

export function computeTax(invoice: ParsedInvoice): TaxComputation | ScanResult {
  if (typeof invoice.totalAmount !== 'number' || invoice.totalAmount <= 0) {
    return {
      ok: false,
      reason: 'missing_total',
      message: 'Não foi possível encontrar o valor total desta NFC-e.',
    };
  }

  if (typeof invoice.approximateTaxAmount !== 'number' || invoice.approximateTaxAmount < 0) {
    return {
      ok: false,
      reason: 'missing_tax',
      message: 'Não foi possível encontrar o valor de tributos aproximados desta NFC-e.',
    };
  }

  const method: TaxComputationMethod =
    invoice.source === 'xml' ? 'xml_vTotTrib' : 'public_page_total_tax';

  return {
    totalAmount: invoice.totalAmount,
    approximateTaxAmount: invoice.approximateTaxAmount,
    percentage: (invoice.approximateTaxAmount / invoice.totalAmount) * 100,
    confidence: invoice.source === 'xml' ? 'high' : 'medium',
    method,
  };
}

export function buildDisplayInsight(computation: TaxComputation): DisplayInsight {
  const tax = formatCurrency(computation.approximateTaxAmount);
  const total = formatCurrency(computation.totalAmount);
  const percent = formatPercentage(computation.percentage);

  return {
    fact: `${tax} em tributos aproximados.`,
    context: `Isso representa ${percent} desta compra de ${total}.`,
    impact: `A cada ${formatCurrency(100)} nesse padrão de compra, cerca de ${formatCurrency(
      computation.percentage,
    )} aparecem como tributos aproximados.`,
    confidenceLabel: confidenceLabel(computation.confidence),
    methodology:
      computation.method === 'xml_vTotTrib'
        ? 'Valor lido do campo vTotTrib da NFC-e.'
        : 'Valor identificado na consulta pública da NFC-e.',
  };
}

export function confidenceLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'Alta confiança';
    case 'medium':
      return 'Média confiança';
    case 'low':
      return 'Baixa confiança';
    default:
      return 'Confiança não definida';
  }
}

export function maskAccessKey(input: string): string {
  return input.replace(/\b(\d{6})\d{32}(\d{6})\b/g, '$1********************************$2');
}
