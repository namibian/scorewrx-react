import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Player, Course, Tournament, GameSettings } from '@/types'
import {
  getTeamsForGame,
  getGameHoleRange,
  calculateGameResult,
  calculatePoints,
  type SixesHoleResult,
} from '@/lib/game-logic/sixes-match'

interface MatchPanelProps {
  players: Player[]
  localPlayerScores: Map<string, Player>
  course: Course
  tournament: Tournament
  gameSettings: GameSettings
  startingTee?: number
}

export function MatchPanel({
  players,
  localPlayerScores,
  course,
  tournament,
  gameSettings,
  startingTee = 1,
}: MatchPanelProps) {
  const use2Points = gameSettings.sixes?.use2PointsPerGame ?? false
  const amountPerGame = gameSettings.sixes?.amountPerGame ?? 5

  // Convert localPlayerScores to the format expected by game logic
  const scoresMap = useMemo(() => {
    const map = new Map<string, { score: (number | null)[]; dnf: boolean[] }>()
    localPlayerScores.forEach((player, playerId) => {
      map.set(playerId, {
        score: player.score || Array(18).fill(null),
        dnf: player.dnf || Array(18).fill(false),
      })
    })
    return map
  }, [localPlayerScores])

  // Calculate results for each game
  const gameResults = useMemo(() => {
    const results = []

    for (let gameNum = 1; gameNum <= 3; gameNum++) {
      const gameNumber = gameNum as 1 | 2 | 3
      const { team1, team2 } = getTeamsForGame(gameNumber, players)
      const { startHole, endHole } = getGameHoleRange(gameNumber, startingTee)

      const result = calculateGameResult(
        team1,
        team2,
        startHole,
        endHole,
        scoresMap,
        gameNumber,
        course,
        tournament
      )

      results.push({
        gameNumber,
        team1,
        team2,
        startHole,
        endHole,
        result,
      })
    }

    return results
  }, [players, scoresMap, course, tournament, startingTee])

  // Calculate hole-by-hole details for each game
  const holeDetails = useMemo(() => {
    const details: Record<number, SixesHoleResult[]> = {}

    gameResults.forEach(({ gameNumber, team1, team2, startHole, endHole }) => {
      const holes: SixesHoleResult[] = []
      const isWrapped = endHole < startHole

      if (isWrapped) {
        // Handle wrap-around
        for (let hole = startHole; hole <= 18; hole++) {
          const result = calculatePoints(
            team1,
            team2,
            hole,
            scoresMap,
            gameNumber,
            use2Points,
            course,
            tournament
          )
          if (result) holes.push(result)
        }
        for (let hole = 1; hole <= endHole; hole++) {
          const result = calculatePoints(
            team1,
            team2,
            hole,
            scoresMap,
            gameNumber,
            use2Points,
            course,
            tournament
          )
          if (result) holes.push(result)
        }
      } else {
        // Normal case
        for (let hole = startHole; hole <= endHole; hole++) {
          const result = calculatePoints(
            team1,
            team2,
            hole,
            scoresMap,
            gameNumber,
            use2Points,
            course,
            tournament
          )
          if (result) holes.push(result)
        }
      }

      details[gameNumber] = holes
    })

    return details
  }, [gameResults, scoresMap, course, tournament, use2Points])

  // Calculate overall match standing
  const overallStanding = useMemo(() => {
    let team1Wins = 0
    let team2Wins = 0

    gameResults.forEach(({ result }) => {
      if (result === 1) team1Wins++
      else if (result === -1) team2Wins++
    })

    return { team1Wins, team2Wins }
  }, [gameResults])

  const getTeamNames = (players: Player[]) => {
    return players.map((p) => p.shortName).join(' / ')
  }

  const getResultBadge = (result: number) => {
    if (result === 1)
      return <Badge className="bg-green-600">Team 1 Wins</Badge>
    if (result === -1)
      return <Badge className="bg-red-600">Team 2 Wins</Badge>
    return <Badge variant="outline">Tied</Badge>
  }

  const calculateMoney = () => {
    const team1Money = overallStanding.team1Wins * amountPerGame
    const team2Money = overallStanding.team2Wins * amountPerGame
    const differential = team1Money - team2Money

    return { team1Money, team2Money, differential }
  }

  const money = calculateMoney()

  return (
    <div className="space-y-4">
      {/* Overall Standing */}
      <Card>
        <CardHeader>
          <CardTitle>Sixes Match Overview</CardTitle>
          <CardDescription>
            Three 6-hole games: Cart Partners, Cross-cart, Drivers vs Riders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {overallStanding.team1Wins}
              </div>
              <div className="text-xs text-muted-foreground">Team 1 Wins</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {3 -
                  overallStanding.team1Wins -
                  overallStanding.team2Wins}
              </div>
              <div className="text-xs text-muted-foreground">Tied</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">
                {overallStanding.team2Wins}
              </div>
              <div className="text-xs text-muted-foreground">Team 2 Wins</div>
            </div>
          </div>

          {/* Money Display */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium text-center mb-2">
              Money (${amountPerGame} per game)
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Team 1:</span>
              <span className="font-semibold">
                ${money.team1Money.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Team 2:</span>
              <span className="font-semibold">
                ${money.team2Money.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t mt-2">
              <span className="text-sm font-semibold">Net:</span>
              <span
                className={`font-bold ${
                  money.differential > 0
                    ? 'text-green-600'
                    : money.differential < 0
                    ? 'text-red-600'
                    : ''
                }`}
              >
                {money.differential > 0 ? '+' : ''}$
                {Math.abs(money.differential).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Game Results */}
      {gameResults.map(
        ({ gameNumber, team1, team2, startHole, endHole, result }) => {
          const holes = holeDetails[gameNumber] || []
          const team1Total = holes.reduce((sum, h) => sum + h.team1, 0)
          const team2Total = holes.reduce((sum, h) => sum + h.team2, 0)

          return (
            <Card key={gameNumber}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Game {gameNumber}
                    </CardTitle>
                    <CardDescription>
                      Holes {startHole}-{endHole}
                    </CardDescription>
                  </div>
                  {getResultBadge(result)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Team Names */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                    <div className="font-semibold text-sm">
                      {getTeamNames(team1)}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {team1Total > 0 ? `+${team1Total}` : team1Total}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded">
                    <div className="font-semibold text-sm">
                      {getTeamNames(team2)}
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {team2Total > 0 ? `+${team2Total}` : team2Total}
                    </div>
                  </div>
                </div>

                {/* Hole-by-hole breakdown (collapsed by default) */}
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium hover:underline">
                    View hole-by-hole breakdown
                  </summary>
                  <div className="mt-2 space-y-1">
                    {holes.map((hole, idx) => {
                      const holeNum = idx + startHole
                      const actualHoleNum =
                        holeNum > 18 ? holeNum - 18 : holeNum

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <span className="font-medium">
                            Hole {actualHoleNum}
                          </span>
                          <div className="flex gap-4">
                            <span
                              className={
                                hole.team1 > 0
                                  ? 'text-green-600 font-semibold'
                                  : ''
                              }
                            >
                              T1: {hole.team1 > 0 ? '+' : ''}
                              {hole.team1}
                            </span>
                            <span
                              className={
                                hole.team2 > 0
                                  ? 'text-red-600 font-semibold'
                                  : ''
                              }
                            >
                              T2: {hole.team2 > 0 ? '+' : ''}
                              {hole.team2}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </details>
              </CardContent>
            </Card>
          )
        }
      )}
    </div>
  )
}

