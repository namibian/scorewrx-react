import { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'

interface ScoringLayoutProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
  showHomeButton?: boolean
  backTo?: string
}

/**
 * Scoring Layout Component
 * 
 * Minimal mobile-optimized layout for scoring pages including:
 * - Simple header with back/home navigation
 * - Full-height content area
 * - No footer (maximize vertical space)
 * - Touch-optimized spacing
 */
export function ScoringLayout({
  children,
  title,
  showBackButton = true,
  showHomeButton = false,
  backTo,
}: ScoringLayoutProps) {
  const navigate = useNavigate()
  const params = useParams()

  const handleBack = () => {
    if (backTo) {
      navigate(backTo)
    } else {
      navigate(-1)
    }
  }

  const handleHome = () => {
    // Navigate to game setup or tournament selection
    const { tournamentId, groupId, playerId } = params
    if (tournamentId && groupId && playerId) {
      navigate(`/tournament/${tournamentId}/group/${groupId}/player/${playerId}/setup`)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header - Minimal & Fixed */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-3 gap-2">
          {/* Back Button */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-9 w-9 p-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          {/* Title */}
          {title && (
            <h1 className="text-lg font-semibold truncate flex-1">
              {title}
            </h1>
          )}

          {/* Home Button */}
          {showHomeButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHome}
              className="h-9 w-9 p-0"
            >
              <Home className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

/**
 * Simple Scoring Layout
 * 
 * Even more minimal layout with no header - just content
 * Used for fullscreen scorecard views
 */
export function SimpleScoringLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}

/**
 * Scoring Layout with Tabs
 * 
 * Layout variant that includes tab navigation at the bottom
 * Used for scorecard page with multiple views
 */
interface ScoringLayoutWithTabsProps {
  children: ReactNode
  title?: string
  tabs?: React.ReactNode
}

export function ScoringLayoutWithTabs({
  children,
  title,
  tabs,
}: ScoringLayoutWithTabsProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-3 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {title && (
            <h1 className="text-lg font-semibold truncate flex-1">
              {title}
            </h1>
          )}
        </div>
      </header>

      {/* Tabs Navigation */}
      {tabs && (
        <div className="sticky top-14 z-30 border-b bg-background">
          {tabs}
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

