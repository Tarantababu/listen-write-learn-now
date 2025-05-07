
import { useSearchParams } from 'react-router-dom';

/**
 * Hook for managing modal state that persists across page navigation
 * @param modalId A unique identifier for this modal
 * @param defaultValue Default state if no query parameter exists
 * @returns [isOpen, setIsOpen, handleOpenChange]
 */
export function useModalState(modalId: string, defaultValue: boolean = false): [boolean, (open: boolean) => void, (open: boolean) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check if the modal should be open based on URL query parameter
  const isModalOpen = searchParams.get(modalId) === 'true' ? true : defaultValue;
  
  // Update the URL query parameter when modal state changes
  const setModalState = (open: boolean) => {
    setSearchParams(prevParams => {
      const newParams = new URLSearchParams(prevParams);
      if (open) {
        newParams.set(modalId, 'true');
      } else {
        newParams.delete(modalId);
      }
      return newParams;
    }, { replace: true }); // Replace to avoid adding to browser history
  };
  
  // Handler for the onOpenChange event
  const handleOpenChange = (open: boolean) => {
    setModalState(open);
  };
  
  return [isModalOpen, setModalState, handleOpenChange];
}
