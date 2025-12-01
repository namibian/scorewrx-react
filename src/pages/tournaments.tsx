import { useEffect, useState } from 'react'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { Tournament } from '@/types'
import { TournamentCard } from '@/components/tournaments/tournament-card'
import { CreateTournamentDialog } from '@/components/tournaments/create-tournament-dialog'
import { Button } from '@/components/ui/button'
import { Trophy, Plus, Loader2, History, Trash2 } from 'lucide-react'

export default function TournamentsPage() {
  const { 
    tournaments, 
    loading, 
    error,
    fetchTournaments,
    deleteTournament,
    finalizeTournament
  } = useTournamentsStore()
  
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchTournaments()
  }, [fetchTournaments])

  // Split tournaments into upcoming and past
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingTournaments = tournaments.filter((t) => {
    const tournamentDate = typeof t.date === 'string' ? new Date(t.date) : t.date
    tournamentDate.setHours(0, 0, 0, 0)
    return tournamentDate >= today || t.state === 'Active'
  })

  const pastTournaments = tournaments.filter((t) => {
    const tournamentDate = typeof t.date === 'string' ? new Date(t.date) : t.date
    tournamentDate.setHours(0, 0, 0, 0)
    return tournamentDate < today && t.state === 'Archived'
  })

  const handleEdit = (tournament: Tournament) => {
    console.log('Edit tournament:', tournament)
    // TODO: Open edit dialog
  }

  const handleManageGroups = (tournament: Tournament) => {
    console.log('Manage groups for tournament:', tournament)
    // TODO: Open group manager
  }

  const handleShowCode = (tournament: Tournament) => {
    console.log('Show code for tournament:', tournament)
    // TODO: Show tournament code dialog
  }

  const handleExport = (tournament: Tournament) => {
    console.log('Export tournament:', tournament)
    // TODO: Export tournament data
  }

  const handleFinalize = async (tournament: Tournament) => {
    if (window.confirm(`Are you sure you want to finalize "${tournament.name}"? This will archive the tournament.`)) {
      try {
        await finalizeTournament(tournament.id)
      } catch (err) {
        console.error('Failed to finalize tournament:', err)
        alert('Failed to finalize tournament')
      }
    }
  }

  const handleDelete = async (tournament: Tournament) => {
    if (window.confirm(`Are you sure you want to delete "${tournament.name}"? This action cannot be undone.`)) {
      try {
        await deleteTournament(tournament.id)
      } catch (err) {
        console.error('Failed to delete tournament:', err)
        alert('Failed to delete tournament')
      }
    }
  }

  const handleDeleteAll = async () => {
    if (window.confirm(`Are you sure you want to delete ALL ${pastTournaments.length} past tournaments? This action cannot be undone.`)) {
      try {
        await Promise.all(pastTournaments.map(t => deleteTournament(t.id)))
      } catch (err) {
        console.error('Failed to delete tournaments:', err)
        alert('Failed to delete some tournaments')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading tournaments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Trophy className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Error loading tournaments</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={() => fetchTournaments()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const hasTournaments = tournaments.length > 0

  // Empty state
  if (!hasTournaments) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Tournaments Yet</h2>
          <p className="text-slate-600 mb-6">Create your first tournament to get started</p>
          <Button 
            size="lg"
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Tournament
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <CreateTournamentDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Tournaments</h1>
              <p className="text-slate-600 mt-1">Manage your golf tournaments</p>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Tournament
            </Button>
          </div>
        </div>

        {/* Upcoming Tournaments */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Upcoming Tournaments</h2>
          {upcomingTournaments.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-slate-500 flex items-center justify-center space-x-2">
              <Trophy className="w-6 h-6" />
              <span>No upcoming tournaments scheduled</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onEdit={handleEdit}
                  onManageGroups={handleManageGroups}
                  onShowCode={handleShowCode}
                  onExport={handleExport}
                  onFinalize={handleFinalize}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Past Tournaments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Past Tournaments</h2>
            {pastTournaments.length > 0 && (
              <Button 
                variant="ghost"
                onClick={handleDeleteAll}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </Button>
            )}
          </div>
          
          {pastTournaments.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-slate-500 flex items-center justify-center space-x-2">
              <History className="w-6 h-6" />
              <span>No past tournaments</span>
            </div>
          ) : (
            <div className="bg-white rounded-lg divide-y">
              {pastTournaments.map((tournament) => (
                <div key={tournament.id} className="p-4">
                  <TournamentCard
                    tournament={tournament}
                    onEdit={handleEdit}
                    onManageGroups={handleManageGroups}
                    onShowCode={handleShowCode}
                    onExport={handleExport}
                    onFinalize={handleFinalize}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
      </div>
      </div>
    </>
  )
}

