import { Home, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface ScoringHeaderProps {
  title: string
  subtitle?: string
  showHomeButton?: boolean
  showMenu?: boolean
  menuItems?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    disabled?: boolean
  }>
  className?: string
  children?: React.ReactNode
}

/**
 * Shared header component for scoring/player-facing screens
 * Uses cornflower blue background with smokewhite text
 */
export function ScoringHeader({
  title,
  subtitle,
  showHomeButton = true,
  showMenu = false,
  menuItems = [],
  className,
  children,
}: ScoringHeaderProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Preserve debug mode through navigation
  const debugParam = searchParams.get('debug') === 'true' ? '?debug=true' : ''

  const handleHomeClick = () => {
    // Navigate to player landing page, not admin dashboard
    navigate(`/scoring/select${debugParam}`)
  }

  return (
    <header
      className={cn(
        'bg-[#6495ED] text-[#F5F5F5] px-4 py-4 sticky top-0 z-10',
        className
      )}
    >
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Home button */}
        {showHomeButton ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleHomeClick}
            className="text-[#F5F5F5] hover:bg-white/20"
          >
            <Home className="h-5 w-5" />
            <span className="sr-only">Back to Player Landing</span>
          </Button>
        ) : (
          <div className="w-10" /> // Spacer for alignment
        )}

        {/* Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold tracking-wide">{title}</h1>
          {subtitle && (
            <p className="text-sm opacity-90">{subtitle}</p>
          )}
        </div>

        {/* Menu or spacer */}
        {showMenu && menuItems.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#F5F5F5] hover:bg-white/20"
              >
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menuItems.map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={item.onClick}
                  disabled={item.disabled}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  <span>{item.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="w-10" /> // Spacer for alignment
        )}

        {/* Additional children (badges, etc.) */}
        {children}
      </div>
    </header>
  )
}

