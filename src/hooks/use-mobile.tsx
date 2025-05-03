
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Default to checking window width if running in browser
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT
    }
    // Default to false if running in SSR
    return false
  })

  React.useEffect(() => {
    // Check if window is defined (browser environment)
    if (typeof window === 'undefined') return
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Add event listener
    window.addEventListener("resize", checkMobile)
    
    // Initial check
    checkMobile()
    
    // Cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

// Optional: Helper hook to determine screen size category
export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md')
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkSize = () => {
      const width = window.innerWidth
      if (width < 640) return setScreenSize('xs')
      if (width < 768) return setScreenSize('sm')
      if (width < 1024) return setScreenSize('md')
      if (width < 1280) return setScreenSize('lg')
      if (width < 1536) return setScreenSize('xl')
      return setScreenSize('2xl')
    }
    
    window.addEventListener("resize", checkSize)
    checkSize()
    
    return () => window.removeEventListener("resize", checkSize)
  }, [])
  
  return screenSize
}
