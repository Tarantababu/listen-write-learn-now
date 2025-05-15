
// A simple utility to manage popup state persistence across refreshes

interface PopupState {
  isOpen: boolean;
  id?: string;
  data?: any;
  lastUpdated: number;
}

// Use module-level variables to maintain state across renders
let popupStates: Record<string, PopupState> = {};

// Event listeners for popup state coordination
const listeners: Record<string, Set<Function>> = {};

/**
 * Save popup state to keep modals from closing during data refreshes
 * @param key Unique identifier for the popup
 * @param state State of the popup
 */
export function savePopupState(key: string, state: Omit<PopupState, 'lastUpdated'>): void {
  const newState = { 
    ...state, 
    lastUpdated: Date.now() 
  };
  
  popupStates[key] = newState;
  
  // Notify listeners of state change
  if (listeners[key]) {
    listeners[key].forEach(listener => listener(newState));
  }
}

/**
 * Get saved popup state
 * @param key Unique identifier for the popup
 * @returns The saved popup state, or default closed state if none exists
 */
export function getPopupState(key: string): PopupState {
  return popupStates[key] || { isOpen: false, lastUpdated: 0 };
}

/**
 * Clear a specific popup state
 * @param key Unique identifier for the popup
 */
export function clearPopupState(key: string): void {
  delete popupStates[key];
  
  // Notify listeners of state clear
  if (listeners[key]) {
    listeners[key].forEach(listener => 
      listener({ isOpen: false, lastUpdated: Date.now() })
    );
  }
}

/**
 * Clear all popup states
 */
export function clearAllPopupStates(): void {
  popupStates = {};
  
  // Notify all listeners
  Object.keys(listeners).forEach(key => {
    listeners[key].forEach(listener => 
      listener({ isOpen: false, lastUpdated: Date.now() })
    );
  });
}

/**
 * Subscribe to popup state changes
 * @param key Unique identifier for the popup
 * @param callback Function to call when state changes
 * @returns Unsubscribe function
 */
export function subscribeToPopupState(key: string, callback: (state: PopupState) => void): () => void {
  if (!listeners[key]) {
    listeners[key] = new Set();
  }
  
  listeners[key].add(callback);
  
  // Return unsubscribe function
  return () => {
    if (listeners[key]) {
      listeners[key].delete(callback);
      if (listeners[key].size === 0) {
        delete listeners[key];
      }
    }
  };
}

/**
 * Check if any popup is currently open
 * @returns boolean indicating if any popup is open
 */
export function isAnyPopupOpen(): boolean {
  return Object.values(popupStates).some(state => state.isOpen);
}
