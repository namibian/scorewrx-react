import { NassauSettings, Player } from '@/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NassauSetupProps {
  value: NassauSettings
  players: Player[]
  saving?: boolean
  disabled?: boolean
  onChange: (settings: NassauSettings) => void
}

export function NassauSetup({
  value,
  saving = false,
  disabled = false,
  onChange,
}: NassauSetupProps) {
  const updateEnabled = (checked: boolean) => {
    onChange({
      ...value,
      enabled: checked,
    })
  }

  const updateAmount = (amount: string) => {
    const numValue = Number(amount)
    if (isNaN(numValue) || numValue < 0) return

    onChange({
      ...value,
      amountPerGame: numValue,
    })
  }

  const updateAutomaticPresses = (checked: boolean) => {
    onChange({
      ...value,
      automaticPresses: checked,
    })
  }

  const updateMatchType = (matchType: string) => {
    onChange({
      ...value,
      matchType: matchType as 'all' | 'frontback' | 'overall',
    })
  }

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-2">
        <Checkbox
          id="nassau-enabled"
          checked={value.enabled}
          onCheckedChange={updateEnabled}
          disabled={disabled || saving}
        />
        <Label htmlFor="nassau-enabled" className="text-lg font-medium cursor-pointer">
          Nassau Match
        </Label>
        {disabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-5 w-5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Nassau Match requires exactly 2 players</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {value.enabled && (
        <div className="pl-6 mt-4 space-y-4">
          {/* Amount Per Game */}
          <div>
            <Label htmlFor="nassau-amount">Amount Per Game</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="nassau-amount"
                type="number"
                min="0"
                step="0.5"
                value={value.amountPerGame}
                onChange={(e) => updateAmount(e.target.value)}
                disabled={saving}
                className="pl-7"
              />
            </div>
          </div>

          {/* Automatic Presses */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="nassau-presses"
              checked={value.automaticPresses}
              onCheckedChange={updateAutomaticPresses}
              disabled={saving}
            />
            <Label htmlFor="nassau-presses" className="cursor-pointer">
              Automatic Presses
            </Label>
          </div>

          {/* Match Type */}
          <div>
            <Label htmlFor="nassau-type">Match Type</Label>
            <Select
              value={value.matchType}
              onValueChange={updateMatchType}
              disabled={saving}
            >
              <SelectTrigger id="nassau-type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Front, Back, Overall</SelectItem>
                <SelectItem value="frontback">Front, Back only</SelectItem>
                <SelectItem value="overall">Overall only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}

