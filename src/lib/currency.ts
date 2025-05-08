
export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'TRY';

export interface CurrencyDetails {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  baseMultiplier: number; // Multiplier against USD base price
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyDetails> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    baseMultiplier: 1,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    baseMultiplier: 0.93, // Example rate
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    baseMultiplier: 0.79, // Example rate
  },
  TRY: {
    code: 'TRY',
    symbol: '₺',
    name: 'Turkish Lira',
    baseMultiplier: 32.5, // Example rate
  }
};

export const DEFAULT_CURRENCY: SupportedCurrency = 'USD';

// Map country codes to currencies
const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  US: 'USD',
  CA: 'USD',
  GB: 'GBP',
  IE: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  PT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  GR: 'EUR',
  TR: 'TRY',
  // Add more mappings as needed
};

// Get currency from browser locale
export function getCurrencyFromLocale(): SupportedCurrency {
  try {
    const locale = navigator.language;
    const country = locale.split('-')[1] || locale;
    return COUNTRY_TO_CURRENCY[country] || DEFAULT_CURRENCY;
  } catch (error) {
    console.error('Error determining currency from locale:', error);
    return DEFAULT_CURRENCY;
  }
}

// Format amount with currency symbol
export function formatAmount(amount: number, currency: SupportedCurrency = DEFAULT_CURRENCY): string {
  const currencyDetails = CURRENCIES[currency];
  
  return new Intl.NumberFormat(navigator.language, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Convert price between currencies
export function convertPrice(priceUSD: number, targetCurrency: SupportedCurrency): number {
  const targetDetails = CURRENCIES[targetCurrency];
  return parseFloat((priceUSD * targetDetails.baseMultiplier).toFixed(2));
}
