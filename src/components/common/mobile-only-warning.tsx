import { Alert, AlertDescription } from '@/components/ui/alert'
import { Smartphone, Monitor } from 'lucide-react'
import { useMobileCheck } from '@/hooks/use-mobile-check'

interface MobileOnlyWarningProps {
  /**
   * If true, shows a warning on desktop devices
   * If false, shows a warning on mobile devices
   */
  requireMobile?: boolean
}

/**
 * Component that warns users when they're on the wrong device type
 * 
 * For mobile-only pages (scoring): Shows warning on desktop
 * For desktop-only pages (admin): Shows warning on mobile
 */
export function MobileOnlyWarning({ requireMobile = true }: MobileOnlyWarningProps) {
  const isMobile = useMobileCheck()

  // Don't show warning if device type matches requirement
  if ((requireMobile && isMobile) || (!requireMobile && !isMobile)) {
    return null
  }

  if (requireMobile) {
    // User is on desktop but page requires mobile
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
        <Alert className="max-w-md border-amber-500 bg-amber-50 dark:bg-amber-950">
          <Monitor className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="mt-2 text-amber-900 dark:text-amber-100">
            <p className="font-semibold text-lg mb-2">Mobile Device Required</p>
            <p className="mb-4">
              The scoring interface is designed exclusively for mobile devices to ensure
              the best experience on the golf course.
            </p>
            <p className="text-sm">
              Please access this page from your smartphone or tablet to enter scores
              during your round.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // User is on mobile but page requires desktop
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
      <Alert className="max-w-md border-blue-500 bg-blue-50 dark:bg-blue-950">
        <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="mt-2 text-blue-900 dark:text-blue-100">
          <p className="font-semibold text-lg mb-2">Desktop Required</p>
          <p className="mb-4">
            Tournament administration features work best on a desktop or laptop
            computer for managing tournaments, courses, and players.
          </p>
          <p className="text-sm">
            For the best experience, please access the admin panel from a computer
            with a larger screen.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

/**
 * Higher-order component that wraps a page with device detection
 * Shows appropriate warning if wrong device type
 */
interface DeviceGuardProps {
  children: React.ReactNode
  requireMobile?: boolean
  showWarning?: boolean
}

export function DeviceGuard({ 
  children, 
  requireMobile = true,
  showWarning = true 
}: DeviceGuardProps) {
  const isMobile = useMobileCheck()

  // Check if device type matches requirement
  const isCorrectDevice = requireMobile ? isMobile : !isMobile

  if (!isCorrectDevice && showWarning) {
    return <MobileOnlyWarning requireMobile={requireMobile} />
  }

  return <>{children}</>
}

