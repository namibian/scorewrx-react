import { useNavigate, useSearchParams } from 'react-router-dom'
import { Smartphone, Monitor, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
  const navigate = useNavigate()
  const isMobile = useMobileCheck()

  // Don't show warning if device type matches requirement
  if ((requireMobile && isMobile) || (!requireMobile && !isMobile)) {
    return null
  }

  if (requireMobile) {
    // User is on desktop but page requires mobile
    // This matches the Vue PlayerLandingLayout styling
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700">
        <Card className="max-w-[500px] w-full shadow-2xl">
          <CardContent className="pt-8 pb-8 text-center">
            <Smartphone className="h-20 w-20 mx-auto mb-6 text-primary" strokeWidth={1.5} />
            
            <h2 className="text-2xl font-bold mb-4">Mobile Device Required</h2>
            
            <p className="text-base text-muted-foreground mb-6">
              Tournament scoring and participation features are designed for mobile devices only.
            </p>
            
            <Separator className="my-6" />
            
            <div className="text-sm text-muted-foreground mb-4">
              <p className="font-semibold mb-3">To join this tournament:</p>
              <ol className="text-left inline-block space-y-2 list-decimal list-inside">
                <li>Open this link on your smartphone or tablet</li>
                <li>Or use your phone's camera to scan the tournament QR code</li>
                <li>Enter the tournament code when prompted</li>
              </ol>
            </div>
            
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-6 mb-4">
              <Info className="h-4 w-4" />
              <span>For tournament management, please use the admin dashboard on desktop.</span>
            </div>
            
            <Button 
              onClick={() => navigate('/dashboard')}
              className="mt-4"
              size="lg"
            >
              Go to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is on mobile but page requires desktop
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700">
      <Card className="max-w-[500px] w-full shadow-2xl">
        <CardContent className="pt-8 pb-8 text-center">
          <Monitor className="h-20 w-20 mx-auto mb-6 text-primary" strokeWidth={1.5} />
          
          <h2 className="text-2xl font-bold mb-4">Desktop Required</h2>
          
          <p className="text-base text-muted-foreground mb-6">
            Tournament administration features work best on a desktop or laptop
            computer for managing tournaments, courses, and players.
          </p>
          
          <Separator className="my-6" />
          
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>For the best experience, please access the admin panel from a computer with a larger screen.</span>
          </div>
        </CardContent>
      </Card>
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
  const [searchParams] = useSearchParams()
  
  // Allow bypass for debugging with ?debug=true query parameter
  const isDebugMode = searchParams.get('debug') === 'true'

  // Check if device type matches requirement
  const isCorrectDevice = requireMobile ? isMobile : !isMobile

  // Allow access if correct device OR debug mode is enabled
  if (!isCorrectDevice && !isDebugMode && showWarning) {
    return <MobileOnlyWarning requireMobile={requireMobile} />
  }

  return <>{children}</>
}
