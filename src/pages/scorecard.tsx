import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { useCoursesStore } from '@/stores/courses-store'
import { Player, Course, Group, Tournament } from '@/types'
import { ScorecardHeader } from '@/components/scorecard/scorecard-header'
import { ScorecardGrid } from '@/components/scorecard/scorecard-grid'
import { ScorerEntryContent } from '@/components/scorecard/scorer-entry-content'
import { MatchPanel } from '@/components/scorecard/match-panel'
import { BetsPanel } from '@/components/scorecard/bets-panel'
import { SkinsPanel } from '@/components/scorecard/skins-panel'
import { LeaderboardTab } from '@/components/scorecard/leaderboard-tab'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ScorecardPage() {
  const { tournamentId, playerId, groupId } = useParams<{
    tournamentId: string
    playerId: string
    groupId: string
  }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const tournamentsStore = useTournamentsStore()
  const coursesStore = useCoursesStore()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('scorecard')
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [localPlayerScores, setLocalPlayerScores] = useState<Map<string, Player>>(
    new Map()
  )
  const [allPlayers, setAllPlayers] = useState<Map<string, Player>>(new Map())
  const [currentEntryHole, setCurrentEntryHole] = useState(1)

  const isEntryMode = searchParams.get('mode') === 'entry'
  const isScorer = group?.scorerId === playerId
  const isVerifier = group?.verifierId === playerId

  // Find the next unscored hole
  const findNextUnscoredHole = useCallback(() => {
    if (!group?.players) return 1

    const startingTee = group.startingTee || 1

    // Build array of holes in play order
    const holesInOrder: number[] = []
    for (let i = 0; i < 18; i++) {
      const hole = ((startingTee - 1 + i) % 18) + 1
      holesInOrder.push(hole)
    }

    // Find first hole without all scores entered
    for (const hole of holesInOrder) {
      const holeIndex = hole - 1
      const allScored = group.players.every(player => {
        const score = player.score?.[holeIndex]
        const dnf = player.dnf?.[holeIndex]
        return (score !== null && score !== undefined) || dnf
      })

      if (!allScored) {
        return hole
      }
    }

    // If all holes have scores, return to starting tee
    return startingTee
  }, [group])

  useEffect(() => {
    const loadData = async () => {
      if (!tournamentId || !groupId) return

      setLoading(true)

      try {
        const tournamentData = await tournamentsStore.getTournament(tournamentId)
        if (!tournamentData) {
          throw new Error('Tournament not found')
        }

        setTournament(tournamentData)

        const groupData = tournamentData.groups?.find((g) => g.id === groupId)
        if (!groupData) {
          throw new Error('Group not found')
        }

        setGroup(groupData)

        // Initialize local player scores
        const scoresMap = new Map<string, Player>()
        groupData.players.forEach((player) => {
          scoresMap.set(player.id, player)
        })
        setLocalPlayerScores(scoresMap)

        // Collect all players from all groups for leaderboard and skins
        const allPlayersMap = new Map<string, Player>()
        tournamentData.groups?.forEach((group) => {
          group.players.forEach((player) => {
            allPlayersMap.set(player.id, player)
          })
        })
        setAllPlayers(allPlayersMap)

        // Load course data
        if (tournamentData.courseId) {
          const courseData = await coursesStore.getCourse(tournamentData.courseId)
          setCourse(courseData)
        }
      } catch (err: any) {
        console.error('Failed to load scorecard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, groupId])

  // Set initial entry hole when entering entry mode
  useEffect(() => {
    if (isEntryMode && group) {
      const nextHole = findNextUnscoredHole()
      setCurrentEntryHole(nextHole)
    }
  }, [isEntryMode, group, findNextUnscoredHole])

  // Real-time updates from Firestore
  useEffect(() => {
    if (!tournamentId) return

    const unsubscribe = onSnapshot(
      doc(db, 'tournaments', tournamentId),
      (snapshot) => {
        if (snapshot.exists()) {
          const tournamentData = {
            id: snapshot.id,
            ...snapshot.data(),
          } as Tournament

          setTournament(tournamentData)

          // Update group data
          const groupData = tournamentData.groups?.find((g) => g.id === groupId)
          if (groupData) {
            setGroup(groupData)

            // Update local player scores
            const scoresMap = new Map<string, Player>()
            groupData.players.forEach((player) => {
              scoresMap.set(player.id, player)
            })
            setLocalPlayerScores(scoresMap)
          }

          // Update all players
          const allPlayersMap = new Map<string, Player>()
          tournamentData.groups?.forEach((group) => {
            group.players.forEach((player) => {
              allPlayersMap.set(player.id, player)
            })
          })
          setAllPlayers(allPlayersMap)
        }
      },
      (error) => {
        console.error('Error listening to tournament updates:', error)
      }
    )

    return () => unsubscribe()
  }, [tournamentId, groupId])

  const getHolePar = (hole: number): number => {
    if (!course || !course.teeboxes || !course.teeboxes[0]) return 4
    return course.teeboxes[0].holes[hole - 1]?.par || 4
  }

  const getHoleHdcp = (hole: number): number => {
    if (!course || !course.teeboxes || !course.teeboxes[0]) return hole
    return course.teeboxes[0].holes[hole - 1]?.handicap || hole
  }

  const hasStrokes = (player: Player, hole: number): boolean => {
    if (!player.strokeHoles) return false

    // Check Sixes game strokes
    if (group?.gameSettings?.sixes?.enabled && player.strokeHoles.sixes) {
      const sixesStrokes = player.strokeHoles.sixes
      return (
        sixesStrokes.firstGame?.includes(hole) ||
        sixesStrokes.secondGame?.includes(hole) ||
        sixesStrokes.thirdGame?.includes(hole)
      )
    }

    // Check Nines game strokes
    if (group?.gameSettings?.nines?.enabled && player.strokeHoles.nines) {
      return player.strokeHoles.nines.includes(hole)
    }

    // Check Dots game strokes
    if (group?.gameSettings?.dots?.enabled && player.strokeHoles.dots) {
      return player.strokeHoles.dots.includes(hole)
    }

    // Check Nassau game strokes
    if (group?.gameSettings?.nassau?.enabled && player.strokeHoles.nassau) {
      return player.strokeHoles.nassau.includes(hole)
    }

    return false
  }

  const allScoresEntered = (): boolean => {
    if (!group) return false

    return group.players.every((player) => {
      return player.score.every((score) => score !== null)
    })
  }

  const enterEntryMode = () => {
    if (!isScorer && !isVerifier) {
      toast.error('Only the scorer or verifier can enter scores')
      return
    }
    // Find the next unscored hole
    const nextHole = findNextUnscoredHole()
    setCurrentEntryHole(nextHole)
    setSearchParams({ mode: 'entry' })
  }

  const exitEntryMode = () => {
    setActiveTab('scorecard')
    setSearchParams({})
  }

  // Navigation handlers for entry mode
  const navigateToPreviousHole = () => {
    setCurrentEntryHole(prev => prev === 1 ? 18 : prev - 1)
  }

  const navigateToNextHole = () => {
    setCurrentEntryHole(prev => prev === 18 ? 1 : prev + 1)
  }

  const jumpToHole = (hole: number) => {
    setCurrentEntryHole(hole)
  }

  // Handle saving scores from the entry content
  // Uses updateGroupScores (like Vue) for transaction-based atomic updates
  const handleSaveFromEntry = async (saveData: {
    hole: number
    scores: Record<string, {
      score: number | null
      dots: number
      dnf: boolean
      greenieToggle: boolean
      sandyToggle: boolean
      greenies: number[]
      sandies: number[]
      dnfArray: boolean[]
    }>
    eventLog?: any[]
  }) => {
    if (!tournamentId || !groupId || !group) return

    try {
      const { hole, scores, eventLog = [] } = saveData
      const holePar = getHolePar(hole)
      const scoreIndex = hole - 1

      // Build updated players array with the new scores (for calculating next hole)
      const updatedPlayers = group.players.map(player => {
        const scoreData = scores[player.id]
        if (!scoreData) return player

        const newScore = [...(player.score || Array(18).fill(null))]
        const newDots = [...(player.dots || Array(18).fill(0))]
        const newDnf = [...(player.dnf || Array(18).fill(false))]

        newScore[scoreIndex] = scoreData.score
        newDots[scoreIndex] = scoreData.dots
        newDnf[scoreIndex] = scoreData.dnf

        return {
          ...player,
          score: newScore,
          dots: newDots,
          dnf: newDnf,
          greenies: scoreData.greenies,
          sandies: scoreData.sandies,
        }
      })

      // Optimistic UI Update - update local state immediately for responsiveness
      Object.keys(scores).forEach(playerId => {
        const scoreData = scores[playerId]
        const existingPlayer = localPlayerScores.get(playerId)
        if (existingPlayer) {
          const newScore = [...(existingPlayer.score || Array(18).fill(null))]
          const newDots = [...(existingPlayer.dots || Array(18).fill(0))]
          const newDnf = [...(existingPlayer.dnf || Array(18).fill(false))]
          
          newScore[scoreIndex] = scoreData.score
          newDots[scoreIndex] = scoreData.dots
          newDnf[scoreIndex] = scoreData.dnf
          
          setLocalPlayerScores(prev => {
            const updated = new Map(prev)
            updated.set(playerId, {
              ...existingPlayer,
              score: newScore,
              dots: newDots,
              dnf: newDnf,
              greenies: scoreData.greenies,
              sandies: scoreData.sandies,
            })
            return updated
          })
        }
      })

      // Also update the group state optimistically for immediate UI feedback
      setGroup(prevGroup => prevGroup ? { ...prevGroup, players: updatedPlayers } : null)

      // Get scorer info for event logging
      const scorer = group.players.find(p => p.id === group.scorerId)

      // Use updateGroupScores for transaction-based atomic update (matches Vue implementation)
      await tournamentsStore.updateGroupScores(
        tournamentId,
        groupId,
        hole,
        holePar,
        scorer,
        group.players,
        scores,
        eventLog
      )

      toast.success(`Hole ${hole} saved`)

      // Calculate next unscored hole using the UPDATED players array (not stale state)
      // This matches Vue's approach of using nextTick() to ensure updated state
      const startingTee = group.startingTee || 1
      const holesInOrder: number[] = []
      for (let i = 0; i < 18; i++) {
        const holeNum = ((startingTee - 1 + i) % 18) + 1
        holesInOrder.push(holeNum)
      }

      let nextHole = startingTee
      for (const holeNum of holesInOrder) {
        const holeIdx = holeNum - 1
        const allScored = updatedPlayers.every(player => {
          const score = player.score?.[holeIdx]
          const dnf = player.dnf?.[holeIdx]
          return (score !== null && score !== undefined) || dnf
        })

        if (!allScored) {
          nextHole = holeNum
          break
        }
      }

      // Navigate to next unscored hole immediately
      setCurrentEntryHole(nextHole)
    } catch (error) {
      console.error('Failed to save scores:', error)
      toast.error('Failed to save scores. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading course data...</p>
        </div>
      </div>
    )
  }

  if (!tournament || !group || !course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Failed to load scorecard data</p>
      </div>
    )
  }

  const scorerName = group.players.find((p) => p.id === group.scorerId)?.shortName || 'Unknown'
  const verifierName = group.verifierId
    ? group.players.find((p) => p.id === group.verifierId)?.shortName
    : undefined

  return (
    <div className="min-h-screen bg-background">
      <ScorecardHeader
        courseName={course.name}
        groupNumber={group.number}
        isScorer={isScorer}
        isNinesGame={group.gameSettings?.nines?.enabled || false}
        nassauEnabled={group.gameSettings?.nassau?.enabled || false}
        skinsEnabled={tournament.competitions?.skins?.enabled || false}
        allScoresEntered={allScoresEntered()}
        scorerName={scorerName}
        verifierName={verifierName}
        isEntryMode={isEntryMode}
        discrepancyCount={0}
        unverifiedCount={0}
        tournamentId={tournamentId!}
        onSelectTab={setActiveTab}
        onEnterScoring={enterEntryMode}
        onExitScoring={exitEntryMode}
      />

      {/* Main Content */}
      {/* Score Entry Mode - Inline component replaces tabs */}
      {isEntryMode && (isScorer || isVerifier) ? (
        <ScorerEntryContent
          currentHole={currentEntryHole}
          group={group}
          course={course}
          tournament={tournament}
          isVerifier={isVerifier}
          onNavigatePrevious={navigateToPreviousHole}
          onNavigateNext={navigateToNextHole}
          onJumpToHole={jumpToHole}
          onSave={handleSaveFromEntry}
        />
      ) : (
        <div className="container max-w-7xl mx-auto p-4">
          /* Regular Scorecard Views - Read Only */
          <>
            {activeTab === 'scorecard' && (
              <ScorecardGrid
                golfers={group.players}
                localPlayerScores={localPlayerScores}
                isScorer={false} // Always false - scorecard is view-only
                hasStrokes={hasStrokes}
                getHolePar={getHolePar}
                getHoleHdcp={getHoleHdcp}
                games={group.gameSettings || {}}
                course={course}
                onRowClick={() => {}} // No-op - scorecard is view-only
              />
            )}

            {activeTab === 'match' && group.gameSettings?.sixes?.enabled && (
              <MatchPanel
                players={group.players}
                localPlayerScores={localPlayerScores}
                course={course}
                tournament={tournament}
                gameSettings={group.gameSettings}
                startingTee={group.startingTee || 1}
              />
            )}

            {activeTab === 'bets' &&
              (group.gameSettings?.nines?.enabled ||
                group.gameSettings?.nassau?.enabled) && (
                <BetsPanel
                  players={group.players}
                  localPlayerScores={localPlayerScores}
                  course={course}
                  tournament={tournament}
                  gameSettings={group.gameSettings}
                />
              )}

            {activeTab === 'skins' && tournament.competitions?.skins?.enabled && (
              <SkinsPanel
                tournament={tournament}
                course={course}
                allPlayers={allPlayers}
              />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardTab
                allPlayers={allPlayers}
                course={course}
                currentGroupId={groupId!}
              />
            )}
          </>
        </div>
      )}
    </div>
  )
}
