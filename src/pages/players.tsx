import { useEffect, useState } from 'react'
import { usePlayersStore } from '@/stores/players-store'
import { Player } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Loader2, 
  Edit, 
  Trash2, 
  Mail,
  UserPlus,
  FileDown,
  Upload
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function PlayersPage() {
  const { players, loading, error, fetchPlayers, deletePlayer } = usePlayersStore()
  // const [showCreateDialog, setShowCreateDialog] = useState(false) // TODO: Implement create dialog
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  const handleEdit = (player: Player) => {
    console.log('Edit player:', player)
    // TODO: Open edit dialog
  }

  const handleDelete = async (player: Player) => {
    if (window.confirm(`Are you sure you want to delete "${player.firstName} ${player.lastName}"? This action cannot be undone.`)) {
      try {
        await deletePlayer(player.id)
      } catch (err) {
        console.error('Failed to delete player:', err)
        alert('Failed to delete player')
      }
    }
  }

  const handleDeleteMultiple = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedPlayers.length} players? This action cannot be undone.`)) {
      try {
        await Promise.all(selectedPlayers.map(id => deletePlayer(id)))
        setSelectedPlayers([])
      } catch (err) {
        console.error('Failed to delete players:', err)
        alert('Failed to delete some players')
      }
    }
  }

  const handleExport = () => {
    console.log('Export players')
    // TODO: Export players to CSV
  }

  const handleImport = () => {
    console.log('Import players from CSV')
    // TODO: Import players from CSV
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading players...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Error loading players</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={() => fetchPlayers()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const hasPlayers = players.length > 0

  // Empty state
  if (!hasPlayers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Players Yet</h2>
          <p className="text-slate-600 mb-6">Get started by adding players manually or importing from CSV</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              size="lg"
              onClick={() => alert('Create player dialog coming soon')}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add Player
            </Button>
            <Button 
              size="lg"
              variant="secondary"
              onClick={handleImport}
            >
              <Upload className="w-5 h-5 mr-2" />
              Import CSV
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
        {/* Page Header */}
      <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Players</h1>
              <p className="text-slate-600 mt-1">Manage your player database</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleExport}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline"
                onClick={handleImport}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button 
                onClick={() => alert('Create player dialog coming soon')}
                className="bg-gradient-to-r from-blue-600 to-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </div>
          </div>
          {selectedPlayers.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedPlayers.length} player{selectedPlayers.length > 1 ? 's' : ''} selected
              </span>
              <Button 
                size="sm"
                variant="destructive"
                onClick={handleDeleteMultiple}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        {/* Players Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Players ({players.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.length === players.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlayers(players.map(p => p.id))
                        } else {
                          setSelectedPlayers([])
                        }
                      }}
                      className="rounded border-slate-300"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Handicap</TableHead>
                  <TableHead>Affiliation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedPlayers.includes(player.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlayers([...selectedPlayers, player.id])
                          } else {
                            setSelectedPlayers(selectedPlayers.filter(id => id !== player.id))
                          }
                        }}
                        className="rounded border-slate-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {player.firstName} {player.lastName}
                    </TableCell>
                    <TableCell>
                      {player.email ? (
                        <div className="flex items-center space-x-1 text-sm text-slate-600">
                          <Mail className="w-3 h-3" />
                          <span>{player.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>{player.handicapIndex.toFixed(1)}</TableCell>
                    <TableCell className="text-sm text-slate-600">{player.affiliation}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(player)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(player)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  )
}

