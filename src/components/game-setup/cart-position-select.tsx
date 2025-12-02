import { Player } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface CartPositionSelectProps {
  value: Player | null
  players: Player[]
  position: 'driver' | 'rider'
  cartId: string
  isPlayerAssigned: (playerId: string) => boolean
  disabled?: boolean
  onChange: (player: Player | null) => void
}

export function CartPositionSelect({
  value,
  players,
  position,
  isPlayerAssigned,
  disabled = false,
  onChange,
}: CartPositionSelectProps) {
  const label = position.charAt(0).toUpperCase() + position.slice(1)

  // Generate display name: "Chris O" format
  const getDisplayName = (player: Player) => {
    if (player.shortName) return player.shortName
    if (player.firstName && player.lastName) {
      return `${player.firstName} ${player.lastName.charAt(0)}`
    }
    return player.firstName || player.lastName || 'Unknown'
  }

  const availablePlayers = players.filter(
    (player) => !isPlayerAssigned(player.id) || player.id === value?.id
  )

  return (
    <div className="grid grid-cols-[80px_1fr] gap-3 items-center">
      <Label htmlFor={`${position}-select`} className="text-left text-sm font-medium text-neutral-700">
        {label}
      </Label>
      <Select
        value={value?.id || ''}
        onValueChange={(playerId) => {
          if (playerId === '') {
            onChange(null)
          } else {
            const player = players.find((p) => p.id === playerId)
            onChange(player || null)
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id={`${position}-select`} className="w-full h-11 text-base">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {availablePlayers.map((player) => (
            <SelectItem key={player.id} value={player.id} className="py-3 text-base">
              {getDisplayName(player)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

