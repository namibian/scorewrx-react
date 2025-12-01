import { Home, MoreVertical, Edit, Eye, TrendingUp, DollarSign, Layers, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Link } from 'react-router-dom'

interface ScorecardHeaderProps {
  courseName: string
  groupNumber: number
  isScorer: boolean
  isNinesGame?: boolean
  nassauEnabled?: boolean
  skinsEnabled?: boolean
  allScoresEntered: boolean
  scorerName: string
  verifierName?: string
  isEntryMode: boolean
  discrepancyCount?: number
  unverifiedCount?: number
  tournamentId: string
  onSelectTab: (tab: string) => void
  onEnterScoring: () => void
  onExitScoring: () => void
}

export function ScorecardHeader({
  courseName,
  groupNumber,
  isScorer,
  isNinesGame = false,
  nassauEnabled = false,
  skinsEnabled = false,
  allScoresEntered,
  scorerName,
  verifierName = '',
  isEntryMode,
  discrepancyCount = 0,
  unverifiedCount = 0,
  tournamentId,
  onSelectTab,
  onEnterScoring,
  onExitScoring,
}: ScorecardHeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Back button */}
        <Link to={`/tournament/${tournamentId}/landing`}>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/90">
            <Home className="h-5 w-5" />
            <span className="sr-only">Back to Tournament Landing</span>
          </Button>
        </Link>

        {/* Title */}
        <div className="flex-1 text-center">
          <div className="text-base font-medium">
            {courseName} (Group {groupNumber})
          </div>
          <div className="text-xs opacity-90">
            Scorekeeper: {scorerName}
            {verifierName && ` | Verifier: ${verifierName}`}
          </div>
        </div>

        {/* Badges and menu */}
        <div className="flex items-center gap-2">
          {/* Verification Status Badges */}
          {(unverifiedCount > 0 || discrepancyCount > 0) && (
            <div className="flex gap-1">
              {unverifiedCount > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="bg-amber-500 text-white">
                        ⏳ {unverifiedCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{unverifiedCount} hole{unverifiedCount > 1 ? 's' : ''} awaiting verification</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {discrepancyCount > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="bg-orange-500 text-white">
                        ⚠️ {discrepancyCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{discrepancyCount} hole{discrepancyCount > 1 ? 's' : ''} with discrepancies</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}

          {/* Menu Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/90">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Enter/Exit Scores */}
              {isScorer && !isEntryMode && (
                <DropdownMenuItem onClick={onEnterScoring}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Enter Scores</span>
                </DropdownMenuItem>
              )}

              {isEntryMode && (
                <DropdownMenuItem onClick={onExitScoring}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View Scorecard</span>
                </DropdownMenuItem>
              )}

              {isScorer && <DropdownMenuSeparator />}

              {/* Scorecard */}
              {!isEntryMode && (
                <DropdownMenuItem onClick={() => onSelectTab('scorecard')}>
                  <Trophy className="mr-2 h-4 w-4" />
                  <span>Scorecard</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {/* Match */}
              {!isNinesGame && !nassauEnabled && (
                <DropdownMenuItem onClick={() => onSelectTab('match')}>
                  <Trophy className="mr-2 h-4 w-4" />
                  <span>Match</span>
                </DropdownMenuItem>
              )}

              {/* Bets */}
              {!isEntryMode && (
                <DropdownMenuItem
                  onClick={() => onSelectTab('bets')}
                  disabled={!allScoresEntered}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>Bets</span>
                  {!allScoresEntered && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-2">ⓘ</TooltipTrigger>
                        <TooltipContent>
                          <p>Enter all scores to enable Bets</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </DropdownMenuItem>
              )}

              {/* Skins */}
              {!isEntryMode && skinsEnabled && (
                <DropdownMenuItem
                  onClick={() => onSelectTab('skins')}
                  disabled={!allScoresEntered}
                >
                  <Layers className="mr-2 h-4 w-4" />
                  <span>Skins</span>
                  {!allScoresEntered && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-2">ⓘ</TooltipTrigger>
                        <TooltipContent>
                          <p>Enter all scores to enable Skins</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </DropdownMenuItem>
              )}

              {/* Leaderboard */}
              {!isEntryMode && (
                <DropdownMenuItem onClick={() => onSelectTab('leaderboard')}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Leaderboard</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

