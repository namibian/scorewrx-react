import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Player, Course, Group, Tournament } from '@/types'
import { ChevronLeft, ChevronRight, Minus, Plus, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScorerEntryContentProps {
  currentHole: number
  group: Group
  course: Course
  tournament: Tournament
  isVerifier?: boolean
  onNavigatePrevious: () => void
  onNavigateNext: () => void
  onJumpToHole: (hole: number) => void
  onSave: (saveData: {
    hole: number
    scores: Record<string, {
      score: number | null
      dots: number
      dnf: boolean
      greenieToggle: boolean
      sandyToggle: boolean
      greenies: number[]
      sandies: number[]
      dnfArray: boolean[]
    }>
  }) => Promise<void>
}

interface PlayerScoreState {
  score: number
  dots: number
  dnf: boolean
  greenie: boolean
  sandy: boolean
}

export function ScorerEntryContent({
  currentHole,
  group,
  course,
  tournament,
  isVerifier = false,
  onNavigatePrevious,
  onNavigateNext,
  onJumpToHole,
  onSave,
}: ScorerEntryContentProps) {
  const [state, setState] = useState<Record<string, PlayerScoreState>>({})
  const [saving, setSaving] = useState(false)
  const [showHoleSelector, setShowHoleSelector] = useState(false)

  // Get hole info
  const holePar = course.teeboxes?.[0]?.holes[currentHole - 1]?.par || 4
  const holeHdcp = course.teeboxes?.[0]?.holes[currentHole - 1]?.handicap || currentHole

  // Sort players by position
  const sortedPlayers = [...(group.players || [])].sort((a, b) => {
    if (typeof a.position === 'number' && typeof b.position === 'number') {
      return a.position - b.position
    }
    return 0
  })

  // Check if dots game is enabled
  const dotsEnabled = group.gameSettings?.dots?.enabled || false
  const trackGreenies = group.gameSettings?.dots?.trackGreenies || false
  const trackSandies = group.gameSettings?.dots?.trackSandies || false

  // Calculate carry-over count for par 3s
  const carryOverCount = useCallback(() => {
    if (!dotsEnabled || holePar !== 3) return 0

    const startingTee = group.startingTee || 1

    // Build played holes in order
    const playedHoles: number[] = []
    for (let i = 0; i < 18; i++) {
      const hole = ((startingTee - 1 + i) % 18) + 1
      if (hole === currentHole) break
      playedHoles.push(hole)
    }

    // Find previous par 3s (most recent first)
    const previousPar3s = playedHoles
      .filter(hole => (course.teeboxes?.[0]?.holes[hole - 1]?.par || 4) === 3)
      .reverse()

    // Count consecutive par 3s without greenies
    let count = 0
    for (const hole of previousPar3s) {
      const hasGreenie = group.players?.some(player =>
        Array.isArray(player.greenies) && player.greenies.includes(hole)
      )
      if (!hasGreenie) {
        count++
      } else {
        break
      }
    }

    return count
  }, [currentHole, group, course, dotsEnabled, holePar])

  // Check if current hole has all scores
  const currentHoleHasAllScores = useCallback(() => {
    if (!group.players) return false
    const holeIndex = currentHole - 1
    return group.players.every(player => {
      const score = player.score?.[holeIndex]
      const dnf = player.dnf?.[holeIndex]
      return (score !== null && score !== undefined) || dnf
    })
  }, [currentHole, group.players])

  // Check for previous unscored holes
  const hasPreviousUnscoredHoles = useCallback(() => {
    if (!group.players) return false
    const startingTee = group.startingTee || 1

    const previousHoles: number[] = []
    for (let i = 0; i < 18; i++) {
      const hole = ((startingTee - 1 + i) % 18) + 1
      if (hole === currentHole) break
      previousHoles.push(hole)
    }

    return previousHoles.some(hole => {
      const holeIndex = hole - 1
      return !group.players!.every(player => {
        const score = player.score?.[holeIndex]
        const dnf = player.dnf?.[holeIndex]
        return (score !== null && score !== undefined) || dnf
      })
    })
  }, [currentHole, group])

  // Check if a hole is scored
  const isHoleScored = (hole: number) => {
    if (!group.players) return false
    const holeIndex = hole - 1
    return group.players.every(player => {
      const score = player.score?.[holeIndex]
      const dnf = player.dnf?.[holeIndex]
      return (score !== null && score !== undefined) || dnf
    })
  }

  // Get max score for a player
  const getMaxScore = (player: Player) => {
    const playerHandicap = player.tournamentHandicap || 0
    const baseStrokes = Math.floor(playerHandicap / 18)
    const additionalStroke = (playerHandicap % 18) >= holeHdcp ? 1 : 0
    const totalStrokes = baseStrokes + additionalStroke
    return holePar + 2 + totalStrokes
  }

  // Check if player gets strokes on this hole
  const getPlayerStrokes = (player: Player): boolean => {
    if (!player.strokeHoles) return false

    // Check Nines game
    if (group.gameSettings?.nines?.enabled) {
      return player.strokeHoles.nines?.includes(currentHole) || false
    }

    // Check Sixes game
    if (group.gameSettings?.sixes?.enabled && player.strokeHoles.sixes) {
      const { firstGame, secondGame, thirdGame } = player.strokeHoles.sixes
      return (
        firstGame?.includes(currentHole) ||
        secondGame?.includes(currentHole) ||
        thirdGame?.includes(currentHole) ||
        false
      )
    }

    // Check Dots game
    if (group.gameSettings?.dots?.enabled) {
      return player.strokeHoles.dots?.includes(currentHole) || false
    }

    return false
  }

  // Initialize state when hole changes
  useEffect(() => {
    const newState: Record<string, PlayerScoreState> = {}
    const holeIndex = currentHole - 1

    group.players?.forEach(player => {
      if (isVerifier) {
        // Load verifier data
        newState[player.id] = {
          score: player.verifierScore?.[holeIndex] ?? holePar,
          dots: player.verifierDots?.[holeIndex] ?? 0,
          dnf: player.verifierDnf?.[holeIndex] ?? false,
          greenie: Array.isArray(player.verifierGreenies) && player.verifierGreenies.includes(currentHole),
          sandy: Array.isArray(player.verifierSandies) && player.verifierSandies.includes(currentHole),
        }
      } else {
        // Load scorer data
        newState[player.id] = {
          score: player.score?.[holeIndex] ?? holePar,
          dots: player.dots?.[holeIndex] ?? 0,
          dnf: player.dnf?.[holeIndex] ?? false,
          greenie: Array.isArray(player.greenies) && player.greenies.includes(currentHole),
          sandy: Array.isArray(player.sandies) && player.sandies.includes(currentHole),
        }
      }
    })

    setState(newState)
  }, [currentHole, group.players, holePar, isVerifier])

  // Handle score change
  const handleScoreChange = (playerId: string, newScore: number) => {
    if (isNaN(newScore)) return

    setState(prev => {
      const playerState = prev[playerId]
      if (!playerState) return prev

      // Calculate dots based on score
      let scoreDots = 0
      let newGreenie = playerState.greenie
      let newSandy = playerState.sandy

      if (newScore > holePar) {
        scoreDots = 0
        // Turn off greenie and sandy if score goes over par
        newGreenie = false
        newSandy = false
      } else {
        scoreDots = holePar - newScore
      }

      // Add bonus dots for greenie/sandy
      let totalDots = scoreDots
      if (newGreenie) totalDots += 1
      if (newSandy) totalDots += 1

      return {
        ...prev,
        [playerId]: {
          ...playerState,
          score: newScore,
          dots: totalDots,
          dnf: false,
          greenie: newGreenie,
          sandy: newSandy,
        },
      }
    })
  }

  // Handle increment/decrement
  const incrementScore = (playerId: string) => {
    const currentScore = state[playerId]?.score || holePar
    handleScoreChange(playerId, currentScore + 1)
  }

  const decrementScore = (playerId: string) => {
    const currentScore = state[playerId]?.score || holePar
    handleScoreChange(playerId, Math.max(1, currentScore - 1))
  }

  // Handle dots change
  const handleDotsChange = (playerId: string, dots: number) => {
    setState(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        dots: Math.max(0, Math.min(7, dots)),
      },
    }))
  }

  // Handle DNF toggle
  const handleDnfToggle = (playerId: string) => {
    setState(prev => {
      const playerState = prev[playerId]
      if (!playerState) return prev

      const newDnf = !playerState.dnf
      const player = group.players?.find(p => p.id === playerId)

      if (newDnf) {
        // When DNF is ON
        return {
          ...prev,
          [playerId]: {
            ...playerState,
            dnf: true,
            score: player ? getMaxScore(player) : holePar + 2,
            dots: 0,
            greenie: false,
            sandy: false,
          },
        }
      } else {
        // When DNF is OFF
        return {
          ...prev,
          [playerId]: {
            ...playerState,
            dnf: false,
            score: holePar,
          },
        }
      }
    })
  }

  // Handle greenie toggle
  const handleGreenieToggle = (playerId: string, value: boolean) => {
    setState(prev => {
      const playerState = prev[playerId]
      if (!playerState || playerState.dnf) return prev

      let newSandy = playerState.sandy
      let newDots = playerState.dots

      // On par 3, greenie and sandy are mutually exclusive
      if (holePar === 3 && value) {
        if (newSandy) {
          newDots = Math.max(0, newDots - 1)
          newSandy = false
        }
      }

      // Update dots
      if (value) {
        const dotsToAdd = 1 + (holePar === 3 ? carryOverCount() : 0)
        newDots = newDots + dotsToAdd
      } else {
        const dotsToRemove = 1 + (holePar === 3 ? carryOverCount() : 0)
        newDots = Math.max(0, newDots - dotsToRemove)
      }

      return {
        ...prev,
        [playerId]: {
          ...playerState,
          greenie: value,
          sandy: newSandy,
          dots: newDots,
        },
      }
    })
  }

  // Handle sandy toggle
  const handleSandyToggle = (playerId: string, value: boolean) => {
    setState(prev => {
      const playerState = prev[playerId]
      if (!playerState || playerState.dnf) return prev

      let newGreenie = playerState.greenie
      let newDots = playerState.dots

      // On par 3, greenie and sandy are mutually exclusive
      if (holePar === 3 && value) {
        if (newGreenie) {
          newDots = Math.max(0, newDots - 1)
          newGreenie = false
        }
      }

      // Update dots
      if (value) {
        newDots = newDots + 1
      } else {
        newDots = Math.max(0, newDots - 1)
      }

      return {
        ...prev,
        [playerId]: {
          ...playerState,
          sandy: value,
          greenie: newGreenie,
          dots: newDots,
        },
      }
    })
  }

  // Save scores
  const handleSave = async () => {
    if (saving || hasPreviousUnscoredHoles()) return

    setSaving(true)

    try {
      const scores: Record<string, any> = {}

      group.players?.forEach(player => {
        const playerState = state[player.id]
        if (!playerState) return

        // Get existing arrays
        const currentGreenies = isVerifier
          ? (Array.isArray(player.verifierGreenies) ? player.verifierGreenies : [])
          : (Array.isArray(player.greenies) ? player.greenies : [])
        const currentSandies = isVerifier
          ? (Array.isArray(player.verifierSandies) ? player.verifierSandies : [])
          : (Array.isArray(player.sandies) ? player.sandies : [])
        const currentDnf = isVerifier
          ? (Array.isArray(player.verifierDnf) ? player.verifierDnf : Array(18).fill(false))
          : (Array.isArray(player.dnf) ? player.dnf : Array(18).fill(false))

        // Update arrays
        let updatedGreenies = [...currentGreenies]
        let updatedSandies = [...currentSandies]
        let updatedDnf = [...currentDnf]

        if (playerState.greenie) {
          updatedGreenies = [...new Set([...currentGreenies, currentHole])]
        } else {
          updatedGreenies = currentGreenies.filter(h => h !== currentHole)
        }

        if (playerState.sandy) {
          updatedSandies = [...new Set([...currentSandies, currentHole])]
        } else {
          updatedSandies = currentSandies.filter(h => h !== currentHole)
        }

        updatedDnf[currentHole - 1] = playerState.dnf

        scores[player.id] = {
          score: playerState.score,
          dots: playerState.dots,
          dnf: playerState.dnf,
          greenieToggle: playerState.greenie,
          sandyToggle: playerState.sandy,
          greenies: updatedGreenies,
          sandies: updatedSandies,
          dnfArray: updatedDnf,
        }
      })

      await onSave({
        hole: currentHole,
        scores,
      })
    } finally {
      setSaving(false)
    }
  }

  // Header class based on state - uses #3ba15a green as default
  const headerClass = hasPreviousUnscoredHoles()
    ? 'bg-orange-500'
    : currentHoleHasAllScores()
    ? 'bg-green-600'
    : 'bg-[#3ba15a]'

  // Save button label
  const saveButtonLabel = currentHoleHasAllScores() ? 'Update & Next' : 'Save & Next'

  return (
    <div className="scorer-entry-content">
      {/* Hole Navigation Header - Sticky directly below main header */}
      <div className={cn('sticky top-[72px] z-[5] text-[#F5F5F5] shadow-md', headerClass)}>
        <div className="flex items-center justify-between p-3 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigatePrevious}
            className="text-[#F5F5F5] hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <button
            onClick={() => setShowHoleSelector(true)}
            className="text-center flex-1 hover:bg-white/10 rounded-lg py-2 transition-colors"
          >
            <div className="text-xl font-bold flex items-center justify-center gap-2">
              Hole {currentHole}
              <ChevronDown className="h-4 w-4" />
            </div>
            {carryOverCount() > 0 && (
              <div className="text-sm opacity-90">
                {carryOverCount()} carry-over{carryOverCount() > 1 ? 's' : ''}
              </div>
            )}
            <div className="text-sm opacity-90">
              Par {holePar} • Hdcp: {holeHdcp}
            </div>
            {hasPreviousUnscoredHoles() && (
              <div className="text-sm font-bold mt-1">
                ⚠️ Previous holes not scored
              </div>
            )}
            {isVerifier && (
              <div className="text-sm font-bold mt-1">
                🔍 Verifying Mode
              </div>
            )}
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateNext}
            className="text-[#F5F5F5] hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Hole Selector Dialog */}
      <Dialog open={showHoleSelector} onOpenChange={setShowHoleSelector}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Jump to Hole</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => (
              <Button
                key={hole}
                variant={hole === currentHole ? 'default' : 'outline'}
                className={cn(
                  'h-12 text-lg font-semibold relative',
                  hole === currentHole && 'bg-emerald-600 hover:bg-emerald-700',
                  isHoleScored(hole) && hole !== currentHole && 'bg-green-100 text-green-800 border-green-300'
                )}
                onClick={() => {
                  onJumpToHole(hole)
                  setShowHoleSelector(false)
                }}
              >
                {hole}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Content Container with padding */}
      <div className="p-4 max-w-2xl mx-auto">
        {/* Score Entry Form */}
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {sortedPlayers.map((player, index) => {
            const playerState = state[player.id]
            if (!playerState) return null

            const hasStrokes = getPlayerStrokes(player)
            const shortName = `${player.firstName} ${player.lastName.charAt(0)}`

            // Row background: amber if player has strokes on this hole
            const rowBgClass = hasStrokes ? 'bg-amber-50' : 'bg-white'

            return (
              <div key={player.id}>
                {index > 0 && <div className="border-t border-neutral-200" />}
                <div className={cn("p-3", rowBgClass)}>
                  {/* Row 1: Player Name + Toggles */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-neutral-900">{shortName}</span>
                    {/* Toggles on the right */}
                    <div className="flex items-center gap-2">
                      {/* Greenie Toggle (Par 3 only) */}
                      {trackGreenies && holePar === 3 && (
                        <button
                          onClick={() => !playerState.dnf && handleGreenieToggle(player.id, !playerState.greenie)}
                          disabled={playerState.dnf || (playerState.sandy && holePar === 3)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-colors",
                            playerState.greenie
                              ? "bg-green-500 text-white border-green-500"
                              : "bg-green-50 text-green-700 border-green-300 hover:bg-green-100",
                            (playerState.dnf || (playerState.sandy && holePar === 3)) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          GIR
                        </button>
                      )}

                      {/* Sandy Toggle */}
                      {trackSandies && (
                        <button
                          onClick={() => !playerState.dnf && handleSandyToggle(player.id, !playerState.sandy)}
                          disabled={playerState.dnf || (playerState.greenie && holePar === 3)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-colors",
                            playerState.sandy
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100",
                            (playerState.dnf || (playerState.greenie && holePar === 3)) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          Sandy
                        </button>
                      )}

                      {/* DNF Toggle */}
                      <button
                        onClick={() => handleDnfToggle(player.id)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-colors",
                          playerState.dnf
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                        )}
                      >
                        DNF
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Score and Dots controls - All aligned at top */}
                  <div className="flex items-start gap-3">
                    {/* Decrement Button - with spacer to align with input */}
                    <div className="shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-full bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                        onClick={() => decrementScore(player.id)}
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      <span className="text-[10px] text-transparent block">.</span>
                    </div>

                    {/* Score Input */}
                    <div className="w-16 shrink-0">
                      <Input
                        type="number"
                        value={playerState.score}
                        onChange={(e) => handleScoreChange(player.id, parseInt(e.target.value, 10))}
                        min={1}
                        max={getMaxScore(player)}
                        className="h-11 text-xl font-bold text-center"
                      />
                      <span className="text-[10px] text-neutral-400 text-center block">Score</span>
                    </div>

                    {/* Increment Button - with spacer to align with input */}
                    <div className="shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-full bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100"
                        onClick={() => incrementScore(player.id)}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                      <span className="text-[10px] text-transparent block">.</span>
                    </div>

                    {/* Spacer to push Dots to the right */}
                    <div className="flex-1" />

                    {/* Dots Input */}
                    <div className="w-16 shrink-0">
                      <Input
                        type="number"
                        value={playerState.dots}
                        onChange={(e) => handleDotsChange(player.id, parseInt(e.target.value, 10))}
                        min={0}
                        max={7}
                        className="h-11 text-xl font-bold text-center"
                      />
                      <span className="text-[10px] text-neutral-400 text-center block">Dots</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <Button
            onClick={handleSave}
            disabled={saving || hasPreviousUnscoredHoles()}
            className="w-full h-14 text-lg font-semibold bg-[#6495ED] hover:bg-[#5A85D7] text-[#F5F5F5]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              saveButtonLabel
            )}
          </Button>
          {hasPreviousUnscoredHoles() && (
            <p className="text-center text-orange-600 text-sm mt-2">
              Complete previous holes first
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

