
// Simple utility to track whether any popups/modals are currently open
// This helps prevent background data refreshes when users are interacting with modals

let openPopupCount = 0;
const popupStates: Record<string, { isOpen: boolean }> = {};

/**
 * Register a popup as opened
 */
export function registerPopupOpen(): void {
  openPopupCount++;
}

/**
 * Register a popup as closed
 */
export function registerPopupClose(): void {
  openPopupCount = Math.max(0, openPopupCount - 1);
}

/**
 * Check if any popup is currently open
 */
export function isAnyPopupOpen(): boolean {
  return openPopupCount > 0;
}

/**
 * Reset the popup tracking (useful for tests or when changing pages)
 */
export function resetPopupTracking(): void {
  openPopupCount = 0;
}

/**
 * Save the state of a specific popup
 */
export function savePopupState(id: string, state: { isOpen: boolean }): void {
  popupStates[id] = state;
  
  // Also update the global counter
  if (state.isOpen) {
    registerPopupOpen();
  } else {
    registerPopupClose();
  }
}

/**
 * Get the state of a specific popup
 */
export function getPopupState(id: string): { isOpen: boolean } {
  return popupStates[id] || { isOpen: false };
}
