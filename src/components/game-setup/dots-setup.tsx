import { DotsSettings, Player, Course } from '@/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useEffect } from 'react'

interface DotsSetupProps {
  value: DotsSettings
  players: Player[]
  courseData: Course | null
  saving?: boolean
  onChange: (settings: DotsSettings) => void
}

export function DotsSetup({
  value,
  players,
  courseData,
  saving = false,
  onChange,
}: DotsSetupProps) {
  const canPlayDots = players.length >= 2
  const hasCourseData = courseData?.teeboxes?.[0]?.holes?.length === 18

  // Generate display name: "Chris O" format
  const getDisplayName = (player: Player) => {
    if (player.shortName) return player.shortName
    if (player.firstName && player.lastName) {
      return `${player.firstName} ${player.lastName.charAt(0)}`
    }
    return player.firstName || player.lastName || 'Unknown'
  }

  const toggleEnabled = () => {
    onChange({
      ...value,
      enabled: !value.enabled,
    })
  }

  const updateField = (field: keyof DotsSettings, fieldValue: string | number | boolean) => {
    // For amount fields, ensure we have a valid positive number
    if (field === 'amountPerDot') {
      const numValue = Number(fieldValue)
      if (isNaN(numValue) || numValue <= 0) return
      fieldValue = numValue
    }

    onChange({
      ...value,
      [field]: fieldValue,
    })
  }

  // Vue format: participants is array of { playerId, selected } objects
  const isPlayerSelected = (playerId: string) => {
    const participant = value.participants?.find(p => p.playerId === playerId)
    return participant ? participant.selected : false
  }

  const togglePlayer = (playerId: string, selected: boolean) => {
    if (saving) return

    const participants = [...(value.participants || [])]
    const index = participants.findIndex(p => p.playerId === playerId)
    
    if (index >= 0) {
      participants[index] = { ...participants[index], selected }
    } else {
      participants.push({ playerId, selected })
    }

    onChange({
      ...value,
      participants,
    })
  }

  // Initialize all players as selected when enabled for the first time
  useEffect(() => {
    if (value.enabled && (!value.participants || value.participants.length === 0)) {
      // Vue format: array of { playerId, selected } objects
      onChange({
        ...value,
        participants: players.map((player) => ({ playerId: player.id, selected: true })),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.enabled, value.participants?.length, players])

  const getToggleHint = () => {
    if (!canPlayDots) return 'Requires at least 2 players'
    if (!hasCourseData) return 'Course data required'
    return ''
  }

  return (
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
      <div className="flex items-center space-x-3">
        <Checkbox
          id="dots-enabled"
          checked={value.enabled}
          onCheckedChange={toggleEnabled}
          disabled={!canPlayDots || !hasCourseData || saving}
          className="h-5 w-5"
        />
        <Label htmlFor="dots-enabled" className="text-base font-semibold text-neutral-900 cursor-pointer">
          Dots
        </Label>
      </div>

      {getToggleHint() && (
        <Alert className="mt-3">
          <AlertDescription className="text-sm">{getToggleHint()}</AlertDescription>
        </Alert>
      )}

      {value.enabled && (
        <div className="mt-4 space-y-5">
          {/* Amount per Dot */}
          <div className="grid grid-cols-[140px_1fr] gap-3 items-center">
            <Label htmlFor="dots-amount" className="text-left text-sm font-medium text-neutral-700">
              $ Amount per Dot
            </Label>
            <Input
              id="dots-amount"
              type="number"
              min="0"
              step="0.1"
              value={value.amountPerDot}
              onChange={(e) => updateField('amountPerDot', e.target.value)}
              disabled={saving}
              className="h-11 text-base"
            />
          </div>

          {/* Use Differential Handicaps */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="dots-differential"
              checked={value.useDifferentialHandicap}
              onCheckedChange={(checked) =>
                updateField('useDifferentialHandicap', checked)
              }
              disabled={saving}
              className="h-5 w-5"
            />
            <Label htmlFor="dots-differential" className="cursor-pointer text-sm font-medium text-neutral-700">
              Use Differential Handicaps
            </Label>
          </div>

          {/* Dots Tracking */}
          <div>
            <div className="text-sm font-medium text-neutral-700 mb-3 text-left">Dots tracking for:</div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="dots-greenies"
                  checked={value.trackGreenies}
                  onCheckedChange={(checked) => updateField('trackGreenies', checked)}
                  disabled={saving}
                  className="h-5 w-5"
                />
                <Label htmlFor="dots-greenies" className="cursor-pointer text-sm text-neutral-700">
                  Greenies
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="dots-sandies"
                  checked={value.trackSandies}
                  onCheckedChange={(checked) => updateField('trackSandies', checked)}
                  disabled={saving}
                  className="h-5 w-5"
                />
                <Label htmlFor="dots-sandies" className="cursor-pointer text-sm text-neutral-700">
                  Sandies
                </Label>
              </div>
            </div>
          </div>

          {/* Player Selection */}
          <div>
            <div className="text-sm font-medium text-neutral-700 mb-3 text-left">Participating Players:</div>
            <div className="space-y-3">
              {players.map((player) => (
                <div key={player.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`dots-player-${player.id}`}
                    checked={isPlayerSelected(player.id)}
                    onCheckedChange={(checked) =>
                      togglePlayer(player.id, checked as boolean)
                    }
                    disabled={saving}
                    className="h-5 w-5"
                  />
                  <Label
                    htmlFor={`dots-player-${player.id}`}
                    className="cursor-pointer text-sm text-neutral-900"
                  >
                    {getDisplayName(player)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

