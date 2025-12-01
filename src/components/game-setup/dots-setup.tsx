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

  const toggleEnabled = () => {
    onChange({
      ...value,
      enabled: !value.enabled,
    })
  }

  const updateField = (field: keyof DotsSettings, fieldValue: any) => {
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

  const isPlayerSelected = (playerId: string) => {
    return value.participants.includes(playerId)
  }

  const togglePlayer = (playerId: string, selected: boolean) => {
    if (saving) return

    const participants = selected
      ? [...value.participants, playerId]
      : value.participants.filter((id) => id !== playerId)

    onChange({
      ...value,
      participants,
    })
  }

  // Initialize all players as selected when enabled for the first time
  useEffect(() => {
    if (value.enabled && value.participants.length === 0) {
      onChange({
        ...value,
        participants: players.map((player) => player.id),
      })
    }
  }, [value.enabled, value.participants.length, players, onChange])

  const getToggleHint = () => {
    if (!canPlayDots) return 'Requires at least 2 players'
    if (!hasCourseData) return 'Course data required'
    return ''
  }

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-2">
        <Checkbox
          id="dots-enabled"
          checked={value.enabled}
          onCheckedChange={toggleEnabled}
          disabled={!canPlayDots || !hasCourseData || saving}
        />
        <Label htmlFor="dots-enabled" className="text-lg font-medium cursor-pointer">
          Dots
        </Label>
      </div>

      {getToggleHint() && (
        <Alert className="mb-2">
          <AlertDescription className="text-sm">{getToggleHint()}</AlertDescription>
        </Alert>
      )}

      {value.enabled && (
        <div className="pl-6 mt-4 space-y-4">
          {/* Amount per Dot */}
          <div>
            <Label htmlFor="dots-amount">$ Amount per Dot</Label>
            <Input
              id="dots-amount"
              type="number"
              min="0"
              step="0.1"
              value={value.amountPerDot}
              onChange={(e) => updateField('amountPerDot', e.target.value)}
              disabled={saving}
              className="mt-1"
            />
          </div>

          {/* Use Differential Handicaps */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dots-differential"
              checked={value.useDifferentialHandicap}
              onCheckedChange={(checked) =>
                updateField('useDifferentialHandicap', checked)
              }
              disabled={saving}
            />
            <Label htmlFor="dots-differential" className="cursor-pointer">
              Use Differential Handicaps
            </Label>
          </div>

          {/* Dots Tracking */}
          <div>
            <div className="text-sm font-medium mb-2">Dots tracking for:</div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dots-greenies"
                  checked={value.trackGreenies}
                  onCheckedChange={(checked) => updateField('trackGreenies', checked)}
                  disabled={saving}
                />
                <Label htmlFor="dots-greenies" className="cursor-pointer">
                  Greenies
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dots-sandies"
                  checked={value.trackSandies}
                  onCheckedChange={(checked) => updateField('trackSandies', checked)}
                  disabled={saving}
                />
                <Label htmlFor="dots-sandies" className="cursor-pointer">
                  Sandies
                </Label>
              </div>
            </div>
          </div>

          {/* Player Selection */}
          <div>
            <div className="text-sm font-medium mb-2">Select Players:</div>
            <div className="flex flex-wrap gap-4">
              {players.map((player) => (
                <div key={player.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dots-player-${player.id}`}
                    checked={isPlayerSelected(player.id)}
                    onCheckedChange={(checked) =>
                      togglePlayer(player.id, checked as boolean)
                    }
                    disabled={saving}
                  />
                  <Label
                    htmlFor={`dots-player-${player.id}`}
                    className="cursor-pointer"
                  >
                    {player.shortName}
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

