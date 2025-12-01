import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Player, Course } from '@/types'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface ScoreEntryDialogProps {
  open: boolean
  onClose: () => void
  hole: number
  players: Player[]
  course: Course
  localPlayerScores: Map<string, Player>
  isVerifier: boolean
  onSaveScores: (
    hole: number,
    scores: Array<{
      playerId: string
      score: number | null
      dots: number
      greenie: boolean
      sandy: boolean
      dnf: boolean
    }>
  ) => void
  onNavigate: (direction: 'prev' | 'next') => void
}

export function ScoreEntryDialog({
  open,
  onClose,
  hole,
  players,
  course,
  localPlayerScores,
  isVerifier,
  onSaveScores,
  onNavigate,
}: ScoreEntryDialogProps) {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [playerScores, setPlayerScores] = useState<
    Map<
      string,
      {
        score: number | null
        dots: number
        greenie: boolean
        sandy: boolean
        dnf: boolean
      }
    >
  >(new Map())

  const currentPlayer = players[currentPlayerIndex]
  const holePar = course.teeboxes?.[0]?.holes[hole - 1]?.par || 4
  const isPar3 = holePar === 3

  // Initialize scores when dialog opens
  useEffect(() => {
    if (open) {
      const initialScores = new Map()
      players.forEach((player) => {
        const savedPlayer = localPlayerScores.get(player.id)
        initialScores.set(player.id, {
          score: savedPlayer?.score?.[hole - 1] ?? null,
          dots: savedPlayer?.dots?.[hole - 1] ?? 0,
          greenie: savedPlayer?.greenies?.includes(hole) ?? false,
          sandy: savedPlayer?.sandies?.includes(hole) ?? false,
          dnf: savedPlayer?.dnf?.[hole - 1] ?? false,
        })
      })
      setPlayerScores(initialScores)
      setCurrentPlayerIndex(0)
    }
  }, [open, hole, players, localPlayerScores])

  const currentScoreData = playerScores.get(currentPlayer?.id)

  const handleNumberPad = (value: number) => {
    if (!currentPlayer || !currentScoreData) return

    setPlayerScores(
      new Map(
        playerScores.set(currentPlayer.id, {
          ...currentScoreData,
          score: value,
          dnf: false, // Clear DNF if entering a score
        })
      )
    )
  }

  const handleDots = (dots: number) => {
    if (!currentPlayer || !currentScoreData) return

    setPlayerScores(
      new Map(
        playerScores.set(currentPlayer.id, {
          ...currentScoreData,
          dots: Math.max(0, Math.min(3, dots)), // Clamp to 0-3
        })
      )
    )
  }

  const handleToggle = (field: 'greenie' | 'sandy' | 'dnf') => {
    if (!currentPlayer || !currentScoreData) return

    const updates: any = { ...currentScoreData }

    if (field === 'dnf') {
      updates.dnf = !currentScoreData.dnf
      if (updates.dnf) {
        // When marking DNF, clear score and bonuses
        updates.score = null
        updates.dots = 0
        updates.greenie = false
        updates.sandy = false
      }
    } else {
      updates[field] = !currentScoreData[field]

      // On Par 3s, greenie and sandy are mutually exclusive
      if (isPar3) {
        if (field === 'greenie' && updates.greenie) {
          updates.sandy = false
        } else if (field === 'sandy' && updates.sandy) {
          updates.greenie = false
        }
      }
    }

    setPlayerScores(new Map(playerScores.set(currentPlayer.id, updates)))
  }

  const handleSave = () => {
    const scoresArray = Array.from(playerScores.entries()).map(
      ([playerId, data]) => ({
        playerId,
        ...data,
      })
    )
    onSaveScores(hole, scoresArray)
    onClose()
  }

  const handlePrevPlayer = () => {
    setCurrentPlayerIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNextPlayer = () => {
    setCurrentPlayerIndex((prev) => Math.min(players.length - 1, prev + 1))
  }

  const handlePrevHole = () => {
    onNavigate('prev')
  }

  const handleNextHole = () => {
    onNavigate('next')
  }

  const allScoresEntered = Array.from(playerScores.values()).every(
    (data) => data.score !== null || data.dnf
  )

  if (!currentPlayer || !currentScoreData) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Hole {hole} - Par {holePar}
            </span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Player Navigation */}
          <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevPlayer}
              disabled={currentPlayerIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <div className="font-semibold">{currentPlayer.shortName}</div>
              <div className="text-xs text-muted-foreground">
                Hdcp: {currentPlayer.tournamentHandicap || 0}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextPlayer}
              disabled={currentPlayerIndex === players.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Current Score Display */}
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Score</div>
            <div className="text-4xl font-bold">
              {currentScoreData.dnf
                ? 'DNF'
                : currentScoreData.score ?? '-'}
            </div>
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
              (num) => (
                <Button
                  key={num}
                  variant={
                    currentScoreData.score === num ? 'default' : 'outline'
                  }
                  onClick={() => handleNumberPad(num)}
                  disabled={currentScoreData.dnf}
                  className="h-12 text-lg"
                >
                  {num}
                </Button>
              )
            )}
            <Button
              variant="outline"
              onClick={() => handleNumberPad(0)}
              disabled={currentScoreData.dnf}
              className="h-12 text-lg"
            >
              Ace
            </Button>
          </div>

          {/* Dots Buttons */}
          <div className="space-y-2">
            <Label>Dots</Label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((dots) => (
                <Button
                  key={dots}
                  variant={
                    currentScoreData.dots === dots ? 'default' : 'outline'
                  }
                  onClick={() => handleDots(dots)}
                  disabled={currentScoreData.dnf}
                >
                  {dots === 0 ? 'None' : `+${dots}`}
                </Button>
              ))}
            </div>
          </div>

          {/* Greenie Toggle (Par 3 only) */}
          {isPar3 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="greenie"
                checked={currentScoreData.greenie}
                onCheckedChange={() => handleToggle('greenie')}
                disabled={currentScoreData.dnf}
              />
              <Label htmlFor="greenie" className="flex-1 cursor-pointer">
                Greenie (Closest to Pin) 🟢
              </Label>
            </div>
          )}

          {/* Sandy Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sandy"
              checked={currentScoreData.sandy}
              onCheckedChange={() => handleToggle('sandy')}
              disabled={currentScoreData.dnf}
            />
            <Label htmlFor="sandy" className="flex-1 cursor-pointer">
              Sandy (Bunker Save) 🏖️
            </Label>
          </div>

          {/* DNF Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dnf"
              checked={currentScoreData.dnf}
              onCheckedChange={() => handleToggle('dnf')}
            />
            <Label htmlFor="dnf" className="flex-1 cursor-pointer">
              DNF (Did Not Finish)
            </Label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handlePrevHole}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev Hole
            </Button>
            <Button
              onClick={handleSave}
              disabled={!allScoresEntered}
              className="flex-1"
            >
              Save
            </Button>
            <Button variant="outline" onClick={handleNextHole}>
              Next Hole
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {!allScoresEntered && (
            <p className="text-xs text-center text-muted-foreground">
              Enter scores for all players to save
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

