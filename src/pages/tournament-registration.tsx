import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { usePlayersStore } from '@/stores/players-store'
import type { Tournament, Player, RegisteredPlayer, WaitingListPlayer } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  Trophy, 
  Calendar, 
  Loader2, 
  Check, 
  X, 
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface PlayerOption {
  id: string
  label: string
  firstName: string
  lastName: string
  email: string
  handicapIndex: number
}

export default function TournamentRegistrationPage() {
  const { code } = useParams<{ code: string }>()
  const { getTournamentByCode, registerPlayerForTournament, addPlayerToWaitingList, removePlayerFromWaitingList } = useTournamentsStore()
  const { fetchPlayersByAffiliation, getPlayer } = usePlayersStore()

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'accepted' | 'declined' | 'waiting' | null>(null)
  const [allPlayers, setAllPlayers] = useState<PlayerOption[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Computed values
  const currentRegistration = useMemo(() => {
    if (!tournament || !selectedPlayer) return null
    return tournament.registeredPlayers?.find(p => p.playerId === selectedPlayer) || null
  }, [tournament, selectedPlayer])

  const currentWaitingListEntry = useMemo(() => {
    if (!tournament || !selectedPlayer) return null
    return tournament.waitingList?.find(p => p.playerId === selectedPlayer) || null
  }, [tournament, selectedPlayer])

  const isFull = useMemo(() => {
    if (!tournament?.maxRegistrations) return false
    const acceptedCount = tournament.registeredPlayers?.filter(p => p.status === 'accepted').length || 0
    return acceptedCount >= tournament.maxRegistrations
  }, [tournament])

  const filteredPlayers = useMemo(() => {
    if (!searchQuery) return allPlayers
    const needle = searchQuery.toLowerCase()
    return allPlayers.filter(p => p.label.toLowerCase().includes(needle))
  }, [allPlayers, searchQuery])

  // Load tournament data
  const loadTournament = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!code) {
        setError('Invalid tournament code')
        return
      }

      // Validate code format (should be 6 digits)
      if (!/^\d{6}$/.test(code)) {
        setError('Invalid tournament code format. Please check the registration link.')
        return
      }

      // Load tournament by code
      const tournamentData = await getTournamentByCode(code)

      if (!tournamentData) {
        setError('Tournament not found. Please check the registration link and try again.')
        return
      }

      // Validate tournament state
      const tournamentState = tournamentData.state || 'Created'
      if (tournamentState !== 'Open') {
        if (tournamentState === 'Created') {
          setError('This tournament is not yet open for registration. Please contact the tournament organizer.')
        } else if (tournamentState === 'Active') {
          setError('Registration for this tournament has closed. The tournament is now active.')
        } else if (tournamentState === 'Archived') {
          setError('This tournament has ended. Registration is no longer available.')
        } else {
          setError('This tournament is not currently accepting registrations.')
        }
        return
      }

      setTournament(tournamentData)

      // Load players using tournament's affiliation
      try {
        const tournamentAffiliation = tournamentData.affiliation
        if (!tournamentAffiliation) {
          setError('Tournament affiliation not found. Please contact the tournament organizer.')
          return
        }

        const fetchedPlayers = await fetchPlayersByAffiliation(tournamentAffiliation)
        const playerOptions = fetchedPlayers.map(p => ({
          id: p.id,
          label: `${p.firstName} ${p.lastName}`,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email || '',
          handicapIndex: p.handicapIndex || 0
        }))
        setAllPlayers(playerOptions)

        if (playerOptions.length === 0) {
          setError('No players found for this tournament. Please contact the tournament organizer.')
        }
      } catch (playerError) {
        console.error('Error loading players:', playerError)
        setError('Unable to load player list. Please check your connection and try again.')
      }

    } catch (err: any) {
      console.error('Error loading tournament:', err)
      if (err.message?.includes('network')) {
        setError('Network error. Please check your internet connection and try again.')
      } else if (err.message?.includes('permission')) {
        setError('Access denied. Please contact the tournament organizer.')
      } else {
        setError('Unable to load tournament. Please check the registration link and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTournament()
  }, [code])

  const handleRegistration = async (status: 'accepted' | 'declined') => {
    if (!selectedPlayer || submitting || !tournament) return

    setSelectedStatus(status)
    setSubmitting(true)

    try {
      const playerInfo = allPlayers.find(p => p.id === selectedPlayer)
      if (!playerInfo) {
        throw new Error('Player not found')
      }

      const result = await registerPlayerForTournament(
        tournament.id,
        selectedPlayer,
        playerInfo,
        status
      )

      // Reload tournament to get updated data
      const updatedTournament = await getTournamentByCode(code!)
      if (updatedTournament) {
        setTournament(updatedTournament)
      }

      setRegistrationComplete(true)

      if (status === 'accepted') {
        toast.success('Registration confirmed! Thank you.')
      } else if (status === 'declined' && result.promotedPlayer) {
        toast.info(`Registration declined. ${result.promotedPlayer.firstName} ${result.promotedPlayer.lastName} has been automatically promoted from the waiting list.`)
      } else {
        toast.info('Registration declined.')
      }

    } catch (err: any) {
      console.error('Error registering:', err)
      let errorMessage = 'An error occurred during registration'
      if (err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
      } else if (err.message?.includes('permission')) {
        errorMessage = 'Access denied. Please contact the tournament organizer.'
      }
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleWaitingList = async (action: 'add' | 'remove') => {
    if (!selectedPlayer || submitting || !tournament) return

    setSelectedStatus('waiting')
    setSubmitting(true)

    try {
      const playerInfo = allPlayers.find(p => p.id === selectedPlayer)
      if (!playerInfo) {
        throw new Error('Player not found')
      }

      if (action === 'add') {
        await addPlayerToWaitingList(tournament.id, selectedPlayer, playerInfo)
        
        const updatedTournament = await getTournamentByCode(code!)
        if (updatedTournament) {
          setTournament(updatedTournament)
        }

        setRegistrationComplete(true)
        toast.success('Added to waiting list! You will be notified if a spot becomes available.')
      } else {
        await removePlayerFromWaitingList(tournament.id, selectedPlayer)
        
        const updatedTournament = await getTournamentByCode(code!)
        if (updatedTournament) {
          setTournament(updatedTournament)
        }

        setRegistrationComplete(false)
        setSelectedStatus(null)
        toast.info('Removed from waiting list.')
      }

    } catch (err: any) {
      console.error('Error managing waiting list:', err)
      toast.error('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateValue: Date | string): string => {
    if (!dateValue) return ''
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
    return format(date, 'MMMM d, yyyy')
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <header className="bg-indigo-600 text-white py-4 px-6 shadow-lg">
          <h1 className="text-xl font-bold text-center">ScoreWRX™</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700">Loading tournament...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <header className="bg-indigo-600 text-white py-4 px-6 shadow-lg">
          <h1 className="text-xl font-bold text-center">ScoreWRX™</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-800 mb-4">{error}</p>
            <Button onClick={loadTournament} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Tournament Full - Show Waiting List Option
  if (isFull && !currentRegistration && !currentWaitingListEntry) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <header className="bg-indigo-600 text-white py-4 px-6 shadow-lg">
          <h1 className="text-xl font-bold text-center">ScoreWRX™</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <Clock className="w-20 h-20 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Tournament Full</h2>
              <p className="text-slate-600">
                This tournament has reached its maximum capacity of {tournament?.maxRegistrations} players.
                You can join the waiting list below.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Select Your Name</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Search for your name..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    {filteredPlayers.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500 text-center">No players found</div>
                    ) : (
                      filteredPlayers.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => handleWaitingList('add')}
                disabled={!selectedPlayer || submitting}
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Clock className="w-5 h-5 mr-2" />
                )}
                Join Waiting List
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success State - Registration Complete
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <header className="bg-indigo-600 text-white py-4 px-6 shadow-lg">
          <h1 className="text-xl font-bold text-center">ScoreWRX™</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            {selectedStatus === 'accepted' ? (
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            ) : selectedStatus === 'waiting' ? (
              <Clock className="w-20 h-20 text-amber-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            )}
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {selectedStatus === 'accepted' 
                ? 'Registration Confirmed!' 
                : selectedStatus === 'waiting'
                ? 'Added to Waiting List!'
                : 'Registration Declined'}
            </h2>
            
            <p className="text-slate-600 mb-6">
              {selectedStatus === 'accepted'
                ? 'Thank you for registering. You will receive further details from the tournament organizer.'
                : selectedStatus === 'waiting'
                ? 'You have been added to the waiting list. You will be notified if a spot becomes available.'
                : 'You have declined this tournament registration.'}
            </p>

            {(selectedStatus === 'accepted' || selectedStatus === 'waiting') && (
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedStatus === 'waiting') {
                    handleWaitingList('remove')
                  } else {
                    setRegistrationComplete(false)
                  }
                }}
              >
                {selectedStatus === 'waiting' ? 'Remove from Waiting List' : 'Change Registration'}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Already on Waiting List
  if (currentWaitingListEntry && !currentRegistration) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <header className="bg-indigo-600 text-white py-4 px-6 shadow-lg">
          <h1 className="text-xl font-bold text-center">ScoreWRX™</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <Clock className="w-20 h-20 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">On Waiting List</h2>
            <p className="text-slate-600 mb-6">
              You are currently on the waiting list for this tournament. You will be notified if a spot becomes available.
            </p>
            <Button
              variant="outline"
              onClick={() => handleWaitingList('remove')}
              disabled={submitting}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Remove from Waiting List
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Registration Form
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <header className="bg-indigo-600 text-white py-4 px-6 shadow-lg">
        <h1 className="text-xl font-bold text-center">ScoreWRX™</h1>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          {/* Tournament Info */}
          <div className="text-center mb-6">
            <Trophy className="w-20 h-20 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{tournament?.name}</h2>
            <div className="flex items-center justify-center text-slate-600">
              <Calendar className="w-5 h-5 mr-2" />
              <span>{tournament?.date && formatDate(tournament.date)}</span>
            </div>
          </div>

          {/* Current Registration Status Banner */}
          {currentRegistration && (
            <div className={`p-4 rounded-lg mb-6 flex items-center ${
              currentRegistration.status === 'accepted' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {currentRegistration.status === 'accepted' ? (
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              )}
              <span>
                You have {currentRegistration.status === 'accepted' ? 'accepted' : 'declined'} this tournament.
                You can change your registration below.
              </span>
            </div>
          )}

          {/* Player Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Select Your Name</Label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Search for your name..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search players..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {filteredPlayers.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500 text-center">No players found</div>
                  ) : (
                    filteredPlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleRegistration('accepted')}
                disabled={!selectedPlayer || submitting}
                className="h-12 bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting && selectedStatus === 'accepted' ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Check className="w-5 h-5 mr-2" />
                )}
                Accept
              </Button>
              <Button
                onClick={() => handleRegistration('declined')}
                disabled={!selectedPlayer || submitting}
                className="h-12 bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting && selectedStatus === 'declined' ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <X className="w-5 h-5 mr-2" />
                )}
                Decline
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

