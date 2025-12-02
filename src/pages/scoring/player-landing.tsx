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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, debugParam])

  // Build list of tournament players with group info
  const tournamentPlayers: TournamentPlayer[] = tournament?.groups?.flatMap((group) =>
    (group.players || []).map((player) => ({
      ...player,
      groupId: group.id,
      groupNumber: group.number || 1,
    }))
  ).sort((a, b) => `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`)) || []

  // Group players by group number for the dropdown
  const playersByGroup = tournament?.groups
    ?.slice()
    .sort((a, b) => (a.number || 1) - (b.number || 1))
    .map((group) => ({
      groupNumber: group.number || 1,
      groupId: group.id,
      players: (group.players || [])
        .map((player) => ({
          ...player,
          groupId: group.id,
          groupNumber: group.number || 1,
        }))
        .sort((a, b) => `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`)),
    })) || []

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

      await tournamentsStore.updateGroup(tournament.id, updatedGroup)

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
        await tournamentsStore.updateGroup(tournament.id, {
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
        await tournamentsStore.updateGroup(tournament.id, {
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

      await tournamentsStore.updateGroup(tournament.id, updatedGroup)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlayer?.id, selectedPlayer?.groupId, isSelectedPlayerScorer, isScorer])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Clean Header */}
        <header className="bg-emerald-700 text-white px-4 py-5">
          <h1 className="text-center text-lg font-medium tracking-wide">Game Setup</h1>
        </header>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-600" />
            <p className="text-base text-neutral-600">Loading tournament...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Clean Header - High contrast for outdoor visibility */}
      <header className="bg-emerald-700 text-white px-4 py-5 sticky top-0 z-10">
        <h1 className="text-center text-lg font-medium tracking-wide">
          {selectedPlayer ? `Group ${selectedGroup?.number || ''}` : 'Game Setup'}
        </h1>
      </header>

      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-white/95 flex items-center justify-center z-50">
          <div className="text-center px-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-600" />
            <p className="text-lg font-medium text-neutral-900">Setting up your game...</p>
            <p className="text-sm text-neutral-500 mt-1">Please wait</p>
          </div>
        </div>
      )}

      {/* Main Content - Clean, spacious layout */}
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {/* Tournament Info - Simple, readable */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">{tournament?.name}</h2>
          <p className="text-base text-neutral-600 mt-1">{formatTournamentDate(tournament?.date)}</p>
          <p className="text-sm text-neutral-500 mt-0.5">{tournament?.courseName}</p>
        </div>

        {/* Player Selection - Clean card */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          {/* Section Header */}
          <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Player Selection
            </h3>
          </div>
          
          <div className="p-5 space-y-5">
            {/* Player Dropdown - Grouped by group number */}
            <div>
              <Label htmlFor="player-select" className="text-sm font-medium text-neutral-700 mb-2 block">
                Select Your Name
              </Label>
              <Select
                value={selectedPlayer?.id || ''}
                onValueChange={handlePlayerSelect}
                disabled={processing}
              >
                <SelectTrigger 
                  id="player-select" 
                  className="w-full h-12 text-base bg-white border-neutral-300 focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <SelectValue placeholder="Tap to select your name" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {playersByGroup.map((group) => (
                    <SelectGroup key={group.groupId}>
                      <SelectLabel className="bg-neutral-100 text-neutral-700 font-semibold text-xs uppercase tracking-wide py-2 px-3 -mx-1 mt-1 first:mt-0">
                        Group {group.groupNumber}
                      </SelectLabel>
                      {group.players.map((player) => (
                        <SelectItem 
                          key={player.id} 
                          value={player.id} 
                          className="py-3 pl-6 text-base"
                        >
                          {player.lastName}, {player.firstName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Player Details */}
            {selectedPlayer && (
              <>
                <div className="h-px bg-neutral-200" />

                {/* If scorer: Show editable group */}
                {(isSelectedPlayerScorer || isScorer) ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                      Your Group
                    </h4>
                    
                    {/* Editable Players List - Fixed grid layout */}
                    <div className="space-y-2">
                      {editableGroupPlayers.map((player) => {
                        // Create short name: "Chris O" format (firstName + lastInitial)
                        const shortName = `${player.firstName} ${player.lastName.charAt(0)}`
                        const isCurrentPlayer = player.id === selectedPlayer.id
                        
                        return (
                          <div 
                            key={player.id} 
                            className="grid grid-cols-[1fr_64px_40px] gap-2 items-center p-3 bg-neutral-50 rounded-lg"
                          >
                            <p className="font-medium text-neutral-900 truncate">
                              {shortName}
                            </p>
                            <Input
                              type="number"
                              value={player.tournamentHandicap || 0}
                              onChange={(e) => handleHandicapChange(player.id, Number(e.target.value))}
                              min={0}
                              max={36}
                              className="text-center h-10 text-base font-medium bg-white border-neutral-300"
                            />
                            {isCurrentPlayer ? (
                              <div className="w-10" /> 
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => removePlayerFromGroup(player.id)}
                              >
                                <Minus className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Add Player */}
                    {!hasMaxPlayersInGroup ? (
                      <Select onValueChange={(id) => {
                        const player = availablePlayersForGroup().find((p) => p.id === id)
                        if (player) addPlayerToGroup(player)
                      }}>
                        <SelectTrigger className="w-full h-12 text-base bg-white border-dashed border-neutral-300 text-neutral-500">
                          <SelectValue placeholder="+ Add player to group" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePlayersForGroup().map((player) => (
                            <SelectItem key={player.id} value={player.id} className="py-3 text-base">
                              {player.lastName}, {player.firstName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-neutral-500 text-center py-2">
                        Maximum 4 players per group
                      </p>
                    )}

                    {/* Save Group Changes */}
                    {groupHasChanges() && (
                      <Button
                        onClick={saveGroupChanges}
                        disabled={savingGroup}
                        className="w-full h-12 text-base font-medium bg-emerald-600 hover:bg-emerald-700"
                      >
                        {savingGroup ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  /* If NOT scorer: Show role selection only */
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-3">
                      Your Role
                    </h4>
                    
                    {!hasGroupScorer(selectedPlayer.groupId) ? (
                      <label className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200 cursor-pointer">
                        <Checkbox
                          id="scorer-checkbox"
                          checked={isScorer}
                          onCheckedChange={(checked) => setIsScorer(checked as boolean)}
                          disabled={processing}
                          className="mt-0.5 h-5 w-5 border-emerald-400 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <div>
                          <span className="text-base font-medium text-neutral-900 block">
                            I'll be the scorer
                          </span>
                          <span className="text-sm text-neutral-600 mt-0.5 block">
                            Enter scores for your group
                          </span>
                        </div>
                      </label>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-base text-amber-800 font-medium">
                            {getGroupScorer(selectedPlayer.groupId)} is scoring
                          </p>
                        </div>
                        <Button
                          onClick={() => setWillTakeOverScoring(true)}
                          disabled={processing}
                          variant="outline"
                          className="w-full h-12 text-base font-medium border-neutral-300 hover:bg-neutral-50"
                        >
                          Take Over Scoring
                        </Button>

                        {/* Verifier Option */}
                        <div className="h-px bg-neutral-200" />
                        
                        {!hasGroupVerifier(selectedPlayer.groupId) ? (
                          <label className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer">
                            <Checkbox
                              id="verifier-checkbox"
                              checked={isVerifier}
                              onCheckedChange={(checked) => setIsVerifier(checked as boolean)}
                              disabled={processing || selectedPlayer.id === selectedGroup?.scorerId}
                              className="mt-0.5 h-5 w-5 border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <div>
                              <span className="text-base font-medium text-neutral-900 block">
                                I'll verify scores
                              </span>
                              <span className="text-sm text-neutral-600 mt-0.5 block">
                                Double-check score entries
                              </span>
                            </div>
                          </label>
                        ) : isSelectedPlayerVerifier ? (
                          <div className="space-y-3">
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                              <p className="text-base text-emerald-800 font-medium">
                                You're the verifier ✓
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              className="w-full h-12 text-base text-red-600 border-red-200 hover:bg-red-50"
                              onClick={async () => {
                                try {
                                  setProcessing(true)
                                  await tournamentsStore.updateGroup(tournament!.id, {
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
                            >
                              Remove Verifier Role
                            </Button>
                          </div>
                        ) : (
                          <div className="p-4 bg-neutral-50 rounded-lg">
                            <p className="text-sm text-neutral-600">
                              {getGroupVerifier(selectedPlayer.groupId)} is verifying
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons - Large, clear */}
          {selectedPlayer && (
            <div className="px-5 pb-5 pt-2 flex gap-3">
              <Button
                variant="outline"
                onClick={resetSelection}
                className="flex-1 h-14 text-base font-medium border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </Button>
              <Button
                onClick={startScoring}
                disabled={!canContinue}
                className="flex-1 h-14 text-base font-medium bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Take Over Scorer Dialog - Clean, focused */}
      <Dialog open={willTakeOverScoring} onOpenChange={setWillTakeOverScoring}>
        <DialogContent className="bg-white max-w-sm mx-4 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-neutral-900">
              Take Over Scoring
            </DialogTitle>
            <DialogDescription className="text-base text-neutral-600 mt-2">
              You'll take over from {selectedPlayer && getGroupScorer(selectedPlayer.groupId)}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg cursor-pointer">
              <Checkbox
                id="remove-scorer"
                checked={removeCurrentScorer}
                onCheckedChange={(checked) => setRemoveCurrentScorer(checked as boolean)}
                className="h-5 w-5 border-neutral-400"
              />
              <span className="text-base text-neutral-700">
                Remove them from group
              </span>
            </label>
          </div>

          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setWillTakeOverScoring(false)
                setRemoveCurrentScorer(false)
              }}
              className="flex-1 h-12 text-base border-neutral-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmTakeOver} 
              disabled={processing}
              className="flex-1 h-12 text-base bg-emerald-600 hover:bg-emerald-700"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
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

