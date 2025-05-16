
import { useSubscription as useContextSubscription } from '../contexts/SubscriptionContext';

export const useSubscription = () => {
  return useContextSubscription();
};
