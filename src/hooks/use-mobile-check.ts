import { useState, useEffect } from 'react'

/**
 * Hook to detect if the current device is mobile
 * 
 * Checks both viewport width and user agent for mobile detection
 * Updates on window resize
 * 
 * @returns {boolean} true if mobile device, false otherwise
 */
export function useMobileCheck(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    const checkMobile = () => {
      // Check viewport width (mobile-first: <= 768px)
      const isSmallScreen = window.innerWidth <= 768

      // Check user agent for mobile devices
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )

      // Device is mobile if either condition is true
      setIsMobile(isSmallScreen || isMobileUserAgent)
    }

    // Initial check
    checkMobile()

    // Add resize listener
    window.addEventListener('resize', checkMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

/**
 * Hook to get detailed device information
 * 
 * @returns Device details including width, height, and mobile status
 */
export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isMobileUserAgent = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      const isTabletUserAgent = /iPad|Android/i.test(navigator.userAgent)

      setDeviceInfo({
        width,
        height,
        isMobile: width <= 768 || isMobileUserAgent,
        isTablet: width > 768 && width <= 1024 && isTabletUserAgent,
        isDesktop: width > 1024 && !isMobileUserAgent && !isTabletUserAgent,
      })
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)

    return () => window.removeEventListener('resize', updateDeviceInfo)
  }, [])

  return deviceInfo
}

