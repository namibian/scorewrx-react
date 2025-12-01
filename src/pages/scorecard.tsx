import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { useCoursesStore } from '@/stores/courses-store'
import { Player, Course, Group, Tournament } from '@/types'
import { ScorecardHeader } from '@/components/scorecard/scorecard-header'
import { ScorecardGrid } from '@/components/scorecard/scorecard-grid'
import { ScoreEntryDialog } from '@/components/scorecard/score-entry-dialog'
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
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false)
  const [selectedHole, setSelectedHole] = useState(1)

  const isEntryMode = searchParams.get('mode') === 'entry'
  const isScorer = group?.scorerId === playerId
  const isVerifier = group?.verifierId === playerId

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
  }, [tournamentId, groupId, tournamentsStore, coursesStore])

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
    setSearchParams({ mode: 'entry' })
  }

  const exitEntryMode = () => {
    setSearchParams({})
  }

  const handleRowClick = (hole: number) => {
    if (isEntryMode && (isScorer || isVerifier)) {
      setSelectedHole(hole)
      setScoreDialogOpen(true)
    }
  }

  const handleSaveScores = async (
    hole: number,
    scores: Array<{
      playerId: string
      score: number | null
      dots: number
      greenie: boolean
      sandy: boolean
      dnf: boolean
    }>
  ) => {
    if (!tournamentId || !groupId || !group) return

    try {
      // Update each player's scores
      const updatedPlayers = group.players.map((player) => {
        const scoreData = scores.find((s) => s.playerId === player.id)
        if (!scoreData) return player

        const newScore = [...(player.score || Array(18).fill(null))]
        const newDots = [...(player.dots || Array(18).fill(0))]
        const newDnf = [...(player.dnf || Array(18).fill(false))]
        const newGreenies = [...(player.greenies || [])]
        const newSandies = [...(player.sandies || [])]

        // Update arrays
        newScore[hole - 1] = scoreData.score
        newDots[hole - 1] = scoreData.dots
        newDnf[hole - 1] = scoreData.dnf

        // Update greenie/sandy arrays
        if (scoreData.greenie && !newGreenies.includes(hole)) {
          newGreenies.push(hole)
        } else if (!scoreData.greenie && newGreenies.includes(hole)) {
          newGreenies.splice(newGreenies.indexOf(hole), 1)
        }

        if (scoreData.sandy && !newSandies.includes(hole)) {
          newSandies.push(hole)
        } else if (!scoreData.sandy && newSandies.includes(hole)) {
          newSandies.splice(newSandies.indexOf(hole), 1)
        }

        return {
          ...player,
          score: newScore,
          dots: newDots,
          dnf: newDnf,
          greenies: newGreenies,
          sandies: newSandies,
        }
      })

      // Update the group with new player data
      const updatedGroup = { ...group, players: updatedPlayers }

      // Save to Firestore via store
      await tournamentsStore.updateGroup(tournamentId, groupId, updatedGroup)
    } catch (error) {
      console.error('Failed to save scores:', error)
      toast.error('Failed to save scores. Please try again.')
    }
  }

  const handleNavigateHole = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedHole > 1) {
      setSelectedHole(selectedHole - 1)
    } else if (direction === 'next' && selectedHole < 18) {
      setSelectedHole(selectedHole + 1)
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
      <div className="container max-w-7xl mx-auto p-4">
        {isEntryMode ? (
          <ScorecardGrid
            golfers={group.players}
            localPlayerScores={localPlayerScores}
            isScorer={isScorer}
            hasStrokes={hasStrokes}
            getHolePar={getHolePar}
            getHoleHdcp={getHoleHdcp}
            games={group.gameSettings || {}}
            course={course}
            onRowClick={handleRowClick}
          />
        ) : (
          <>
            {activeTab === 'scorecard' && (
              <ScorecardGrid
                golfers={group.players}
                localPlayerScores={localPlayerScores}
                isScorer={isScorer}
                hasStrokes={hasStrokes}
                getHolePar={getHolePar}
                getHoleHdcp={getHoleHdcp}
                games={group.gameSettings || {}}
                course={course}
                onRowClick={handleRowClick}
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
        )}
      </div>

      {/* Score Entry Dialog */}
      {group && course && (
        <ScoreEntryDialog
          open={scoreDialogOpen}
          onClose={() => setScoreDialogOpen(false)}
          hole={selectedHole}
          players={group.players}
          course={course}
          localPlayerScores={localPlayerScores}
          isVerifier={isVerifier}
          onSaveScores={handleSaveScores}
          onNavigate={handleNavigateHole}
        />
      )}
    </div>
  )
}

