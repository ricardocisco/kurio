import Decimal from 'decimal.js';

/**
 * ETH amounts travel as decimal strings (e.g. "1.19") to avoid floating point errors.
 * All arithmetic must go through these helpers; never convert an amount to `number`.
 */
export type EthAmount = string;

/** Wei precision: ETH has 18 decimal places. */
export const ETH_DECIMALS = 18;

const EthDecimal = Decimal.clone({ precision: 64, rounding: Decimal.ROUND_HALF_UP });

export const ETH_AMOUNT_PATTERN = /^\d+(\.\d{1,18})?$/;

export function isEthAmount(value: string): value is EthAmount {
  return ETH_AMOUNT_PATTERN.test(value);
}

function toDecimal(value: EthAmount): Decimal {
  return new EthDecimal(value);
}

function toAmount(value: Decimal): EthAmount {
  return value.toDecimalPlaces(ETH_DECIMALS).toFixed();
}

export const ZERO_ETH: EthAmount = '0';

export function addEth(...values: EthAmount[]): EthAmount {
  return toAmount(values.reduce((sum, value) => sum.plus(toDecimal(value)), new EthDecimal(0)));
}

export function subtractEth(minuend: EthAmount, subtrahend: EthAmount): EthAmount {
  const result = toDecimal(minuend).minus(toDecimal(subtrahend));
  return toAmount(Decimal.max(result, 0));
}

export function multiplyEth(value: EthAmount, factor: number | string): EthAmount {
  return toAmount(toDecimal(value).times(new EthDecimal(factor)));
}

/** Applies a percentage (0-100) and returns the discounted portion. */
export function percentageOfEth(value: EthAmount, percentage: number): EthAmount {
  return toAmount(toDecimal(value).times(percentage).dividedBy(100));
}

export function compareEth(a: EthAmount, b: EthAmount): -1 | 0 | 1 {
  return toDecimal(a).comparedTo(toDecimal(b)) as -1 | 0 | 1;
}

export function isEthEqual(a: EthAmount, b: EthAmount): boolean {
  return compareEth(a, b) === 0;
}

export function isZeroEth(value: EthAmount): boolean {
  return toDecimal(value).isZero();
}

interface FormatEthOptions {
  /** Minimum fraction digits shown (Figma shows at least 2, e.g. "1.19 ETH"). */
  minimumFractionDigits?: number;
  /** Maximum fraction digits shown; amounts are never rounded below this precision. */
  maximumFractionDigits?: number;
  withSymbol?: boolean;
}

/**
 * Formats an ETH amount for display while preserving precision.
 * "26.846" -> "26.846 ETH", "1.1" -> "1.10 ETH", "0.016" -> "0.016 ETH".
 */
export function formatEth(value: EthAmount, options: FormatEthOptions = {}): string {
  const { minimumFractionDigits = 2, maximumFractionDigits = 6, withSymbol = true } = options;
  const decimal = toDecimal(value).toDecimalPlaces(maximumFractionDigits, Decimal.ROUND_HALF_UP);
  const [integerPart = '0', fractionPart = ''] = decimal.toFixed().split('.');
  const trimmedFraction = fractionPart.replace(/0+$/, '').padEnd(minimumFractionDigits, '0');
  const formatted = trimmedFraction ? `${integerPart}.${trimmedFraction}` : integerPart;
  return withSymbol ? `${formatted} ETH` : formatted;
}
