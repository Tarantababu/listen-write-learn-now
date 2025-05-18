
import { useState, useEffect } from 'react';

/**
 * Hook for persisting UI state across tab navigation and refreshes
 * @param key Unique identifier for this state in localStorage
 * @param defaultValue Default value when no stored value exists
 * @param ttl Time-to-live in milliseconds (optional, default 1 hour)
 * @returns [state, setState] tuple similar to useState
 */
export function usePersistentState<T>(
  key: string, 
  defaultValue: T, 
  ttl = 60 * 60 * 1000
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      // Check for existing state in localStorage
      const storedItem = localStorage.getItem(`persistent_state_${key}`);
      
      if (storedItem) {
        const { value, expiry } = JSON.parse(storedItem);
        
        // Check if the stored value has expired
        if (expiry && expiry > Date.now()) {
          return value;
        } else {
          // Clean up expired values
          localStorage.removeItem(`persistent_state_${key}`);
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    
    return defaultValue;
  });

  // Update localStorage when state changes
  useEffect(() => {
    try {
      const item = {
        value: state,
        expiry: Date.now() + ttl
      };
      
      localStorage.setItem(`persistent_state_${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [state, key, ttl]);

  return [state, setState];
}

/**
 * Hook that manages tab synchronization for a specific state
 * @param channelName Unique identifier for the BroadcastChannel
 * @param state The state to synchronize
 * @param setState The state setter function
 */
export function useSyncedTabs<T>(
  channelName: string, 
  state: T,
  setState: (value: T) => void
): void {
  useEffect(() => {
    // Only use BroadcastChannel if supported by the browser
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(`sync_${channelName}`);
      
      // Listen for updates from other tabs
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'state_update') {
          setState(event.data.value);
        }
      };
      
      // Clean up channel on unmount
      return () => {
        channel.close();
      };
    }
  }, [channelName, setState]);
  
  // Function to broadcast state changes to other tabs
  const broadcastUpdate = (newValue: T) => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(`sync_${channelName}`);
      channel.postMessage({
        type: 'state_update',
        value: newValue
      });
      channel.close();
    }
  };
  
  // Broadcast state changes
  useEffect(() => {
    broadcastUpdate(state);
  }, [state, channelName]);
}

/**
 * Clear all persistent states when needed (e.g. on logout)
 */
export function clearAllPersistentStates(): void {
  // Get all keys from localStorage that start with our prefix
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('persistent_state_')) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all matched keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
}
