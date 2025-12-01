import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Search } from 'lucide-react'
import type { Player } from '@/types'

interface PlayerSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupIndex: number
  availablePlayers: Player[]
  onAddPlayers: (players: Player[]) => void
}

export function PlayerSelectionDialog({
  open,
  onOpenChange,
  groupIndex,
  availablePlayers,
  onAddPlayers,
}: PlayerSelectionDialogProps) {
  const [playerSearch, setPlayerSearch] = useState('')
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedPlayers([])
      setPlayerSearch('')
    }
  }, [open])

  // Parse search terms (split by comma and trim)
  const searchTerms = useMemo(() => {
    if (!playerSearch) return []
    
    return playerSearch
      .split(',')
      .map(term => term.trim().toLowerCase())
      .filter(term => term.length > 0)
  }, [playerSearch])

  // Filter players based on search
  const filteredPlayers = useMemo(() => {
    if (!playerSearch || searchTerms.length === 0) {
      return availablePlayers
    }
    
    // Return players that match ANY of the search terms
    return availablePlayers.filter(player => {
      const firstName = player.firstName.toLowerCase()
      const lastName = player.lastName.toLowerCase()
      const fullName = `${firstName} ${lastName}`
      
      // Check if any search term matches
      return searchTerms.some(term => 
        firstName.includes(term) ||
        lastName.includes(term) ||
        fullName.includes(term)
      )
    })
  }, [availablePlayers, playerSearch, searchTerms])

  const handleTogglePlayer = (player: Player) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.id === player.id)
      if (isSelected) {
        return prev.filter(p => p.id !== player.id)
      } else {
        return [...prev, player]
      }
    })
  }

  const handleAddSelected = () => {
    onAddPlayers(selectedPlayers)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Players to Group {groupIndex + 1}</DialogTitle>
          <DialogDescription>
            Select players to add to this group
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players (e.g., Chris, Deane, Howard)..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="pl-10"
            />
            {searchTerms.length > 1 && (
              <div className="text-xs text-muted-foreground mt-1">
                Searching for {searchTerms.length} names
              </div>
            )}
          </div>

          {/* Player List */}
          <div className="flex-1 border rounded-md overflow-y-auto">
            {filteredPlayers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No players available
              </div>
            ) : (
              <div className="divide-y">
                {filteredPlayers.map((player) => {
                  const isSelected = selectedPlayers.some(p => p.id === player.id)
                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleTogglePlayer(player)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleTogglePlayer(player)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {player.lastName}, {player.firstName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Handicap: {player.handicapIndex || 0}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddSelected}
            disabled={selectedPlayers.length === 0}
          >
            Add Selected ({selectedPlayers.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

