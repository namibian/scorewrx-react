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
  calculatePoints as calculateNinesPoints,
  type NinesPointResult,
} from '@/lib/game-logic/nines-match'
import {
  getMatchStandings,
  type NassauMatchStandings,
} from '@/lib/game-logic/nassau-match'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BetsPanelProps {
  players: Player[]
  localPlayerScores: Map<string, Player>
  course: Course
  tournament: Tournament
  gameSettings: GameSettings
}

export function BetsPanel({
  players,
  localPlayerScores,
  course,
  tournament,
  gameSettings,
}: BetsPanelProps) {
  const ninesEnabled = gameSettings.nines?.enabled ?? false
  const nassauEnabled = gameSettings.nassau?.enabled ?? false

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

  // ============================================
  // NINES CALCULATIONS
  // ============================================

  const ninesResults = useMemo(() => {
    if (!ninesEnabled || players.length !== 3) return null

    const holePoints: (NinesPointResult[] | null)[] = []
    const playerTotals: Record<string, number> = {}

    // Initialize totals
    players.forEach((player) => {
      playerTotals[player.id] = 0
    })

    // Calculate points for each hole
    for (let hole = 0; hole < 18; hole++) {
      const points = calculateNinesPoints(
        players,
        scoresMap,
        hole,
        course,
        tournament
      )
      holePoints.push(points)

      if (points) {
        points.forEach((p) => {
          playerTotals[p.playerId] += p.points
        })
      }
    }

    return { holePoints, playerTotals }
  }, [ninesEnabled, players, scoresMap, course, tournament])

  const ninesMoneyOwed = useMemo(() => {
    if (!ninesResults || !ninesEnabled) return null

    const amountPerPoint = gameSettings.nines?.amountPerPoint ?? 1
    const moneyOwed: Record<string, number> = {}

    // Calculate money for each player
    Object.entries(ninesResults.playerTotals).forEach(([playerId, points]) => {
      // Money owed = (player's points - average points) * amount per point
      // Average is 54 points / 3 players = 18 points per player
      const avgPoints = 54 / players.length
      const differential = points - avgPoints
      moneyOwed[playerId] = differential * amountPerPoint
    })

    return moneyOwed
  }, [ninesResults, ninesEnabled, gameSettings.nines?.amountPerPoint, players])

  // ============================================
  // NASSAU CALCULATIONS
  // ============================================

  const nassauResults = useMemo(() => {
    if (!nassauEnabled || players.length !== 2) return null

    const [player1, player2] = players
    const matchType = gameSettings.nassau?.matchType ?? 'all'

    // Helper function to get net score for Nassau
    const getNetScore = (playerId: string, hole: number): number | null => {
      const playerData = scoresMap.get(playerId)
      const player = players.find((p) => p.id === playerId)
      if (!playerData || !player) return null

      const score = playerData.score[hole - 1]
      const isDNF = playerData.dnf[hole - 1]

      if (score === null || isDNF) return null

      // Check if player gets a stroke using strokeHoles.nassau array
      const hasStroke = player.strokeHoles?.nassau?.includes(hole) ?? false

      // Check if this is a Par 3 hole and half-strokes are enabled
      const isPar3 = course?.teeboxes?.[0]?.holes[hole - 1]?.par === 3
      const useHalfStroke =
        isPar3 && tournament?.competitions?.skins?.useHalfStrokeOnPar3

      // Apply stroke
      const strokes = hasStroke ? (useHalfStroke ? 0.5 : 1) : 0
      return score - strokes
    }

    const standings = getMatchStandings(
      player1,
      player2,
      scoresMap,
      matchType,
      getNetScore
    )

    return { player1, player2, standings }
  }, [
    nassauEnabled,
    players,
    scoresMap,
    gameSettings.nassau?.matchType,
    course,
    tournament,
  ])

  const nassauMoneyOwed = useMemo(() => {
    if (!nassauResults || !nassauEnabled) return null

    const amountPerGame = gameSettings.nassau?.amountPerGame ?? 5
    const matchType = gameSettings.nassau?.matchType ?? 'all'
    const { player1, player2, standings } = nassauResults

    const moneyOwed: Record<string, number> = {}
    moneyOwed[player1.id] = 0
    moneyOwed[player2.id] = 0

    // Calculate money based on match type
    if (matchType === 'all') {
      // Three separate bets: front, back, overall
      if (standings.front > 0) moneyOwed[player1.id] += amountPerGame
      else if (standings.front < 0) moneyOwed[player2.id] += amountPerGame

      if (standings.back > 0) moneyOwed[player1.id] += amountPerGame
      else if (standings.back < 0) moneyOwed[player2.id] += amountPerGame

      if (standings.overall > 0) moneyOwed[player1.id] += amountPerGame
      else if (standings.overall < 0) moneyOwed[player2.id] += amountPerGame
    } else if (matchType === 'frontback') {
      // Two bets: front and back
      if (standings.front > 0) moneyOwed[player1.id] += amountPerGame
      else if (standings.front < 0) moneyOwed[player2.id] += amountPerGame

      if (standings.back > 0) moneyOwed[player1.id] += amountPerGame
      else if (standings.back < 0) moneyOwed[player2.id] += amountPerGame
    } else {
      // Overall only
      if (standings.overall > 0) moneyOwed[player1.id] += amountPerGame
      else if (standings.overall < 0) moneyOwed[player2.id] += amountPerGame
    }

    return moneyOwed
  }, [nassauResults, nassauEnabled, gameSettings.nassau])

  // ============================================
  // RENDER
  // ============================================

  if (!ninesEnabled && !nassauEnabled) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No Nines or Nassau games enabled
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue={ninesEnabled ? 'nines' : 'nassau'} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        {ninesEnabled && <TabsTrigger value="nines">Nines</TabsTrigger>}
        {nassauEnabled && <TabsTrigger value="nassau">Nassau</TabsTrigger>}
      </TabsList>

      {/* NINES TAB */}
      {ninesEnabled && (
        <TabsContent value="nines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nines Game</CardTitle>
              <CardDescription>
                9 points per hole distributed based on net scores (5-3-1,
                4-4-1, or 3-3-3)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ninesResults ? (
                <>
                  {/* Player Totals */}
                  <div className="space-y-2">
                    {players.map((player) => {
                      const points = ninesResults.playerTotals[player.id] || 0
                      const money = ninesMoneyOwed?.[player.id] || 0

                      return (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div>
                            <div className="font-semibold">
                              {player.shortName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Hdcp: {player.tournamentHandicap || 0}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{points}</div>
                            <div
                              className={`text-sm font-semibold ${
                                money > 0
                                  ? 'text-green-600'
                                  : money < 0
                                  ? 'text-red-600'
                                  : ''
                              }`}
                            >
                              {money > 0 ? '+' : ''}$
                              {Math.abs(money).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Hole-by-hole breakdown */}
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium hover:underline">
                      View hole-by-hole breakdown
                    </summary>
                    <div className="mt-2 space-y-1">
                      {ninesResults.holePoints.map((holeResult, idx) => {
                        if (!holeResult) return null

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                          >
                            <span className="font-medium">Hole {idx + 1}</span>
                            <div className="flex gap-3">
                              {holeResult.map((playerResult) => {
                                const player = players.find(
                                  (p) => p.id === playerResult.playerId
                                )
                                return (
                                  <span key={playerResult.playerId}>
                                    {player?.shortName}:{' '}
                                    <span className="font-semibold">
                                      {playerResult.points}
                                    </span>
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </details>
                </>
              ) : (
                <p className="text-center text-muted-foreground">
                  Requires exactly 3 players
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* NASSAU TAB */}
      {nassauEnabled && (
        <TabsContent value="nassau" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nassau Match Play</CardTitle>
              <CardDescription>
                Head-to-head match play: Front 9, Back 9, Overall 18
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nassauResults ? (
                <>
                  {/* Match Standings */}
                  <div className="space-y-4">
                    {/* Front 9 */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Front 9</span>
                        {nassauResults.standings.front > 0 ? (
                          <Badge className="bg-green-600">
                            {nassauResults.player1.shortName} up{' '}
                            {nassauResults.standings.front}
                          </Badge>
                        ) : nassauResults.standings.front < 0 ? (
                          <Badge className="bg-red-600">
                            {nassauResults.player2.shortName} up{' '}
                            {Math.abs(nassauResults.standings.front)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">All Square</Badge>
                        )}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{nassauResults.player1.shortName}</span>
                        <span>{nassauResults.player2.shortName}</span>
                      </div>
                    </div>

                    {/* Back 9 */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Back 9</span>
                        {nassauResults.standings.back > 0 ? (
                          <Badge className="bg-green-600">
                            {nassauResults.player1.shortName} up{' '}
                            {nassauResults.standings.back}
                          </Badge>
                        ) : nassauResults.standings.back < 0 ? (
                          <Badge className="bg-red-600">
                            {nassauResults.player2.shortName} up{' '}
                            {Math.abs(nassauResults.standings.back)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">All Square</Badge>
                        )}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{nassauResults.player1.shortName}</span>
                        <span>{nassauResults.player2.shortName}</span>
                      </div>
                    </div>

                    {/* Overall 18 */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Overall 18</span>
                        {nassauResults.standings.overall > 0 ? (
                          <Badge className="bg-green-600">
                            {nassauResults.player1.shortName} up{' '}
                            {nassauResults.standings.overall}
                          </Badge>
                        ) : nassauResults.standings.overall < 0 ? (
                          <Badge className="bg-red-600">
                            {nassauResults.player2.shortName} up{' '}
                            {Math.abs(nassauResults.standings.overall)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">All Square</Badge>
                        )}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{nassauResults.player1.shortName}</span>
                        <span>{nassauResults.player2.shortName}</span>
                      </div>
                    </div>

                    {/* Money Owed */}
                    {nassauMoneyOwed && (
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <div className="text-sm font-medium text-center mb-3">
                          Money Owed ($
                          {gameSettings.nassau?.amountPerGame ?? 5} per game)
                        </div>
                        <div className="space-y-2">
                          {players.map((player) => {
                            const money = nassauMoneyOwed[player.id] || 0
                            return (
                              <div
                                key={player.id}
                                className="flex justify-between items-center"
                              >
                                <span className="font-semibold">
                                  {player.shortName}
                                </span>
                                <span
                                  className={`font-bold ${
                                    money > 0
                                      ? 'text-green-600'
                                      : money < 0
                                      ? 'text-red-600'
                                      : ''
                                  }`}
                                >
                                  {money > 0 ? '+' : ''}$
                                  {Math.abs(money).toFixed(2)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground">
                  Requires exactly 2 players
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  )
}

