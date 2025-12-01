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
  const updateField = (field: keyof NinesSettings, fieldValue: any) => {
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
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-2">
        <Checkbox
          id="nines-enabled"
          checked={value.enabled}
          onCheckedChange={toggleEnabled}
          disabled={disabled || saving}
        />
        <Label htmlFor="nines-enabled" className="text-lg font-medium cursor-pointer">
          Nines
        </Label>
      </div>

      {getToggleHint() && (
        <Alert className="mb-2">
          <AlertDescription className="text-sm">{getToggleHint()}</AlertDescription>
        </Alert>
      )}

      {value.enabled && (
        <div className="pl-6 mt-4 space-y-4">
          {/* Amount per Point */}
          <div>
            <Label htmlFor="nines-amount">$ Amount per Point</Label>
            <Input
              id="nines-amount"
              type="number"
              min="0"
              step="0.1"
              value={value.amountPerPoint}
              onChange={(e) => updateField('amountPerPoint', e.target.value)}
              disabled={disabled || saving}
              className="mt-1"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="nines-differential"
              checked={value.useDifferentialHandicap}
              onCheckedChange={(checked) =>
                updateField('useDifferentialHandicap', checked)
              }
              disabled={disabled || saving}
            />
            <Label htmlFor="nines-differential" className="cursor-pointer">
              Use Differential Handicaps
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}

