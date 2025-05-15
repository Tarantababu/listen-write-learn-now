
/**
 * Popup State Manager
 * 
 * Tracks open popups to prevent background polling while modals are open
 */

// Store currently open popup IDs
const openPopups = new Set<string>();

/**
 * Register an open popup
 * @param popupId Unique ID for the popup
 */
export const registerOpenPopup = (popupId: string): void => {
  openPopups.add(popupId);
};

/**
 * Unregister a closed popup
 * @param popupId Unique ID for the popup
 */
export const unregisterPopup = (popupId: string): void => {
  openPopups.delete(popupId);
};

/**
 * Check if any popups are currently open
 * @returns True if any popups are open
 */
export const isAnyPopupOpen = (): boolean => {
  return openPopups.size > 0;
};

/**
 * Get all currently open popup IDs
 * @returns Array of open popup IDs
 */
export const getOpenPopups = (): string[] => {
  return Array.from(openPopups);
};

/**
 * Check if a specific popup is open
 * @param popupId Popup ID to check
 * @returns True if the specified popup is open
 */
export const isPopupOpen = (popupId: string): boolean => {
  return openPopups.has(popupId);
};

/**
 * Reset all popup tracking state (useful for testing)
 */
export const resetPopupState = (): void => {
  openPopups.clear();
};
