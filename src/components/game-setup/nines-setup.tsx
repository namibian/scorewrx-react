import { NinesSettings, Player } from '@/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface NinesSetupProps {
  value: NinesSettings
  players: Player[]
  saving?: boolean
  disabled?: boolean
  onChange: (settings: NinesSettings) => void
}

export function NinesSetup({
  value,
  players,
  saving = false,
  disabled = false,
  onChange,
}: NinesSetupProps) {
  const updateField = (field: keyof NinesSettings, fieldValue: string | number | boolean) => {
    if (disabled) return

    // For amount fields, ensure we have a valid positive number
    if (field === 'amountPerPoint') {
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

  const canPlayNines = players.length >= 2

  const getToggleHint = () => {
    if (disabled) return 'Requires exactly 3 players'
    if (!canPlayNines) return 'Requires at least 2 players'
    return ''
  }

  return (
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
      <div className="flex items-center space-x-3">
        <Checkbox
          id="nines-enabled"
          checked={value.enabled}
          onCheckedChange={toggleEnabled}
          disabled={disabled || saving}
          className="h-5 w-5"
        />
        <Label htmlFor="nines-enabled" className="text-base font-semibold text-neutral-900 cursor-pointer">
          Nines
        </Label>
      </div>

      {getToggleHint() && (
        <Alert className="mt-3">
          <AlertDescription className="text-sm">{getToggleHint()}</AlertDescription>
        </Alert>
      )}

      {value.enabled && (
        <div className="mt-4 space-y-5">
          {/* Amount per Point */}
          <div className="grid grid-cols-[140px_1fr] gap-3 items-center">
            <Label htmlFor="nines-amount" className="text-left text-sm font-medium text-neutral-700">
              $ Amount per Point
            </Label>
            <Input
              id="nines-amount"
              type="number"
              min="0"
              step="0.1"
              value={value.amountPerPoint}
              onChange={(e) => updateField('amountPerPoint', e.target.value)}
              disabled={disabled || saving}
              className="h-11 text-base"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="nines-differential"
              checked={value.useDifferentialHandicap}
              onCheckedChange={(checked) =>
                updateField('useDifferentialHandicap', checked)
              }
              disabled={disabled || saving}
              className="h-5 w-5"
            />
            <Label htmlFor="nines-differential" className="cursor-pointer text-sm font-medium text-neutral-700">
              Use Differential Handicaps
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}

