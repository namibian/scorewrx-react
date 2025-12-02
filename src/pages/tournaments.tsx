import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { useCoursesStore } from '@/stores/courses-store'
import { useAuthStore } from '@/stores/auth-store'
import { Tournament } from '@/types'
import { TournamentCard } from '@/components/tournaments/tournament-card'
import { CreateTournamentDialog } from '@/components/tournaments/create-tournament-dialog'
import { GroupManagerDialog } from '@/components/tournaments/group-manager-dialog'
import { RegistrationDashboard } from '@/components/tournaments/registration-dashboard'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Trophy, Plus, Loader2, History, Trash2 } from 'lucide-react'
import { exportTournamentToCSV, canExportTournament } from '@/lib/export-utils'
import { toast } from 'sonner'

export default function TournamentsPage() {
  const navigate = useNavigate()
  const { userProfile } = useAuthStore()
  const { 
    tournaments, 
    loading, 
    error,
    fetchTournaments,
    getTournament,
    deleteTournament,
    updateTournamentState,
    fetchTournamentGroups
  } = useTournamentsStore()
  
  const { courses, getCourseById, fetchCourseById, fetchCourses } = useCoursesStore()
  
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [showGroupManager, setShowGroupManager] = useState(false)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
  const [exporting, setExporting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; tournament: Tournament | null }>({ 
    open: false, 
    tournament: null 
  })
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [finalizeConfirm, setFinalizeConfirm] = useState<{ open: boolean; tournament: Tournament | null }>({
    open: false,
    tournament: null
  })
  // Track which tournaments have groups loaded (for menu item enablement)
  const [tournamentGroupsStatus, setTournamentGroupsStatus] = useState<Record<string, boolean>>({})
  // Registration dashboard state
  const [showRegistrationDashboard, setShowRegistrationDashboard] = useState(false)
  const [selectedTournamentForRegistration, setSelectedTournamentForRegistration] = useState<Tournament | null>(null)

  // Fetch data when userProfile becomes available (has affiliation)
  useEffect(() => {
    if (userProfile?.affiliation) {
      fetchTournaments()
      fetchCourses()
    }
  }, [userProfile?.affiliation, fetchTournaments, fetchCourses])

  // Fetch groups status for all tournaments to enable/disable menu items
  useEffect(() => {
    const fetchGroupsStatus = async () => {
      const statusUpdates: Record<string, boolean> = {}
      
      for (const tournament of tournaments) {
        // Skip if we already know the status (check current state, not the closure)
        if (tournament.groups !== undefined) {
          // Tournament already has groups loaded
          statusUpdates[tournament.id] = tournament.groups && tournament.groups.length > 0
          continue
        }
        
        try {
          // Fetch full tournament data with groups
          const tournamentData = await getTournament(tournament.id)
          statusUpdates[tournament.id] = tournamentData?.groups && tournamentData.groups.length > 0
        } catch (error) {
          console.error(`Error fetching groups for tournament ${tournament.id}:`, error)
          statusUpdates[tournament.id] = false
        }
      }
      
      // Batch update all status changes
      if (Object.keys(statusUpdates).length > 0) {
        setTournamentGroupsStatus(prev => ({
          ...prev,
          ...statusUpdates
        }))
      }
    }

    if (tournaments.length > 0) {
      fetchGroupsStatus()
    }
  }, [tournaments, getTournament])

  // Automatically archive past active tournaments
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    tournaments.forEach(async (tournament) => {
      if (tournament.state === 'Active') {
        const tournamentDate = typeof tournament.date === 'string' ? new Date(tournament.date) : tournament.date
        tournamentDate.setHours(0, 0, 0, 0)
        
        // If tournament date is in the past, auto-archive it
        if (tournamentDate < today) {
          try {
            await updateTournamentState(tournament.id, 'Archived')
            console.log(`Auto-archived past tournament: ${tournament.name}`)
          } catch (err) {
            console.error(`Failed to auto-archive tournament ${tournament.name}:`, err)
          }
        }
      }
    })
  }, [tournaments, updateTournamentState])

  // Split tournaments into upcoming and past
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingTournaments = tournaments.filter((t) => {
    const tournamentDate = typeof t.date === 'string' ? new Date(t.date) : t.date
    tournamentDate.setHours(0, 0, 0, 0)
    
    // Only show as upcoming if not archived and date is today or future
    // OR if state is Created/Open (pending setup)
    if (t.state === 'Archived') return false
    
    return tournamentDate >= today || t.state === 'Created' || t.state === 'Open'
  })

  const pastTournaments = tournaments.filter((t) => {
    // Past tournaments are only archived ones
    return t.state === 'Archived'
  })

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament)
    setShowCreateDialog(true)
  }

  const handleCloseDialog = () => {
    setShowCreateDialog(false)
    setEditingTournament(null)
  }

  const handleManageGroups = (tournament: Tournament) => {
    setSelectedTournamentId(tournament.id)
    setShowGroupManager(true)
  }

  const handleGroupManagerClose = async (open: boolean) => {
    setShowGroupManager(open)
    
    // Refresh groups status when group manager closes
    if (!open && selectedTournamentId) {
      try {
        const tournamentData = await getTournament(selectedTournamentId)
        setTournamentGroupsStatus(prev => ({
          ...prev,
          [selectedTournamentId]: tournamentData?.groups && tournamentData.groups.length > 0
        }))
      } catch (error) {
        console.error('Error refreshing groups status:', error)
      }
    }
  }

  const handleShowCode = (tournament: Tournament) => {
    // TODO: Implement show code dialog with QR code and copy functionality
    if (tournament.code) {
      navigator.clipboard.writeText(tournament.code)
      toast.success(`Tournament code "${tournament.code}" copied to clipboard!`)
    } else {
      toast.error('Tournament does not have a code yet')
    }
  }

  const handleScoringPage = (tournament: Tournament) => {
    // The PlayerLandingPage (scoring page) is not yet implemented in React
    // In Vue, this navigates to /tournament/:id/landing where players select themselves
    // For now, show a toast with the tournament code that players can use
    toast.info(`Scoring Page not yet implemented`, {
      description: `Players can use code "${tournament.code}" to access scoring on mobile devices.`
    })
    // TODO: Implement PlayerLandingPage and add route /tournament/:tournamentId/landing
    // navigate(`/tournament/${tournament.id}/landing`)
  }

  const handleFinalize = (tournament: Tournament) => {
    setFinalizeConfirm({ open: true, tournament })
  }

  const confirmFinalize = async () => {
    if (!finalizeConfirm.tournament) return
    
    try {
      // Archive the tournament
      await updateTournamentState(finalizeConfirm.tournament.id, 'Archived')
      toast.success(`Tournament "${finalizeConfirm.tournament.name}" has been finalized and archived!`)
    } catch (err) {
      console.error('Failed to finalize tournament:', err)
      toast.error('Failed to finalize tournament')
    }
  }

  const handleOpenRegistration = async (tournament: Tournament) => {
    try {
      await updateTournamentState(tournament.id, 'Open')
      toast.success('Tournament opened for registration')
    } catch (err) {
      console.error('Failed to open registration:', err)
      toast.error('Failed to open registration')
    }
  }

  const handleCopyLink = (tournament: Tournament) => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/registration/${tournament.code}`
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Registration link copied to clipboard!', {
        description: link
      })
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  const handleViewRegistrations = (tournament: Tournament) => {
    setSelectedTournamentForRegistration(tournament)
    setShowRegistrationDashboard(true)
  }

  const handleExport = async (tournament: Tournament) => {
    if (exporting) return
    
    try {
      setExporting(true)
      
      // Fetch the tournament with its groups to ensure we have the latest data
      const tournamentData = await getTournament(tournament.id)
      if (!tournamentData || !tournamentData.groups) {
        console.error('No tournament data or groups found')
        toast.error('No tournament data or groups found')
        return
      }

      // Get course data for hole pars and handicaps
      let course = tournamentData.course ? getCourseById(tournamentData.course) : null
      
      // If course not in local store, fetch it
      if (!course && tournamentData.course) {
        try {
          course = await fetchCourseById(tournamentData.course)
        } catch (err) {
          console.error('Error fetching course:', err)
        }
      }
      
      if (!course || !course.teeboxes || !course.teeboxes[0] || !course.teeboxes[0].holes) {
        console.error('Course data not found')
        toast.error('Course data not found. Please ensure the course is properly configured.')
        return
      }
      
      // Export to CSV
      await exportTournamentToCSV({
        tournament: tournamentData,
        groups: tournamentData.groups,
        course
      })
      
      toast.success('Tournament exported successfully')
    } catch (err) {
      console.error('Error exporting tournament:', err)
      toast.error('Failed to export tournament. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async (tournament: Tournament) => {
    setDeleteConfirm({ open: true, tournament })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.tournament) return
    
    try {
      await deleteTournament(deleteConfirm.tournament.id)
      toast.success('Tournament deleted successfully')
    } catch (err) {
      console.error('Failed to delete tournament:', err)
      toast.error('Failed to delete tournament')
    }
  }

  const handleDeleteAll = async () => {
    setDeleteAllConfirm(true)
  }

  const confirmDeleteAll = async () => {
    try {
      await Promise.all(pastTournaments.map(t => deleteTournament(t.id)))
      toast.success('All past tournaments deleted successfully')
    } catch (err) {
      console.error('Failed to delete tournaments:', err)
      toast.error('Failed to delete some tournaments')
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
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
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
      <CreateTournamentDialog 
        open={showCreateDialog} 
        onOpenChange={handleCloseDialog}
        editingTournament={editingTournament}
      />
      
      <GroupManagerDialog
        open={showGroupManager}
        onOpenChange={handleGroupManagerClose}
        tournamentId={selectedTournamentId}
      />
      
      <RegistrationDashboard
        open={showRegistrationDashboard}
        onOpenChange={setShowRegistrationDashboard}
        tournament={selectedTournamentForRegistration}
      />
      
      {/* Delete Tournament Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, tournament: null })}
        title="Delete Tournament"
        description={`Are you sure you want to delete "${deleteConfirm.tournament?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Delete All Tournaments Confirmation */}
      <ConfirmDialog
        open={deleteAllConfirm}
        onOpenChange={setDeleteAllConfirm}
        title="Delete All Past Tournaments"
        description={`Are you sure you want to delete ALL ${pastTournaments.length} past tournaments? This action cannot be undone.`}
        onConfirm={confirmDeleteAll}
        confirmText="Delete All"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Finalize Tournament Confirmation */}
      <ConfirmDialog
        open={finalizeConfirm.open}
        onOpenChange={(open) => setFinalizeConfirm({ open, tournament: null })}
        title="Finalize Tournament"
        description={`Are you sure you want to finalize "${finalizeConfirm.tournament?.name}"? This will archive the tournament and cannot be undone.`}
        onConfirm={confirmFinalize}
        confirmText="Finalize"
        cancelText="Cancel"
      />
      
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
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
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
                  onDelete={handleDelete}
                  onScoringPage={handleScoringPage}
                  onFinalize={handleFinalize}
                  onOpenRegistration={handleOpenRegistration}
                  onCopyLink={handleCopyLink}
                  onViewRegistrations={handleViewRegistrations}
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
                    onDelete={handleDelete}
                    onScoringPage={handleScoringPage}
                    onFinalize={handleFinalize}
                    onOpenRegistration={handleOpenRegistration}
                    onCopyLink={handleCopyLink}
                    onViewRegistrations={handleViewRegistrations}
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

