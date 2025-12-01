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

  const availablePlayers = players.filter(
    (player) => !isPlayerAssigned(player.id) || player.id === value?.id
  )

  return (
    <div className="space-y-2">
      <Label htmlFor={`${position}-select`}>{label}</Label>
      <Select
        value={value?.id || 'none'}
        onValueChange={(playerId) => {
          if (playerId === 'none') {
            onChange(null)
          } else {
            const player = players.find((p) => p.id === playerId)
            onChange(player || null)
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id={`${position}-select`}>
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {availablePlayers.map((player) => (
            <SelectItem key={player.id} value={player.id}>
              {player.shortName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

