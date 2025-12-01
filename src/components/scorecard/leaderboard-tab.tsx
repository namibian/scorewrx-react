import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Player, Course } from '@/types'

interface LeaderboardTabProps {
  allPlayers: Map<string, Player> // All players from all groups
  course: Course
  currentGroupId: string // Current group to highlight
}

interface LeaderboardEntry {
  player: Player
  grossScore: number
  netScore: number
  holesPlayed: number
  relativeToPar: number
  netRelativeToPar: number
}

export function LeaderboardTab({
  allPlayers,
  course,
  currentGroupId,
}: LeaderboardTabProps) {
  const coursePar = useMemo(() => {
    if (!course.teeboxes?.[0]?.holes) return 72
    return course.teeboxes[0].holes.reduce((sum, hole) => sum + hole.par, 0)
  }, [course])

  // Calculate leaderboard entries
  const leaderboard = useMemo(() => {
    const entries: LeaderboardEntry[] = []

    allPlayers.forEach((player) => {
      // Calculate gross score
      let grossScore = 0
      let holesPlayed = 0

      if (player.score) {
        for (let i = 0; i < 18; i++) {
          const score = player.score[i]
          const isDNF = player.dnf?.[i]

          if (score !== null && score !== undefined && !isDNF) {
            grossScore += score
            holesPlayed++
          }
        }
      }

      // Skip if no holes played
      if (holesPlayed === 0) return

      // Calculate net score (gross - handicap)
      const handicap = player.tournamentHandicap || 0
      const netScore = grossScore - handicap

      // Calculate relative to par
      const relativeToPar = grossScore - coursePar
      const netRelativeToPar = netScore - coursePar

      entries.push({
        player,
        grossScore,
        netScore,
        holesPlayed,
        relativeToPar,
        netRelativeToPar,
      })
    })

    // Sort by net score (ascending = better)
    // Tiebreakers: back 9, last 6 holes
    return entries.sort((a, b) => {
      // Primary: Net score
      if (a.netScore !== b.netScore) {
        return a.netScore - b.netScore
      }

      // Tiebreaker 1: Back 9 net score
      const aBack9 = calculateBack9Net(a.player, course)
      const bBack9 = calculateBack9Net(b.player, course)
      if (aBack9 !== bBack9) {
        return aBack9 - bBack9
      }

      // Tiebreaker 2: Last 6 holes net score
      const aLast6 = calculateLast6Net(a.player, course)
      const bLast6 = calculateLast6Net(b.player, course)
      if (aLast6 !== bLast6) {
        return aLast6 - bLast6
      }

      // Tiebreaker 3: Gross score
      return a.grossScore - b.grossScore
    })
  }, [allPlayers, coursePar, course])

  // Calculate back 9 net score
  const calculateBack9Net = (player: Player, course: Course): number => {
    if (!player.score) return 999

    let back9Gross = 0
    let holesPlayed = 0

    for (let i = 9; i < 18; i++) {
      const score = player.score[i]
      const isDNF = player.dnf?.[i]

      if (score !== null && score !== undefined && !isDNF) {
        back9Gross += score
        holesPlayed++
      }
    }

    if (holesPlayed === 0) return 999

    // Calculate back 9 par
    const back9Par = course.teeboxes?.[0]?.holes
      .slice(9, 18)
      .reduce((sum, hole) => sum + hole.par, 0) || 36

    // Apply half handicap for back 9
    const handicap = player.tournamentHandicap || 0
    const back9Net = back9Gross - Math.floor(handicap / 2)

    return back9Net - back9Par
  }

  // Calculate last 6 holes net score
  const calculateLast6Net = (player: Player, course: Course): number => {
    if (!player.score) return 999

    let last6Gross = 0
    let holesPlayed = 0

    for (let i = 12; i < 18; i++) {
      const score = player.score[i]
      const isDNF = player.dnf?.[i]

      if (score !== null && score !== undefined && !isDNF) {
        last6Gross += score
        holesPlayed++
      }
    }

    if (holesPlayed === 0) return 999

    // Calculate last 6 par
    const last6Par = course.teeboxes?.[0]?.holes
      .slice(12, 18)
      .reduce((sum, hole) => sum + hole.par, 0) || 24

    // Apply one-third handicap for last 6
    const handicap = player.tournamentHandicap || 0
    const last6Net = last6Gross - Math.floor(handicap / 3)

    return last6Net - last6Par
  }

  // Format relative to par
  const formatRelative = (value: number): string => {
    if (value === 0) return 'E'
    if (value > 0) return `+${value}`
    return `${value}`
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No scores entered yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tournament Leaderboard</CardTitle>
          <CardDescription>
            Sorted by net score • Par {coursePar}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Pos</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-center">Holes</TableHead>
                <TableHead className="text-center">Gross</TableHead>
                <TableHead className="text-center">Net</TableHead>
                <TableHead className="text-center">To Par</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry, index) => {
                const isCurrentGroup = entry.player.groupId === currentGroupId
                const position = index + 1

                return (
                  <TableRow
                    key={entry.player.id}
                    className={isCurrentGroup ? 'bg-primary/5' : ''}
                  >
                    <TableCell className="font-medium">
                      {position}
                      {position === 1 && (
                        <span className="ml-1 text-yellow-500">👑</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold">
                            {entry.player.shortName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Hdcp: {entry.player.tournamentHandicap || 0}
                          </div>
                        </div>
                        {isCurrentGroup && (
                          <Badge variant="outline" className="text-xs">
                            Your Group
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.holesPlayed}/18
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {entry.grossScore}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {entry.netScore}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-bold ${
                          entry.netRelativeToPar < 0
                            ? 'text-green-600'
                            : entry.netRelativeToPar > 0
                            ? 'text-red-600'
                            : ''
                        }`}
                      >
                        {formatRelative(entry.netRelativeToPar)}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top 3 Highlights */}
      {leaderboard.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 3</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {leaderboard.slice(0, 3).map((entry, index) => (
                <div
                  key={entry.player.id}
                  className="text-center p-4 bg-muted rounded-lg"
                >
                  <div className="text-3xl mb-2">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="font-semibold text-sm">
                    {entry.player.shortName}
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {formatRelative(entry.netRelativeToPar)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Net: {entry.netScore}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

