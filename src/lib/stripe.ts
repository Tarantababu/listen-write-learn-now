
// Stripe publishable key configuration
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RKPA54FwSGFv1ZusBcDRfY0vPrfO78PyVO4sA3qCnsInzM06FKy77aVspFV35ZUa2nOXgxTMV67Riaol31nfZUw00Pr8pFzWd';

export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    id: 'monthly',
    name: 'Monthly',
    price: 4.99,
    trialDays: 7,
    billing: 'monthly',
    savePercent: 0,
    features: [
      'Unlimited exercises',
      'Unlimited vocabulary lists',
      'Edit exercises anytime',
      'Text-to-speech for all exercises',
      'Advanced analytics',
      'AI-powered vocabulary suggestions'
    ],
    emoji: '🔓',
    tagline: 'Full access, cancel anytime'
  },
  QUARTERLY: {
    id: 'quarterly',
    name: 'Quarterly',
    price: 12.99,
    trialDays: 7,
    billing: 'every 3 months',
    savePercent: 13,
    features: [
      'Everything in Monthly',
      'Priority support',
      'Save 13% compared to monthly'
    ],
    emoji: '💰',
    tagline: 'Save 13% vs monthly'
  },
  ANNUAL: {
    id: 'annual',
    name: 'Annual',
    price: 44.99,
    trialDays: 7,
    billing: 'yearly',
    savePercent: 25,
    features: [
      'Everything in Quarterly',
      'Early access to new features',
      'Save 25% compared to monthly'
    ],
    emoji: '🎯',
    tagline: 'Save 25%, billed annually'
  },
  LIFETIME: {
    id: 'lifetime',
    name: 'Lifetime',
    price: 119.99,
    oneTime: true,
    savePercent: 0,
    features: [
      'Everything in Annual',
      'Lifetime access to all features',
      'Future updates included',
      'No recurring payments'
    ],
    emoji: '🏆',
    tagline: 'Pay once, get lifetime access'
  }
};

// Available currencies for localization
export const AVAILABLE_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' }
];

// Default currency fallback
export const DEFAULT_CURRENCY = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar'
};

// Helper to format price in specified currency
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  const currencyObj = AVAILABLE_CURRENCIES.find(c => c.code === currency) || DEFAULT_CURRENCY;
  
  // Format based on currency convention
  if (currency === 'JPY') {
    return `${currencyObj.symbol}${Math.round(price)}`;
  }
  
  return `${currencyObj.symbol}${price.toFixed(2)}`;
};

// Exchange rates for demo purposes
// In production, you'd fetch these from an API
export const EXCHANGE_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.37,
  AUD: 1.53,
  JPY: 149.5,
  TRY: 32.21,
  INR: 83.5,
  BRL: 5.13,
  MXN: 16.77
};

// Convert price from USD to another currency
export const convertPrice = (usdPrice: number, toCurrency: string): number => {
  const rate = EXCHANGE_RATES[toCurrency as keyof typeof EXCHANGE_RATES] || 1;
  
  // For JPY, we don't use decimals
  if (toCurrency === 'JPY') {
    return Math.round(usdPrice * rate);
  }
  
  // Round to 2 decimal places for other currencies
  return Math.round(usdPrice * rate * 100) / 100;
};
