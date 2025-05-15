
// Track open popups to prevent background refreshes while popups are open
let openPopups: Record<string, boolean> = {};

/**
 * Register a popup as open
 */
export const registerOpenPopup = (id: string): void => {
  openPopups[id] = true;
};

/**
 * Register a popup as closed
 */
export const unregisterPopup = (id: string): void => {
  delete openPopups[id];
};

/**
 * Check if any popup is currently open
 */
export const isAnyPopupOpen = (): boolean => {
  return Object.keys(openPopups).length > 0;
};

/**
 * Save popup state to localStorage to persist across refreshes
 */
export const savePopupState = (id: string, state: any): void => {
  try {
    localStorage.setItem(`popup_state_${id}`, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving popup state:', e);
  }
};

/**
 * Get popup state from localStorage
 */
export const getPopupState = <T>(id: string, defaultState: T): T => {
  try {
    const saved = localStorage.getItem(`popup_state_${id}`);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (e) {
    console.error('Error retrieving popup state:', e);
  }
  return defaultState;
};
