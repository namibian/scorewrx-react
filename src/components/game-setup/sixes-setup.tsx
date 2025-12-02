import { SixesSettings, Player, Course } from '@/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SixesSetupProps {
  value: SixesSettings
  players: Player[]
  courseData: Course | null
  saving?: boolean
  disabled?: boolean
  onChange: (settings: SixesSettings) => void
}

export function SixesSetup({
  value,
  courseData,
  saving = false,
  disabled = false,
  onChange,
}: SixesSetupProps) {
  const hasCourseData = courseData?.teeboxes?.[0]?.holes?.length === 18

  const updateField = (field: keyof SixesSettings, fieldValue: string | number | boolean) => {
    if (disabled) return

    // For amount fields, ensure we have a valid positive number
    if (field === 'amountPerGame') {
      const numValue = Number(fieldValue)
      if (isNaN(numValue) || numValue <= 0) return
      fieldValue = numValue
    }

    onChange({
      ...value,
      [field]: fieldValue,
    })
  }

  const toggleEnabled = () => {
    if (disabled) return
    onChange({
      ...value,
      enabled: !value.enabled,
    })
  }

  const getToggleHint = () => {
    if (disabled) return 'Requires exactly 4 players'
    if (!hasCourseData) return 'Course data required'
    return ''
  }

  return (
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
      <div className="flex items-center space-x-3">
        <Checkbox
          id="sixes-enabled"
          checked={value.enabled}
          onCheckedChange={toggleEnabled}
          disabled={disabled || !hasCourseData || saving}
          className="h-5 w-5"
        />
        <Label htmlFor="sixes-enabled" className="text-base font-semibold text-neutral-900 cursor-pointer">
          Sixes
        </Label>
      </div>

      {getToggleHint() && (
        <Alert className="mt-3">
          <AlertDescription className="text-sm">{getToggleHint()}</AlertDescription>
        </Alert>
      )}

      {value.enabled && (
        <div className="mt-4 space-y-5">
          {/* Amount per Game */}
          <div className="grid grid-cols-[140px_1fr] gap-3 items-center">
            <Label htmlFor="sixes-amount" className="text-left text-sm font-medium text-neutral-700">
              $ Amount per Game
            </Label>
            <Input
              id="sixes-amount"
              type="number"
              min="0"
              step="0.5"
              value={value.amountPerGame}
              onChange={(e) => updateField('amountPerGame', e.target.value)}
              disabled={disabled || saving}
              className="h-11 text-base"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="sixes-differential"
                checked={value.useDifferentialHandicap}
                onCheckedChange={(checked) =>
                  updateField('useDifferentialHandicap', checked)
                }
                disabled={disabled || saving}
                className="h-5 w-5"
              />
              <Label htmlFor="sixes-differential" className="cursor-pointer text-sm font-medium text-neutral-700">
                Use Differential Handicaps
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="sixes-distribute"
                checked={value.distributeStrokesEvenly}
                onCheckedChange={(checked) =>
                  updateField('distributeStrokesEvenly', checked)
                }
                disabled={disabled || saving}
                className="h-5 w-5"
              />
              <Label htmlFor="sixes-distribute" className="cursor-pointer text-sm font-medium text-neutral-700">
                Distribute Strokes Evenly
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="sixes-2points"
                checked={value.use2PointsPerGame}
                onCheckedChange={(checked) => updateField('use2PointsPerGame', checked)}
                disabled={disabled || saving}
                className="h-5 w-5"
              />
              <Label htmlFor="sixes-2points" className="cursor-pointer text-sm font-medium text-neutral-700">
                Use 2 Points Per Game
              </Label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

