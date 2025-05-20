
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
}

export const Portal = ({ children }: PortalProps) => {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    // Check if the portal container already exists
    let element = document.getElementById("portal-root");

    // If it doesn't exist, create it
    if (!element) {
      element = document.createElement("div");
      element.setAttribute("id", "portal-root");
      document.body.appendChild(element);
    }
    
    setPortalRoot(element);
    
    // Clean up function
    return () => {
      // Only remove the portal element if it has no children
      if (element && element.childNodes.length === 0) {
        document.body.removeChild(element);
      }
    };
  }, []);
  
  // Don't render until we have a container
  if (!portalRoot) return null;
  
  return createPortal(children, portalRoot);
};
