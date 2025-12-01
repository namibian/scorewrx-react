import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { 
  MoreVertical, 
  Download, 
  Upload, 
  UserPlus,
  Info
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePlayersStore } from '@/stores/players-store'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { PlayerSelectionDialog } from './player-selection-dialog'
import { TeeTimeIntervalInput } from './tee-time-interval-input'
import { GroupCard } from './group-card'
import { generateTemplateCSV, parseGroupsCSV, downloadCSV } from '@/lib/utils/group-import-export'
import type { Group, Player, Tournament } from '@/types'
import { toast } from 'sonner'

interface GroupManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
}

const STORAGE_KEY = 'groupManager_collapsedGroups'

// Load collapsed state from storage
const loadCollapsedState = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return new Set(JSON.parse(stored))
    }
  } catch (error) {
    console.warn('Failed to load collapsed state:', error)
  }
  return new Set()
}

// Save collapsed state to storage
const saveCollapsedState = (groupIds: Set<string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...groupIds]))
  } catch (error) {
    console.warn('Failed to save collapsed state:', error)
  }
}

export function GroupManagerDialog({ open, onOpenChange, tournamentId }: GroupManagerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { players, fetchPlayers } = usePlayersStore()
  const { 
    tournaments, 
    fetchTournamentGroups, 
    saveGroups,
    updateTournamentState
  } = useTournamentsStore()

  const [groups, setGroups] = useState<Group[]>([])
  const [groupsWithScores, setGroupsWithScores] = useState<Set<number>>(new Set())
  const [teeTimeInterval, setTeeTimeInterval] = useState(8)
  const [showPlayerSelection, setShowPlayerSelection] = useState(false)
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [importConfirm, setImportConfirm] = useState<{ open: boolean; groups: any[] }>({ 
    open: false, 
    groups: [] 
  })

  // Get tournament data
  const tournament = useMemo(() => {
    return tournaments.find(t => t.id === tournamentId)
  }, [tournaments, tournamentId])

  const isShotgunStart = useMemo(() => {
    if (!tournament) return false
    if (typeof tournament.shotgunStart === 'boolean') return tournament.shotgunStart
    return tournament.shotgunStart?.enabled || false
  }, [tournament])

  const shotgunStartTime = useMemo(() => {
    if (!tournament) return '08:00'
    if (typeof tournament.shotgunStart === 'object') {
      return tournament.shotgunStart.startTime || '08:00'
    }
    return tournament.shotgunStartTime || '08:00'
  }, [tournament])

  const defaultStartingTee = useMemo(() => {
    return tournament?.defaultStartingTee || 1
  }, [tournament])

  // Get available players (not already in groups)
  const availablePlayers = useMemo(() => {
    const assignedPlayerIds = new Set(
      groups.flatMap(group => group.players.map(p => p.id))
    )
    return players
      .filter(player => !assignedPlayerIds.has(player.id))
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
  }, [players, groups])

  // Check if group has scores
  const checkGroupScores = useCallback((group: Group): boolean => {
    if (!group?.players) return false
    return group.players.some(player =>
      Array.isArray(player.score) && player.score.some(score => score !== null)
    )
  }, [])

  // Initialize groups
  const initializeGroups = useCallback(async () => {
    if (!open || !tournamentId) return
    
    setLoading(true)
    try {
      await fetchPlayers()
      const fetchedGroups = await fetchTournamentGroups(tournamentId)
      const collapsedIds = loadCollapsedState()

      if (fetchedGroups?.length) {
        const processedGroups = fetchedGroups.map(group => ({
          ...group,
          collapsed: collapsedIds.has(group.id),
          players: group.players.map(player => ({
            ...player,
            score: Array.isArray(player.score) ? player.score : Array(18).fill(null),
            dots: Array.isArray(player.dots) ? player.dots : Array(18).fill(0),
            dnf: Array.isArray(player.dnf) ? player.dnf : Array(18).fill(false),
            greenies: Array.isArray(player.greenies) ? player.greenies : [],
            sandies: Array.isArray(player.sandies) ? player.sandies : [],
          }))
        }))

        setGroups(processedGroups)

        const scoresSet = new Set<number>()
        processedGroups.forEach((group, index) => {
          if (checkGroupScores(group)) {
            scoresSet.add(index)
          }
        })
        setGroupsWithScores(scoresSet)
      } else {
        // Create initial group
        const initialTeeTime = isShotgunStart ? shotgunStartTime : '08:00'
        const initialStartingTee = isShotgunStart ? 1 : defaultStartingTee

        setGroups([{
          id: crypto.randomUUID(),
          index: 0,
          number: 1,
          players: [],
          teeTime: initialTeeTime,
          startingTee: initialStartingTee,
          collapsed: false,
          scorerId: '',
          verificationStatus: Array(18).fill(null),
          lastUpdated: new Date(),
          gameSettings: null,
          par3ScoreLog: [],
          eventLog: []
        }])
        setGroupsWithScores(new Set())
      }
    } catch (error) {
      console.error('Error initializing groups:', error)
      toast.error('Failed to load tournament groups')
    } finally {
      setLoading(false)
    }
  }, [open, tournamentId, fetchPlayers, fetchTournamentGroups, checkGroupScores, isShotgunStart, shotgunStartTime, defaultStartingTee, toast])

  useEffect(() => {
    initializeGroups()
  }, [initializeGroups])

  // Calculate next tee time
  const calculateNextTeeTime = useCallback((currentTeeTime: string): string => {
    const [hours, minutes] = currentTeeTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + teeTimeInterval
    const newHours = Math.floor(totalMinutes / 60)
    const newMinutes = totalMinutes % 60
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
  }, [teeTimeInterval])

  // Update group tee times based on interval
  const updateGroupTeeTimes = useCallback((updatedGroups: Group[]) => {
    if (updatedGroups.length <= 1 || isShotgunStart) return updatedGroups

    return updatedGroups.map((group, index) => {
      if (index === 0) return group
      return {
        ...group,
        teeTime: calculateNextTeeTime(updatedGroups[index - 1].teeTime)
      }
    })
  }, [calculateNextTeeTime, isShotgunStart])

  // Add group
  const handleAddGroup = () => {
    const lastGroup = groups[groups.length - 1]
    const newTeeTime = isShotgunStart ? shotgunStartTime : calculateNextTeeTime(lastGroup.teeTime)
    
    let newStartingTee = defaultStartingTee
    if (isShotgunStart && lastGroup) {
      newStartingTee = (lastGroup.startingTee % 18) + 1
    }

    const newGroup: Group = {
      id: crypto.randomUUID(),
      index: groups.length,
      number: groups.length + 1,
      players: [],
      teeTime: newTeeTime,
      startingTee: newStartingTee,
      collapsed: false,
      scorerId: '',
      verificationStatus: Array(18).fill(null),
      lastUpdated: new Date(),
      gameSettings: null,
      par3ScoreLog: [],
      eventLog: []
    }

    setGroups([...groups, newGroup])
  }

  // Delete group
  const handleDeleteGroup = (groupIndex: number) => {
    const updatedGroups = groups.filter((_, index) => index !== groupIndex)
    const reindexedGroups = updateGroupTeeTimes(updatedGroups.map((g, idx) => ({
      ...g,
      index: idx,
      number: idx + 1
    })))
    setGroups(reindexedGroups)
  }

  // Toggle collapse
  const handleToggleCollapse = (groupIndex: number) => {
    const updatedGroups = [...groups]
    updatedGroups[groupIndex] = {
      ...updatedGroups[groupIndex],
      collapsed: !updatedGroups[groupIndex].collapsed
    }
    setGroups(updatedGroups)

    const collapsedIds = new Set(
      updatedGroups
        .filter(g => g.collapsed)
        .map(g => g.id)
    )
    saveCollapsedState(collapsedIds)
  }

  // Update group
  const handleUpdateGroup = (groupIndex: number, updates: Partial<Group>) => {
    const updatedGroups = [...groups]
    updatedGroups[groupIndex] = {
      ...updatedGroups[groupIndex],
      ...updates
    }
    
    // If first group's tee time changed, update all following groups
    if (groupIndex === 0 && updates.teeTime) {
      setGroups(updateGroupTeeTimes(updatedGroups))
    } else {
      setGroups(updatedGroups)
    }
  }

  // Player management
  const handleOpenPlayerSelection = (groupIndex: number) => {
    setSelectedGroupIndex(groupIndex)
    setShowPlayerSelection(true)
  }

  const handleAddPlayers = (selectedPlayers: Player[]) => {
    const updatedGroups = [...groups]
    const group = updatedGroups[selectedGroupIndex]
    
    const newPlayers = selectedPlayers.map(player => ({
      ...player,
      tournamentHandicap: player.handicapIndex || 0,
      skinsPool: player.skinsPool || 'None' as const,
      score: Array(18).fill(null),
      dots: Array(18).fill(0),
      dnf: Array(18).fill(false),
      greenies: [],
      sandies: []
    }))

    group.players = [...group.players, ...newPlayers]
    setGroups(updatedGroups)
  }

  const handleRemovePlayer = (groupIndex: number, player: Player) => {
    const updatedGroups = [...groups]
    updatedGroups[groupIndex].players = updatedGroups[groupIndex].players.filter(
      p => p.id !== player.id
    )
    setGroups(updatedGroups)
  }

  const handleUpdatePlayer = (groupIndex: number, player: Player) => {
    const updatedGroups = [...groups]
    updatedGroups[groupIndex].players = updatedGroups[groupIndex].players.map(
      p => p.id === player.id ? player : p
    )
    setGroups(updatedGroups)
  }

  const handleResetHandicap = (groupIndex: number, player: Player) => {
    handleUpdatePlayer(groupIndex, {
      ...player,
      tournamentHandicap: player.handicapIndex || 0
    })
  }

  // CSV Import/Export
  const handleDownloadTemplate = () => {
    const template = generateTemplateCSV()
    downloadCSV(template, 'tournament_groups_template.csv')
    toast.success('Template downloaded successfully')
  }

  const handleImportGroups = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      const importedGroups = parseGroupsCSV(content, players)

      // Show confirmation dialog
      setImportConfirm({ open: true, groups: importedGroups })
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error(error.message || 'Failed to import groups')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleConfirmImport = () => {
    try {
      const processedGroups: Group[] = importConfirm.groups.map((group, index) => ({
        id: crypto.randomUUID(),
        index,
        number: group.number,
        startingTee: group.startingTee,
        teeTime: group.teeTime,
        scorerId: '',
        verificationStatus: Array(18).fill(null),
        lastUpdated: new Date(),
        gameSettings: null,
        collapsed: false,
        players: group.players.map(player => ({
          ...player,
          score: Array(18).fill(null),
          dots: Array(18).fill(0),
          dnf: Array(18).fill(false),
          greenies: [],
          sandies: []
        })),
        par3ScoreLog: [],
        eventLog: []
      }))

      setGroups(processedGroups)
      toast.success('Groups imported successfully')
    } catch (error: any) {
      console.error('Import processing error:', error)
      toast.error('Failed to process imported groups')
    } finally {
      setImportConfirm({ open: false, groups: [] })
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Save groups
  const handleSave = async () => {
    setLoading(true)
    try {
      await saveGroups(tournamentId, groups)
      
      // Auto-transition tournament state if needed
      if (tournament && !tournament.useOnlineRegistration && tournament.state === 'Created' && groups.length > 0) {
        await updateTournamentState(tournamentId, 'Active')
      }
      
      toast.success('Groups saved successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving groups:', error)
      toast.error('Failed to save groups')
    } finally {
      setLoading(false)
    }
  }

  const hasAnyGroupWithScores = groupsWithScores.size > 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">Manage Groups</DialogTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleImportGroups}
                    disabled={hasAnyGroupWithScores}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import Groups
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAddGroup}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Tee Time Interval or Shotgun Info */}
            {!isShotgunStart ? (
              <TeeTimeIntervalInput
                value={teeTimeInterval}
                onChange={(value) => {
                  setTeeTimeInterval(value)
                  setGroups(updateGroupTeeTimes(groups))
                }}
                disabled={hasAnyGroupWithScores}
              />
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">Shotgun Start: {shotgunStartTime}</div>
                  <div className="text-sm">Each group will start at the same time but from different tees</div>
                </AlertDescription>
              </Alert>
            )}

            {/* Groups List */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading groups...
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No groups yet. Click "Add Group" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group, index) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    groupIndex={index}
                    canEdit={!groupsWithScores.has(index)}
                    isShotgunStart={isShotgunStart}
                    onUpdateTeeTime={(teeTime) => handleUpdateGroup(index, { teeTime })}
                    onUpdateStartingTee={(startingTee) => handleUpdateGroup(index, { startingTee })}
                    onToggleCollapse={() => handleToggleCollapse(index)}
                    onAddPlayers={() => handleOpenPlayerSelection(index)}
                    onDeleteGroup={() => handleDeleteGroup(index)}
                    onRemovePlayer={(player) => handleRemovePlayer(index, player)}
                    onUpdatePlayer={(player) => handleUpdatePlayer(index, player)}
                    onResetHandicap={(player) => handleResetHandicap(index, player)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </DialogContent>
      </Dialog>

      {/* Player Selection Dialog */}
      <PlayerSelectionDialog
        open={showPlayerSelection}
        onOpenChange={setShowPlayerSelection}
        groupIndex={selectedGroupIndex}
        availablePlayers={availablePlayers}
        onAddPlayers={handleAddPlayers}
      />

      {/* Import Confirmation Dialog */}
      <ConfirmDialog
        open={importConfirm.open}
        onOpenChange={(open) => {
          setImportConfirm({ open, groups: [] })
          // Reset file input when dialog closes without confirming
          if (!open && fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }}
        title="Import Groups"
        description={`Import ${importConfirm.groups.length} ${importConfirm.groups.length === 1 ? 'group' : 'groups'}? This will replace all existing groups.`}
        onConfirm={handleConfirmImport}
        confirmText="Import"
        cancelText="Cancel"
        variant="default"
      />
    </>
  )
}
