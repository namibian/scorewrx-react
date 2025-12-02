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
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
      <div className="flex items-center space-x-3">
        <Checkbox
          id="nassau-enabled"
          checked={value.enabled}
          onCheckedChange={updateEnabled}
          disabled={disabled || saving}
          className="h-5 w-5"
        />
        <Label htmlFor="nassau-enabled" className="text-base font-semibold text-neutral-900 cursor-pointer">
          Nassau Match
        </Label>
        {disabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-5 w-5 text-neutral-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Nassau Match requires exactly 2 players</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {value.enabled && (
        <div className="mt-4 space-y-5">
          {/* Amount Per Game */}
          <div className="grid grid-cols-[140px_1fr] gap-3 items-center">
            <Label htmlFor="nassau-amount" className="text-left text-sm font-medium text-neutral-700">
              $ Amount Per Game
            </Label>
            <Input
              id="nassau-amount"
              type="number"
              min="0"
              step="0.5"
              value={value.amountPerGame}
              onChange={(e) => updateAmount(e.target.value)}
              disabled={saving}
              className="h-11 text-base"
            />
          </div>

          {/* Automatic Presses */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="nassau-presses"
              checked={value.automaticPresses}
              onCheckedChange={updateAutomaticPresses}
              disabled={saving}
              className="h-5 w-5"
            />
            <Label htmlFor="nassau-presses" className="cursor-pointer text-sm font-medium text-neutral-700">
              Automatic Presses
            </Label>
          </div>

          {/* Match Type */}
          <div className="grid grid-cols-[140px_1fr] gap-3 items-center">
            <Label htmlFor="nassau-type" className="text-left text-sm font-medium text-neutral-700">
              Match Type
            </Label>
            <Select
              value={value.matchType}
              onValueChange={updateMatchType}
              disabled={saving}
            >
              <SelectTrigger id="nassau-type" className="h-11 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="py-3 text-base">Front, Back, Overall</SelectItem>
                <SelectItem value="frontback" className="py-3 text-base">Front, Back only</SelectItem>
                <SelectItem value="overall" className="py-3 text-base">Overall only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}

