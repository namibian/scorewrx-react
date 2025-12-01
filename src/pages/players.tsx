import { useEffect, useState, useRef, useMemo } from 'react'
import { usePlayersStore } from '@/stores/players-store'
import { Player } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Loader2, 
  Edit, 
  Trash2, 
  Mail,
  UserPlus,
  FileDown,
  Upload,
  MoreVertical,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { PlayerDialog } from '@/components/players/player-dialog'
import { toast } from 'sonner'
import Papa from 'papaparse'

export default function PlayersPage() {
  const { players, loading, error, fetchPlayers, deletePlayer, createPlayer, updatePlayer } = usePlayersStore()
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; player: Player | null }>({ 
    open: false, 
    player: null 
  })
  const [deleteMultipleConfirm, setDeleteMultipleConfirm] = useState(false)
  const [playerDialog, setPlayerDialog] = useState<{ open: boolean; player: Player | null }>({
    open: false,
    player: null
  })
  const [importing, setImporting] = useState(false)
  const csvFileInputRef = useRef<HTMLInputElement>(null)
  const handicapFileInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Player | 'name'
    direction: 'asc' | 'desc'
  } | null>(null)

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  // Sorting and filtering logic
  const filteredAndSortedPlayers = useMemo(() => {
    // First, filter players based on search query
    let filtered = players.filter((player) => {
      const searchLower = searchQuery.toLowerCase()
      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase()
      const email = (player.email || '').toLowerCase()
      const affiliation = (player.affiliation || '').toLowerCase()
      
      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        affiliation.includes(searchLower) ||
        player.handicapIndex.toString().includes(searchLower)
      )
    })

    // Then, sort if sortConfig is set
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any
        let bValue: any

        if (sortConfig.key === 'name') {
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase()
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase()
        } else {
          aValue = a[sortConfig.key]
          bValue = b[sortConfig.key]
        }

        // Handle null/undefined values
        if (aValue == null) aValue = ''
        if (bValue == null) bValue = ''

        // Convert to lowercase for string comparison
        if (typeof aValue === 'string') aValue = aValue.toLowerCase()
        if (typeof bValue === 'string') bValue = bValue.toLowerCase()

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [players, searchQuery, sortConfig])

  const handleSort = (key: keyof Player | 'name') => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' }
      }
      return null // Remove sorting
    })
  }

  const getSortIcon = (key: keyof Player | 'name') => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="w-4 h-4 ml-1" />
    }
    return <ArrowDown className="w-4 h-4 ml-1" />
  }

  const handleEdit = (player: Player) => {
    setPlayerDialog({ open: true, player })
  }

  const handleCreate = () => {
    setPlayerDialog({ open: true, player: null })
  }

  const handleSavePlayer = async (playerData: Partial<Player>) => {
    try {
      if (playerDialog.player) {
        // Edit existing player
        await updatePlayer(playerDialog.player.id, playerData)
        toast.success('Player updated successfully')
      } else {
        // Create new player
        await createPlayer(playerData)
        toast.success('Player created successfully')
      }
      setPlayerDialog({ open: false, player: null })
    } catch (err) {
      console.error('Failed to save player:', err)
      toast.error('Failed to save player')
      throw err
    }
  }

  const handleDelete = async (player: Player) => {
    setDeleteConfirm({ open: true, player })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.player) return
    
    try {
      await deletePlayer(deleteConfirm.player.id)
      toast.success('Player deleted successfully')
    } catch (err) {
      console.error('Failed to delete player:', err)
      toast.error('Failed to delete player')
    }
  }

  const handleDeleteMultiple = async () => {
    setDeleteMultipleConfirm(true)
  }

  const confirmDeleteMultiple = async () => {
    try {
      await Promise.all(selectedPlayers.map(id => deletePlayer(id)))
      setSelectedPlayers([])
      toast.success('Players deleted successfully')
    } catch (err) {
      console.error('Failed to delete players:', err)
      toast.error('Failed to delete some players')
    }
  }

  const handleExport = () => {
    try {
      if (!players.length) {
        toast.warning('No players to export')
        return
      }

      // Create CSV content
      const csvRows: string[][] = []

      // Header row
      csvRows.push(['firstName', 'lastName', 'shortName', 'email', 'affiliation', 'handicapIndex'])

      // Data rows
      players.forEach((player) => {
        const shortName = `${player.firstName} ${player.lastName.charAt(0)}`
        csvRows.push([
          player.firstName,
          player.lastName,
          shortName,
          player.email || '',
          player.affiliation || '',
          String(player.handicapIndex || ''),
        ])
      })

      // Convert to CSV string with proper escaping for fields that might contain commas
      const csvContent = csvRows
        .map((row) =>
          row
            .map((field) => {
              // If field contains comma, quote, or newline, wrap in quotes and escape existing quotes
              if (/[",\n]/.test(field)) {
                return `"${field.replace(/"/g, '""')}"`
              }
              return field
            })
            .join(',')
        )
        .join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      // Get current date for filename
      const date = new Date().toISOString().split('T')[0]

      link.setAttribute('href', url)
      link.setAttribute('download', `players_${date}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Players exported successfully')
    } catch (error) {
      console.error('Error exporting players:', error)
      toast.error('Failed to export players. Please try again.')
    }
  }

  const handleImport = () => {
    csvFileInputRef.current?.click()
  }

  const downloadPlayerTemplate = () => {
    const template = [
      ['firstName', 'lastName', 'shortName', 'email', 'affiliation', 'handicapIndex'],
      ['John', 'Doe', 'John D', 'john@example.com', 'Country Club', '12.4'],
      ['Jane', 'Smith', 'Jane S', 'jane@example.com', 'Golf Club', '8.2'],
    ]

    const csv = Papa.unparse(template)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'players_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Player import template downloaded')
  }

  const downloadHandicapTemplate = () => {
    // Get current players to populate template with existing short names
    const playerShortNames = players.slice(0, 3).map(p => p.shortName)
    
    const template = [
      ['Name', 'Hdcp'],
      // If we have players, use their shortNames, otherwise use examples
      ...(playerShortNames.length > 0
        ? playerShortNames.map((name, idx) => [name, String(10 + idx * 2)])
        : [
            ['John D', '12.4'],
            ['Jane S', '8.2'],
            ['Bob M', '15.6'],
          ])
    ]

    const csv = Papa.unparse(template)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'handicaps_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Handicap import template downloaded')
  }

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string
        const results = Papa.parse(csv, { header: true })

        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file. Please check the format.')
          return
        }

        const playerData = results.data as any[]
        const validPlayers = playerData
          .filter((row) => row.firstName && row.lastName && row.shortName)
          .map((row) => ({
            firstName: row.firstName,
            lastName: row.lastName,
            shortName: row.shortName,
            email: row.email || null,
            affiliation: row.affiliation || null,
            handicapIndex: row.handicapIndex ? parseFloat(row.handicapIndex) : null,
          }))

        // Validate required fields
        if (validPlayers.length === 0) {
          toast.error('No valid players found in CSV. Check that firstName, lastName, and shortName are present.')
          return
        }

        if (validPlayers.length < playerData.length) {
          toast.warning(`Some rows were skipped due to missing required fields. Processing ${validPlayers.length} players.`)
        }

        // Create players
        let successCount = 0
        let errorCount = 0

        for (const player of validPlayers) {
          try {
            await createPlayer(player)
            successCount++
          } catch (error) {
            console.error('Error creating player:', error)
            errorCount++
          }
        }

        // Show results
        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} player${successCount > 1 ? 's' : ''}`)
        }
        if (errorCount > 0) {
          toast.error(`Failed to import ${errorCount} player${errorCount > 1 ? 's' : ''}`)
        }
      } catch (error) {
        console.error('Error processing CSV:', error)
        toast.error('Error processing CSV file')
      } finally {
        setImporting(false)
        // Reset file input
        if (event.target) {
          event.target.value = ''
        }
      }
    }

    reader.readAsText(file)
  }

  const handleImportHandicaps = () => {
    handicapFileInputRef.current?.click()
  }

  const handleHandicapUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string

        // Split by any combination of \r\n, \r, or \n
        const rows = text.split(/\r\n|\r|\n/).filter((row) => row.trim())

        const headers = rows[0].split(',').map((h) => h.trim())

        // Validate headers
        if (!headers.includes('Name') || !headers.includes('Hdcp')) {
          toast.error('Invalid CSV format. File must have "Name" and "Hdcp" columns.')
          setImporting(false)
          return
        }

        const nameIndex = headers.indexOf('Name')
        const hdcpIndex = headers.indexOf('Hdcp')

        // Fetch latest players to ensure we have current data
        await fetchPlayers()

        const updates: Array<{ id: string; handicapIndex: number }> = []

        // Process each row (skip header)
        for (let i = 1; i < rows.length; i++) {
          const columns = rows[i].split(',').map((col) => col.trim())

          if (columns.length < Math.max(nameIndex + 1, hdcpIndex + 1)) {
            continue
          }

          const shortName = columns[nameIndex]
          const handicap = parseFloat(columns[hdcpIndex])

          if (!shortName || isNaN(handicap)) {
            continue
          }

          // Find player by shortName
          const player = players.find((p) => p.shortName === shortName)
          if (player) {
            updates.push({
              id: player.id,
              handicapIndex: handicap,
            })
          }
        }

        if (updates.length === 0) {
          toast.warning('No valid players found to update. Please check that the player names match exactly with their short names in the system.')
          setImporting(false)
          return
        }

        // Update players
        try {
          // Process updates sequentially to avoid race conditions
          for (const update of updates) {
            await updatePlayer(update.id, {
              handicapIndex: update.handicapIndex,
            })
          }
          toast.success(`Successfully updated ${updates.length} player handicap${updates.length > 1 ? 's' : ''}`)
        } catch (error) {
          console.error('Error updating handicaps:', error)
          toast.error('Error updating handicaps')
        } finally {
          setImporting(false)
        }
      }

      reader.readAsText(file)
    } catch (error) {
      console.error('Error importing handicaps:', error)
      toast.error('Error importing handicaps')
      setImporting(false)
    } finally {
      // Reset file input
      if (event.target) {
        event.target.value = ''
      }
    }
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
      <>
        {/* Hidden File Inputs */}
        <input
          ref={csvFileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleCsvUpload}
        />
        <input
          ref={handicapFileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleHandicapUpload}
        />

        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Players Yet</h2>
            <p className="text-slate-600 mb-6">Get started by adding players manually or importing from CSV</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button 
                size="lg"
                onClick={handleCreate}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Add Player
              </Button>
              <Button 
                size="lg"
                variant="secondary"
                onClick={handleImport}
                disabled={importing}
              >
                <Upload className="w-5 h-5 mr-2" />
                {importing ? 'Importing...' : 'Import Players'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" variant="outline">
                    <FileDown className="w-5 h-5 mr-2" />
                    Templates
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuLabel>Download Templates</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={downloadPlayerTemplate}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Player Import Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadHandicapTemplate}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Handicap Import Template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Hidden File Inputs */}
      <input
        ref={csvFileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleCsvUpload}
      />
      <input
        ref={handicapFileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleHandicapUpload}
      />

      {/* Player Create/Edit Dialog */}
      <PlayerDialog
        open={playerDialog.open}
        onOpenChange={(open) => setPlayerDialog({ open, player: null })}
        player={playerDialog.player}
        onSave={handleSavePlayer}
      />

      {/* Delete Player Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, player: null })}
        title="Delete Player"
        description={`Are you sure you want to delete "${deleteConfirm.player?.firstName} ${deleteConfirm.player?.lastName}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Delete Multiple Players Confirmation */}
      <ConfirmDialog
        open={deleteMultipleConfirm}
        onOpenChange={setDeleteMultipleConfirm}
        title="Delete Multiple Players"
        description={`Are you sure you want to delete ${selectedPlayers.length} player${selectedPlayers.length > 1 ? 's' : ''}? This action cannot be undone.`}
        onConfirm={confirmDeleteMultiple}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      <div className="space-y-6 w-full">
        {/* Page Header */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Players</h1>
              <p className="text-slate-600 mt-1">Manage your player database</p>
            </div>
            <div className="flex gap-2 items-center">
              <Button 
                onClick={handleCreate}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" disabled={importing}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Player Management</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleExport} disabled={importing}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export Players
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleImport} disabled={importing}>
                    <Upload className="w-4 h-4 mr-2" />
                    {importing ? 'Importing...' : 'Import Players'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <FileDown className="w-4 h-4 mr-2" />
                      Download Templates
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={downloadPlayerTemplate}>
                        <FileDown className="w-4 h-4 mr-2" />
                        Player Import Template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={downloadHandicapTemplate}>
                        <FileDown className="w-4 h-4 mr-2" />
                        Handicap Import Template
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleImportHandicaps} disabled={importing}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Handicaps
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>All Players ({filteredAndSortedPlayers.length})</CardTitle>
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search players by name, email, or affiliation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.length === filteredAndSortedPlayers.length && filteredAndSortedPlayers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlayers(filteredAndSortedPlayers.map(p => p.id))
                        } else {
                          setSelectedPlayers([])
                        }
                      }}
                      className="rounded border-slate-300"
                    />
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center hover:text-slate-900 font-semibold text-left"
                    >
                      Name
                      {getSortIcon('name')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('email')}
                      className="flex items-center hover:text-slate-900 font-semibold"
                    >
                      Email
                      {getSortIcon('email')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('handicapIndex')}
                      className="flex items-center hover:text-slate-900 font-semibold"
                    >
                      Handicap
                      {getSortIcon('handicapIndex')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('affiliation')}
                      className="flex items-center hover:text-slate-900 font-semibold"
                    >
                      Affiliation
                      {getSortIcon('affiliation')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedPlayers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      {searchQuery ? 'No players found matching your search.' : 'No players available.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedPlayers.map((player) => (
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
                ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

