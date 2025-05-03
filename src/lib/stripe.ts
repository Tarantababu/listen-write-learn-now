
// Stripe publishable key configuration
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RKPA54FwSGFv1ZusBcDRfY0vPrfO78PyVO4sA3qCnsInzM06FKy77aVspFV35ZUa2nOXgxTMV67Riaol31nfZUw00Pr8pFzWd';

export const FREE_LIMITS = {
  EXERCISES: 3,
  VOCABULARY: 5
};

export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    name: 'Monthly Premium',
    price: 4.99,
    trialDays: 7,
    features: [
      'Unlimited exercises',
      'Unlimited vocabulary lists',
      'Text-to-speech for all exercises',
      'Advanced analytics',
      'AI-powered vocabulary suggestions'
    ]
  }
};
