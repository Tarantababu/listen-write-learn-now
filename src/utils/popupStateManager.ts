
// A simple utility to manage popup state persistence across refreshes

interface PopupState {
  isOpen: boolean;
  id?: string;
  data?: any;
}

// Use module-level variables to maintain state across renders
let popupStates: Record<string, PopupState> = {};

/**
 * Save popup state to keep modals from closing during data refreshes
 * @param key Unique identifier for the popup
 * @param state State of the popup
 */
export function savePopupState(key: string, state: PopupState): void {
  popupStates[key] = { ...state };
}

/**
 * Get saved popup state
 * @param key Unique identifier for the popup
 * @returns The saved popup state, or default closed state if none exists
 */
export function getPopupState(key: string): PopupState {
  return popupStates[key] || { isOpen: false };
}

/**
 * Clear a specific popup state
 * @param key Unique identifier for the popup
 */
export function clearPopupState(key: string): void {
  delete popupStates[key];
}

/**
 * Clear all popup states
 */
export function clearAllPopupStates(): void {
  popupStates = {};
}
