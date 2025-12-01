import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  GripVertical, 
  ChevronDown, 
  ChevronUp, 
  UserPlus, 
  Trash2,
  RotateCcw,
  X
} from 'lucide-react'
import type { Group, Player } from '@/types'

interface GroupCardProps {
  group: Group
  groupIndex: number
  canEdit: boolean
  isShotgunStart: boolean
  onUpdateTeeTime: (teeTime: string) => void
  onUpdateStartingTee: (tee: number) => void
  onToggleCollapse: () => void
  onAddPlayers: () => void
  onDeleteGroup: () => void
  onRemovePlayer: (player: Player) => void
  onUpdatePlayer: (player: Player) => void
  onResetHandicap: (player: Player) => void
}

export function GroupCard({
  group,
  groupIndex,
  canEdit,
  isShotgunStart,
  onUpdateTeeTime,
  onUpdateStartingTee,
  onToggleCollapse,
  onAddPlayers,
  onDeleteGroup,
  onRemovePlayer,
  onUpdatePlayer,
  onResetHandicap,
}: GroupCardProps) {
  const [localTeeTime, setLocalTeeTime] = useState(group.teeTime)
  const [localStartingTee, setLocalStartingTee] = useState(group.startingTee)

  const handleTeeTimeBlur = () => {
    if (localTeeTime !== group.teeTime) {
      onUpdateTeeTime(localTeeTime)
    }
  }

  const handleStartingTeeBlur = () => {
    if (localStartingTee !== group.startingTee) {
      onUpdateStartingTee(localStartingTee)
    }
  }

  const handlePlayerHandicapChange = (player: Player, newHandicap: string) => {
    const handicap = parseInt(newHandicap) || 0
    onUpdatePlayer({ ...player, tournamentHandicap: handicap })
  }

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <button
          className={`cursor-move p-1 hover:bg-muted rounded ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!canEdit}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        
        <div className="flex-1 flex items-center gap-2">
          <h3 className="font-semibold">Group {groupIndex + 1}</h3>
          {!canEdit && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Locked - Has Scores
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
        >
          {group.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onAddPlayers}
          disabled={!canEdit}
        >
          <UserPlus className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDeleteGroup}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Collapsed view */}
      {group.collapsed ? (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Group {groupIndex + 1}</Badge>
          <Badge variant="outline">Tee Time: {group.teeTime}</Badge>
          <Badge variant="outline">Players: {group.players.length}</Badge>
          {!canEdit && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Locked - Has Scores
            </Badge>
          )}
        </div>
      ) : (
        <>
          {/* Group Settings */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Tee Time</label>
              <Input
                type="time"
                value={localTeeTime}
                onChange={(e) => setLocalTeeTime(e.target.value)}
                onBlur={handleTeeTimeBlur}
                disabled={isShotgunStart || !canEdit}
              />
            </div>
            {isShotgunStart && (
              <div>
                <label className="text-sm font-medium mb-1 block">Starting Tee</label>
                <Input
                  type="number"
                  min="1"
                  max="18"
                  value={localStartingTee}
                  onChange={(e) => setLocalStartingTee(Number(e.target.value))}
                  onBlur={handleStartingTeeBlur}
                  disabled={!canEdit}
                />
              </div>
            )}
          </div>

          {/* Players List */}
          {group.players.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              No players in this group. Click the + button to add players.
            </div>
          ) : (
            <div className="space-y-2">
              {group.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1 font-medium min-w-0">
                    <div className="truncate">{player.shortName}</div>
                  </div>
                  
                  <div className="w-24">
                    <Input
                      type="number"
                      min="-10"
                      max="50"
                      value={player.tournamentHandicap}
                      onChange={(e) => handlePlayerHandicapChange(player, e.target.value)}
                      disabled={!canEdit}
                      placeholder="HCP"
                      className="text-center"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onResetHandicap(player)}
                    disabled={!canEdit}
                    title="Reset to Index"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemovePlayer(player)}
                    disabled={!canEdit}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  )
}


