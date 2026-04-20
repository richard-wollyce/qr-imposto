import { describe, expect, it } from 'vitest';
import {
  buildDisplayInsight,
  computeTax,
  maskAccessKey,
  parseBrazilianCurrency,
} from './index';

describe('parseBrazilianCurrency', () => {
  it('parses Brazilian currency formats', () => {
    expect(parseBrazilianCurrency('R$ 1.234,56')).toBe(1234.56);
    expect(parseBrazilianCurrency('123,45')).toBe(123.45);
    expect(parseBrazilianCurrency('Total: 89,00')).toBe(89);
  });
});

describe('computeTax', () => {
  it('computes approximate tax percentage', () => {
    const result = computeTax({
      totalAmount: 100,
      approximateTaxAmount: 22,
      source: 'xml',
    });

    expect('ok' in result).toBe(false);
    expect(result).toMatchObject({
      totalAmount: 100,
      approximateTaxAmount: 22,
      percentage: 22,
      confidence: 'high',
      method: 'xml_vTotTrib',
    });
  });

  it('returns a scan failure when values are missing', () => {
    const result = computeTax({ source: 'public_page' });

    expect(result).toMatchObject({
      ok: false,
      reason: 'missing_total',
    });
  });
});

describe('buildDisplayInsight', () => {
  it('uses approximate-tax language', () => {
    const insight = buildDisplayInsight({
      totalAmount: 100,
      approximateTaxAmount: 22,
      percentage: 22,
      confidence: 'high',
      method: 'xml_vTotTrib',
    });

    expect(insight.fact).toContain('tributos aproximados');
    expect(insight.context).toContain('22%');
    expect(insight.methodology).toContain('vTotTrib');
  });
});

describe('maskAccessKey', () => {
  it('masks 44-digit NFC-e access keys', () => {
    expect(maskAccessKey('12345678901234567890123456789012345678901234')).toBe(
      '123456********************************901234',
    );
  });
});
