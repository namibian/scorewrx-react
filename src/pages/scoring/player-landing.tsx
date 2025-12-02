import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Loader2, Users, ChevronDown, Plus, Minus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { usePlayersStore } from '@/stores/players-store'
import {
  getTournamentSession,
  hasSession,
  clearTournamentSession,
} from '@/hooks/use-tournament-session'
import { Tournament, Player, Group } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TournamentPlayer extends Player {
  groupId: string
  groupNumber: number
}

export default function PlayerLandingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tournamentsStore = useTournamentsStore()
  const playersStore = usePlayersStore()
  
  // Preserve debug mode through navigation
  const debugParam = searchParams.get('debug') === 'true' ? '?debug=true' : ''

  // State
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<TournamentPlayer | null>(null)
  const [isScorer, setIsScorer] = useState(false)
  const [isVerifier, setIsVerifier] = useState(false)
  
  // Group editing state (for scorers)
  const [editableGroupPlayers, setEditableGroupPlayers] = useState<Player[]>([])
  const [originalGroupPlayers, setOriginalGroupPlayers] = useState<Player[]>([])
  const [savingGroup, setSavingGroup] = useState(false)
  
  // Take over scoring dialog
  const [willTakeOverScoring, setWillTakeOverScoring] = useState(false)
  const [removeCurrentScorer, setRemoveCurrentScorer] = useState(false)

  // Fetch tournament data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Check for valid session
        if (!hasSession()) {
          navigate(`/scoring${debugParam}`)
          return
        }

        const session = getTournamentSession()
        if (!session?.tournamentId) {
          navigate(`/scoring${debugParam}`)
          return
        }

        // Fetch tournament
        const tournamentData = await tournamentsStore.getTournament(session.tournamentId)
        if (!tournamentData) {
          toast.error('Tournament not found')
          clearTournamentSession()
          navigate(`/scoring${debugParam}`)
          return
        }

        setTournament(tournamentData)

        // Fetch players for the affiliation if needed
        if (tournamentData.affiliation) {
          await playersStore.fetchPlayersByAffiliation(tournamentData.affiliation)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        toast.error('Failed to load tournament data')
        navigate(`/scoring${debugParam}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate, tournamentsStore, playersStore])

  // Build list of tournament players with group info
  const tournamentPlayers: TournamentPlayer[] = tournament?.groups?.flatMap((group) =>
    (group.players || []).map((player) => ({
      ...player,
      groupId: group.id,
      groupNumber: group.number || 1,
    }))
  ).sort((a, b) => `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`)) || []

  // Get selected group
  const selectedGroup = selectedPlayer
    ? tournament?.groups?.find((g) => g.id === selectedPlayer.groupId)
    : null

  // Check if selected player is the scorer
  const isSelectedPlayerScorer = selectedGroup?.scorerId === selectedPlayer?.id

  // Check if selected player is the verifier
  const isSelectedPlayerVerifier = selectedGroup?.verifierId === selectedPlayer?.id

  // Check if group has a scorer
  const hasGroupScorer = (groupId: string): boolean => {
    const group = tournament?.groups?.find((g) => g.id === groupId)
    return !!group?.scorerId
  }

  // Get group scorer name
  const getGroupScorer = (groupId: string): string => {
    const group = tournament?.groups?.find((g) => g.id === groupId)
    if (!group?.scorerId) return ''
    const scorer = group.players?.find((p) => p.id === group.scorerId)
    return scorer ? `${scorer.firstName} ${scorer.lastName}` : ''
  }

  // Check if group has a verifier
  const hasGroupVerifier = (groupId: string): boolean => {
    const group = tournament?.groups?.find((g) => g.id === groupId)
    return !!group?.verifierId
  }

  // Get group verifier name
  const getGroupVerifier = (groupId: string): string => {
    const group = tournament?.groups?.find((g) => g.id === groupId)
    if (!group?.verifierId) return ''
    const verifier = group.players?.find((p) => p.id === group.verifierId)
    return verifier ? `${verifier.firstName} ${verifier.lastName}` : ''
  }

  // Get group player names
  const getGroupPlayerNames = (groupId: string): string => {
    const group = tournament?.groups?.find((g) => g.id === groupId)
    if (!group?.players) return ''
    return group.players.map((p) => `${p.firstName} ${p.lastName}`).join(', ')
  }

  // Check if can continue
  const canContinue = !!selectedPlayer && !processing

  // Check if group has max players
  const hasMaxPlayersInGroup = editableGroupPlayers.length >= 4

  // Check if group has changes
  const groupHasChanges = (): boolean => {
    if (!originalGroupPlayers.length) return false
    if (editableGroupPlayers.length !== originalGroupPlayers.length) return true
    return editableGroupPlayers.some((player, index) => {
      const original = originalGroupPlayers[index]
      return !original || 
             player.id !== original.id || 
             player.tournamentHandicap !== original.tournamentHandicap
    })
  }

  // Get available players for adding to group
  const availablePlayersForGroup = (): Player[] => {
    if (!tournament?.groups || !selectedPlayer) return []

    const currentPlayerIds = new Set(editableGroupPlayers.map((p) => p.id))
    
    // Get all players already assigned to any group
    const assignedPlayerIds = new Set<string>()
    tournament.groups.forEach((group) => {
      if (group.id !== selectedPlayer.groupId) {
        group.players?.forEach((player) => assignedPlayerIds.add(player.id))
      }
    })

    return playersStore.players
      .filter((p) => !currentPlayerIds.has(p.id) && !assignedPlayerIds.has(p.id))
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
  }

  // Initialize editable group when player is selected
  const initializeEditableGroup = () => {
    if (!selectedGroup?.players) {
      setEditableGroupPlayers([])
      setOriginalGroupPlayers([])
      return
    }
    
    const playersCopy = JSON.parse(JSON.stringify(selectedGroup.players))
    setEditableGroupPlayers(playersCopy)
    setOriginalGroupPlayers(playersCopy)
  }

  // Handle player selection
  const handlePlayerSelect = (playerId: string) => {
    const player = tournamentPlayers.find((p) => p.id === playerId)
    if (!player) return

    setSelectedPlayer(player)
    
    // Check if player is scorer
    const group = tournament?.groups?.find((g) => g.id === player.groupId)
    if (group?.scorerId === player.id) {
      setIsScorer(true)
      toast.success(`Welcome back! You are the scorer for Group ${group.number}`)
    } else {
      setIsScorer(false)
    }

    // Check if player is verifier
    if (group?.verifierId === player.id) {
      setIsVerifier(true)
      toast.info(`You are the verifier for Group ${group?.number}`)
    } else {
      setIsVerifier(false)
    }
  }

  // Handle player handicap change in group editor
  const handleHandicapChange = (playerId: string, value: number) => {
    setEditableGroupPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, tournamentHandicap: value } : p))
    )
  }

  // Remove player from group
  const removePlayerFromGroup = (playerId: string) => {
    setEditableGroupPlayers((prev) => prev.filter((p) => p.id !== playerId))
  }

  // Add player to group
  const addPlayerToGroup = (player: Player) => {
    setEditableGroupPlayers((prev) => [
      ...prev,
      { ...player, tournamentHandicap: player.handicapIndex || 0 },
    ])
  }

  // Save group changes
  const saveGroupChanges = async () => {
    if (!selectedGroup || !tournament) return

    try {
      setSavingGroup(true)

      if (editableGroupPlayers.length === 0) {
        toast.error('At least one player is required in the group')
        return
      }

      const updatedGroup = {
        ...selectedGroup,
        players: editableGroupPlayers,
      }

      await tournamentsStore.updateGroup(tournament.id, selectedGroup.id, updatedGroup)

      // Refresh tournament data
      const refreshedTournament = await tournamentsStore.getTournament(tournament.id)
      setTournament(refreshedTournament)

      // Reset original to match saved
      setOriginalGroupPlayers(JSON.parse(JSON.stringify(editableGroupPlayers)))

      toast.success('Group updated successfully')
    } catch (error) {
      console.error('Error saving group changes:', error)
      toast.error('Failed to save group changes')
    } finally {
      setSavingGroup(false)
    }
  }

  // Start scoring
  const startScoring = async () => {
    if (!selectedPlayer || !tournament) return

    setProcessing(true)

    try {
      const group = tournament.groups?.find((g) => g.id === selectedPlayer.groupId)
      if (!group) {
        throw new Error('Group not found')
      }

      // If user wants to be scorer, update the group
      if (isScorer && group.scorerId !== selectedPlayer.id) {
        await tournamentsStore.updateGroup(tournament.id, group.id, {
          ...group,
          scorerId: selectedPlayer.id,
        })
      }

      // If user wants to be verifier, update the group
      if (isVerifier && group.verifierId !== selectedPlayer.id) {
        // Verifier cannot be the same as scorer
        if (selectedPlayer.id === group.scorerId) {
          throw new Error('Verifier cannot also be the scorer')
        }
        await tournamentsStore.updateGroup(tournament.id, group.id, {
          ...group,
          verifierId: selectedPlayer.id,
        })
      }

      // Navigate based on role (preserve debug param)
      if (isScorer) {
        // Scorer goes through game setup
        navigate(`/scoring/setup/${tournament.id}/${selectedPlayer.id}/${selectedPlayer.groupId}${debugParam}`)
      } else {
        // Verifier and viewer go directly to scorecard
        navigate(`/scoring/scorecard/${tournament.id}/${selectedPlayer.id}/${selectedPlayer.groupId}${debugParam}`)
      }
    } catch (err: any) {
      console.error('Error in startScoring:', err)
      toast.error(err.message || 'Failed to start scoring')
    } finally {
      setProcessing(false)
    }
  }

  // Handle take over scoring
  const confirmTakeOver = async () => {
    if (!selectedPlayer || !selectedGroup || !tournament) return

    try {
      setProcessing(true)
      
      const currentScorerId = selectedGroup.scorerId
      if (!currentScorerId) return

      let updatedPlayers = [...selectedGroup.players]
      
      // Remove current scorer if requested
      if (removeCurrentScorer) {
        updatedPlayers = updatedPlayers.filter((p) => p.id !== currentScorerId)
      }

      const updatedGroup = {
        ...selectedGroup,
        players: updatedPlayers,
        scorerId: selectedPlayer.id,
      }

      await tournamentsStore.updateGroup(tournament.id, selectedGroup.id, updatedGroup)

      setWillTakeOverScoring(false)
      setRemoveCurrentScorer(false)

      toast.success('Successfully took over as scorer')

      // Navigate to game setup (preserve debug param)
      navigate(`/scoring/setup/${tournament.id}/${selectedPlayer.id}/${selectedPlayer.groupId}${debugParam}`)
    } catch (err) {
      console.error('Error taking over as scorer:', err)
      toast.error('Failed to take over as scorer')
    } finally {
      setProcessing(false)
    }
  }

  // Reset selection
  const resetSelection = () => {
    setSelectedPlayer(null)
    setIsScorer(false)
    setIsVerifier(false)
    setEditableGroupPlayers([])
    setOriginalGroupPlayers([])
  }

  // Format tournament date
  const formatTournamentDate = (date: string | Date | undefined): string => {
    if (!date) return ''
    try {
      const dateObj = typeof date === 'string' ? new Date(date + 'T12:00:00') : date
      return format(dateObj, 'EEEE, MMMM do, yyyy')
    } catch {
      return 'Date not available'
    }
  }

  // Effect to initialize editable group when player is selected and is scorer
  useEffect(() => {
    if (selectedPlayer && (isSelectedPlayerScorer || isScorer)) {
      initializeEditableGroup()
    }
  }, [selectedPlayer, isSelectedPlayerScorer, isScorer])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading tournament data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-center text-xl font-semibold">
          {selectedPlayer ? `Group ${selectedGroup?.number || ''}` : 'Game Setup'}
        </h1>
      </header>

      {/* Loading Overlay */}
      {(loading || processing) && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-semibold text-primary">
              {loading ? 'Loading tournament data...' : 'Setting up your game...'}
            </p>
            {processing && (
              <p className="text-sm text-muted-foreground mt-2">
                Please wait while we prepare your game
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container max-w-2xl mx-auto p-4 pt-6 space-y-4">
        {/* Tournament Info Card */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-1">{tournament?.name}</h2>
            <p className="text-base text-muted-foreground">{formatTournamentDate(tournament?.date)}</p>
            <p className="text-sm text-muted-foreground">{tournament?.courseName}</p>
          </CardContent>
        </Card>

        {/* Player Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Player Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Player Dropdown */}
            <div>
              <Label htmlFor="player-select">Select Your Name</Label>
              <Select
                value={selectedPlayer?.id || ''}
                onValueChange={handlePlayerSelect}
                disabled={processing}
              >
                <SelectTrigger id="player-select" className="w-full mt-1.5">
                  <SelectValue placeholder="Select your name" />
                </SelectTrigger>
                <SelectContent>
                  {tournamentPlayers.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.lastName}, {player.firstName} (Group {player.groupNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Player Details */}
            {selectedPlayer && (
              <>
                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-3">Your Group</h3>

                  {/* If scorer: Show editable group */}
                  {(isSelectedPlayerScorer || isScorer) ? (
                    <div className="space-y-4">
                      {/* Editable Players List */}
                      <div className="space-y-3">
                        {editableGroupPlayers.map((player) => (
                          <div key={player.id} className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="font-medium">{player.lastName}, {player.firstName}</p>
                            </div>
                            <div className="w-20">
                              <Input
                                type="number"
                                value={player.tournamentHandicap || 0}
                                onChange={(e) => handleHandicapChange(player.id, Number(e.target.value))}
                                min={0}
                                max={36}
                                className="text-center"
                                placeholder="HCP"
                              />
                            </div>
                            {player.id !== selectedPlayer.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => removePlayerFromGroup(player.id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Player */}
                      {!hasMaxPlayersInGroup ? (
                        <Select onValueChange={(id) => {
                          const player = availablePlayersForGroup().find((p) => p.id === id)
                          if (player) addPlayerToGroup(player)
                        }}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Add player to group" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePlayersForGroup().map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.lastName}, {player.firstName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground">Maximum of 4 players reached</p>
                      )}

                      {/* Save Group Changes */}
                      {groupHasChanges() && (
                        <Button
                          onClick={saveGroupChanges}
                          disabled={savingGroup}
                          className="w-full"
                          size="lg"
                        >
                          {savingGroup ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Group Changes'
                          )}
                        </Button>
                      )}
                    </div>
                  ) : (
                    /* If NOT scorer: Just show player list */
                    <div className="space-y-4">
                      <p className="text-base">{getGroupPlayerNames(selectedPlayer.groupId)}</p>

                      <Separator />

                      {/* Scoring Preference */}
                      <div>
                        <h4 className="text-lg font-semibold mb-2">Scoring Preference</h4>
                        
                        {!hasGroupScorer(selectedPlayer.groupId) ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="scorer-checkbox"
                                checked={isScorer}
                                onCheckedChange={(checked) => setIsScorer(checked as boolean)}
                                disabled={processing}
                              />
                              <Label htmlFor="scorer-checkbox" className="text-base">
                                I will be the scorer for my group
                              </Label>
                            </div>
                            {isScorer && (
                              <p className="text-sm text-muted-foreground ml-6">
                                You will be responsible for entering scores for your group
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-orange-600 font-medium">
                              {getGroupScorer(selectedPlayer.groupId)} is currently the scorer for your group
                            </p>
                            <Button
                              onClick={() => setWillTakeOverScoring(true)}
                              disabled={processing}
                              className="w-full"
                              size="lg"
                            >
                              Take Over as Scorer
                            </Button>

                            {/* Verifier Option */}
                            <Separator />
                            <h4 className="text-lg font-semibold">Verification Role</h4>
                            
                            {!hasGroupVerifier(selectedPlayer.groupId) ? (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="verifier-checkbox"
                                    checked={isVerifier}
                                    onCheckedChange={(checked) => setIsVerifier(checked as boolean)}
                                    disabled={processing || selectedPlayer.id === selectedGroup?.scorerId}
                                  />
                                  <Label htmlFor="verifier-checkbox" className="text-base">
                                    I will verify scores for my group
                                  </Label>
                                </div>
                                {isVerifier && (
                                  <p className="text-sm text-muted-foreground ml-6">
                                    You will independently verify all score entries
                                  </p>
                                )}
                                {selectedPlayer.id === selectedGroup?.scorerId && (
                                  <p className="text-sm text-orange-600 ml-6">
                                    Scorer cannot also be the verifier
                                  </p>
                                )}
                              </div>
                            ) : isSelectedPlayerVerifier ? (
                              <div className="space-y-2">
                                <p className="text-green-600 font-medium">
                                  You are currently the verifier for this group
                                </p>
                                <Button
                                  variant="outline"
                                  className="w-full text-destructive border-destructive hover:bg-destructive/10"
                                  onClick={async () => {
                                    try {
                                      setProcessing(true)
                                      await tournamentsStore.updateGroup(tournament!.id, selectedGroup!.id, {
                                        ...selectedGroup!,
                                        verifierId: null,
                                      })
                                      const refreshed = await tournamentsStore.getTournament(tournament!.id)
                                      setTournament(refreshed)
                                      setIsVerifier(false)
                                      toast.success('Verifier role removed')
                                    } catch {
                                      toast.error('Failed to remove verifier role')
                                    } finally {
                                      setProcessing(false)
                                    }
                                  }}
                                  disabled={processing}
                                  size="lg"
                                >
                                  Remove Verifier Role
                                </Button>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {getGroupVerifier(selectedPlayer.groupId)} is currently the verifier
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons */}
            {selectedPlayer && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetSelection}
                  className="flex-1"
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={startScoring}
                  disabled={!canContinue}
                  className="flex-1"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Take Over Scorer Dialog */}
      <Dialog open={willTakeOverScoring} onOpenChange={setWillTakeOverScoring}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Over Scoring</DialogTitle>
            <DialogDescription>
              You are about to take over scoring duties from {selectedPlayer && getGroupScorer(selectedPlayer.groupId)}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remove-scorer"
                checked={removeCurrentScorer}
                onCheckedChange={(checked) => setRemoveCurrentScorer(checked as boolean)}
              />
              <Label htmlFor="remove-scorer">Remove current scorer from group</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWillTakeOverScoring(false)
                setRemoveCurrentScorer(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmTakeOver} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

