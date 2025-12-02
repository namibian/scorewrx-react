import { Player } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface PlayerListProps {
  players: Player[]
  skinsPoolOptions: string[]
  disabled?: boolean
  onUpdatePlayer: (playerId: string, field: string, value: string) => void
}

export function PlayerList({
  players,
  skinsPoolOptions,
  disabled = false,
  onUpdatePlayer,
}: PlayerListProps) {
  // Generate short name if not available: "Chris O" format (firstName + lastInitial)
  const getDisplayName = (player: Player) => {
    if (player.shortName) return player.shortName
    if (player.firstName && player.lastName) {
      return `${player.firstName} ${player.lastName.charAt(0)}`
    }
    return player.firstName || player.lastName || 'Unknown'
  }

  return (
    <div className="space-y-3">
      {players.map((player) => (
        <div 
          key={player.id} 
          className="grid grid-cols-[1fr_120px] gap-3 items-center"
        >
          <div className="text-base font-medium text-neutral-900 truncate text-left">
            {getDisplayName(player)} ({player.tournamentHandicap || 0})
          </div>
          <div>
            <Label htmlFor={`player-${player.id}-skins`} className="sr-only">
              Skins Pool
            </Label>
            <Select
              value={player.skinsPool || 'None'}
              onValueChange={(value) =>
                onUpdatePlayer(player.id, 'skinsPool', value)
              }
              disabled={disabled}
            >
              <SelectTrigger 
                id={`player-${player.id}-skins`}
                className="w-full h-10 text-sm"
              >
                <SelectValue placeholder="Pool" />
              </SelectTrigger>
              <SelectContent>
                {skinsPoolOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  )
}

