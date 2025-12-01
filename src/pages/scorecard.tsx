import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { useCoursesStore } from '@/stores/courses-store'
import { Player, Course, Group, Tournament } from '@/types'
import { ScorecardHeader } from '@/components/scorecard/scorecard-header'
import { ScorecardGrid } from '@/components/scorecard/scorecard-grid'
import { Loader2 } from 'lucide-react'

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
      alert('Only the scorer or verifier can enter scores')
      return
    }
    setSearchParams({ mode: 'entry' })
  }

  const exitEntryMode = () => {
    setSearchParams({})
  }

  const handleRowClick = (hole: number) => {
    if (isScorer || isVerifier) {
      // TODO: Open score entry dialog
      console.log('Open score entry for hole:', hole)
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
          <div>
            <p className="text-center py-8">Score Entry Mode - To be implemented</p>
          </div>
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

            {activeTab === 'match' && <div className="text-center py-8">Match Panel - To be implemented</div>}
            {activeTab === 'bets' && <div className="text-center py-8">Bets Panel - To be implemented</div>}
            {activeTab === 'skins' && <div className="text-center py-8">Skins Panel - To be implemented</div>}
            {activeTab === 'leaderboard' && <div className="text-center py-8">Leaderboard - To be implemented</div>}
          </>
        )}
      </div>
    </div>
  )
}

