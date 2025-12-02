import { useState, useEffect, useMemo } from 'react'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { usePlayersStore } from '@/stores/players-store'
import type { Tournament, RegisteredPlayer, WaitingListPlayer } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  Check,
  X,
  Clock,
  Users,
  Infinity,
  Copy,
  Download,
  Lock,
  LockOpen,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { Unsubscribe } from 'firebase/firestore'

interface RegistrationDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournament: Tournament | null
}

export function RegistrationDashboard({ open, onOpenChange, tournament: initialTournament }: RegistrationDashboardProps) {
  const { subscribeToTournamentUpdates, updateTournamentState } = useTournamentsStore()
  const { getPlayer } = usePlayersStore()
  
  const [actionLoading, setActionLoading] = useState(false)
  const [liveTournament, setLiveTournament] = useState<Tournament | null>(null)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [reopenConfirmOpen, setReopenConfirmOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Use live tournament data if available, otherwise use prop
  const currentTournament = liveTournament || initialTournament

  // Subscribe to real-time updates when dialog opens
  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null

    if (open && initialTournament) {
      setLiveTournament(initialTournament)
      
      unsubscribe = subscribeToTournamentUpdates(initialTournament.id, (updatedTournament) => {
        console.log('[Registration Dashboard] Received update:', updatedTournament.registeredPlayers?.length, 'registered players')
        setLiveTournament(updatedTournament)
      })
    } else if (!open) {
      setLiveTournament(null)
    }

    return () => {
      if (unsubscribe) {
        console.log('[Registration Dashboard] Unsubscribing from tournament updates')
        unsubscribe()
      }
    }
  }, [open, initialTournament, subscribeToTournamentUpdates])

  // Computed values
  const registeredPlayers = useMemo(() => {
    if (!currentTournament?.registeredPlayers) return []
    return [...currentTournament.registeredPlayers].sort((a, b) => {
      const dateA = a.registeredAt instanceof Date ? a.registeredAt : new Date(a.registeredAt)
      const dateB = b.registeredAt instanceof Date ? b.registeredAt : new Date(b.registeredAt)
      return dateB.getTime() - dateA.getTime()
    })
  }, [currentTournament])

  const waitingListPlayers = useMemo(() => {
    if (!currentTournament?.waitingList) return []
    return [...currentTournament.waitingList].sort((a, b) => {
      const dateA = a.addedAt instanceof Date ? a.addedAt : new Date(a.addedAt)
      const dateB = b.addedAt instanceof Date ? b.addedAt : new Date(b.addedAt)
      return dateA.getTime() - dateB.getTime() // Oldest first (FIFO)
    })
  }, [currentTournament])

  const stats = useMemo(() => {
    const players = currentTournament?.registeredPlayers || []
    return {
      total: players.length,
      accepted: players.filter(p => p.status === 'accepted').length,
      declined: players.filter(p => p.status === 'declined').length
    }
  }, [currentTournament])

  const isFull = useMemo(() => {
    if (!currentTournament?.maxRegistrations) return false
    return stats.accepted >= currentTournament.maxRegistrations
  }, [currentTournament, stats])

  const registrationLink = useMemo(() => {
    if (!currentTournament?.code) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/registration/${currentTournament.code}`
  }, [currentTournament])

  const copyLink = () => {
    navigator.clipboard.writeText(registrationLink).then(() => {
      toast.success('Link copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  const formatDate = (timestamp: Date | string | any): string => {
    if (!timestamp) return ''
    let date: Date
    if (timestamp.toDate) {
      date = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      date = new Date(timestamp)
    }
    return format(date, 'MMM d, yyyy h:mm a')
  }

  const exportToCSV = async () => {
    if (registeredPlayers.length === 0) return

    const acceptedPlayers = registeredPlayers.filter(p => p.status === 'accepted')
    if (acceptedPlayers.length === 0) {
      toast.warning('No accepted players to export')
      return
    }

    setExporting(true)
    toast.info('Fetching current handicap data...')

    try {
      // Fetch current handicap data from Firebase for each player
      const playersWithHandicaps = await Promise.all(
        acceptedPlayers.map(async (player) => {
          let handicapIndex = player.handicapIndex || ''
          
          if (player.playerId) {
            try {
              const playerData = await getPlayer(player.playerId)
              handicapIndex = playerData?.handicapIndex ?? ''
            } catch (err) {
              console.warn(`Could not fetch handicap for player ${player.playerId}:`, err)
            }
          }
          
          return { ...player, handicapIndex }
        })
      )

      // Prepare CSV
      const headers = ['First Name', 'Last Name', 'Handicap', 'Email', 'Registration Date']
      
      // Sort by registration date (oldest first)
      const sortedPlayers = [...playersWithHandicaps].sort((a, b) => {
        const dateA = a.registeredAt instanceof Date ? a.registeredAt : new Date(a.registeredAt as string)
        const dateB = b.registeredAt instanceof Date ? b.registeredAt : new Date(b.registeredAt as string)
        return dateA.getTime() - dateB.getTime()
      })

      const rows = sortedPlayers.map(player => {
        const registrationDate = player.registeredAt instanceof Date 
          ? format(player.registeredAt, 'yyyy-MM-dd HH:mm:ss')
          : format(new Date(player.registeredAt as string), 'yyyy-MM-dd HH:mm:ss')
        
        return [
          player.firstName,
          player.lastName,
          player.handicapIndex?.toString() || '',
          player.email || '',
          registrationDate
        ]
      })

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `${currentTournament?.name || 'tournament'}_registrations_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`${acceptedPlayers.length} accepted player(s) exported successfully!`)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Error exporting registration data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const closeRegistrations = async () => {
    if (!currentTournament) return

    setActionLoading(true)
    try {
      await updateTournamentState(currentTournament.id, 'Active')
      toast.success('Registrations closed! Tournament is now active.')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to close registrations')
    } finally {
      setActionLoading(false)
      setCloseConfirmOpen(false)
    }
  }

  const reopenRegistrations = async () => {
    if (!currentTournament) return

    setActionLoading(true)
    try {
      await updateTournamentState(currentTournament.id, 'Open')
      toast.success('Registrations re-opened! Players can now register again.')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to re-open registrations')
    } finally {
      setActionLoading(false)
      setReopenConfirmOpen(false)
    }
  }

  if (!currentTournament) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Registration Dashboard</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.accepted}</div>
                  <div className="text-xs text-slate-500 mt-1">Accepted</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">{stats.declined}</div>
                  <div className="text-xs text-slate-500 mt-1">Declined</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-amber-600">{waitingListPlayers.length}</div>
                  <div className="text-xs text-slate-500 mt-1">Waitlisted</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-slate-600">
                    {currentTournament.maxRegistrations || <Infinity className="w-8 h-8 mx-auto" />}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Capacity</div>
                </CardContent>
              </Card>
            </div>

            {/* Full Status Warning */}
            {isFull && (
              <div className="flex items-center gap-2 p-3 bg-amber-100 text-amber-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Tournament is at full capacity!</span>
              </div>
            )}

            {/* Registration Link */}
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-slate-700 mb-2">Registration Link</div>
                <div className="flex gap-2">
                  <Input 
                    value={registrationLink} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Registered Players List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Registered Players</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportToCSV}
                  disabled={registeredPlayers.length === 0 || exporting}
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export CSV
                </Button>
              </div>

              {registeredPlayers.length > 0 ? (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {registeredPlayers.map((player) => (
                    <div key={player.playerId} className="flex items-center gap-3 p-3 border-b last:border-b-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        player.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {player.status === 'accepted' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{player.email}</div>
                      </div>
                      <Badge variant={player.status === 'accepted' ? 'default' : 'destructive'} className="capitalize">
                        {player.status}
                      </Badge>
                      <div className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(player.registeredAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 border rounded-lg">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No registrations yet</p>
                </div>
              )}
            </div>

            {/* Waiting List */}
            {waitingListPlayers.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">
                  Waiting List ({waitingListPlayers.length})
                </h3>
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {waitingListPlayers.map((player, idx) => (
                    <div key={player.playerId} className="flex items-center gap-3 p-3 border-b last:border-b-0">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{player.email}</div>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        #{idx + 1}
                      </Badge>
                      <div className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(player.addedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              {currentTournament.state === 'Open' && (
                <Button
                  variant="destructive"
                  onClick={() => setCloseConfirmOpen(true)}
                  disabled={actionLoading}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Close Registrations
                </Button>
              )}
              {currentTournament.state === 'Active' && (
                <Button
                  variant="outline"
                  onClick={() => setReopenConfirmOpen(true)}
                  disabled={actionLoading}
                >
                  <LockOpen className="w-4 h-4 mr-2" />
                  Re-open Registrations
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Registration Confirmation */}
      <ConfirmDialog
        open={closeConfirmOpen}
        onOpenChange={setCloseConfirmOpen}
        title="Close Registrations"
        description={`Are you sure you want to close registrations and start the tournament? ${stats.accepted} players have accepted.`}
        onConfirm={closeRegistrations}
        confirmText="Close Registrations"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Re-open Registration Confirmation */}
      <ConfirmDialog
        open={reopenConfirmOpen}
        onOpenChange={setReopenConfirmOpen}
        title="Re-open Registrations"
        description={`Are you sure you want to re-open registrations? Players will be able to accept or decline again. Currently ${stats.accepted} players have accepted.`}
        onConfirm={reopenRegistrations}
        confirmText="Re-open Registrations"
        cancelText="Cancel"
      />
    </>
  )
}

