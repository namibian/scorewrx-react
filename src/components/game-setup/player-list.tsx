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
  onUpdatePlayer: (playerId: string, field: string, value: any) => void
}

export function PlayerList({
  players,
  skinsPoolOptions,
  disabled = false,
  onUpdatePlayer,
}: PlayerListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Players</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {players.map((player) => (
          <div key={player.id} className="flex items-center gap-4">
            <div className="text-sm font-medium min-w-[120px] max-w-[120px] truncate">
              {player.shortName} ({player.tournamentHandicap || 0})
            </div>
            <div className="flex-1">
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
                <SelectTrigger id={`player-${player.id}-skins`}>
                  <SelectValue placeholder="Skins Pool" />
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
      </CardContent>
    </Card>
  )
}

