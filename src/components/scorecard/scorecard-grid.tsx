import { Player, GameSettings, Course } from '@/types'
import { ScoreDisplay } from './score-display'
import { cn } from '@/lib/utils'

interface ScorecardGridProps {
  golfers: Player[]
  localPlayerScores: Map<string, Player>
  isScorer: boolean
  hasStrokes: (player: Player, hole: number) => boolean
  getHolePar: (hole: number) => number
  getHoleHdcp: (hole: number) => number
  games: GameSettings
  course: Course | null
  onRowClick?: (hole: number) => void
}

export function ScorecardGrid({
  golfers,
  localPlayerScores,
  isScorer,
  hasStrokes,
  getHolePar,
  getHoleHdcp,
  games,
  onRowClick,
}: ScorecardGridProps) {
  // Sort golfers by cart and position for Sixes game
  const sortedGolfers = [...golfers].sort((a, b) => {
    if (games.sixes?.enabled) {
      const cartA = parseInt(a.cart || '0')
      const cartB = parseInt(b.cart || '0')
      if (cartA !== cartB) return cartA - cartB
      if (a.position === 'driver' && b.position !== 'driver') return -1
      if (a.position !== 'driver' && b.position === 'driver') return 1
    }
    return 0
  })

  const getScore = (hole: number, playerId: string) => {
    const player = localPlayerScores.get(playerId)
    if (!player) return null

    return {
      score: player.score[hole - 1],
      dots: player.dots[hole - 1],
      dnf: player.dnf[hole - 1],
      greenies: player.greenies,
      sandies: player.sandies,
    }
  }

  const getSubtotal = (playerId: string, startHole: number, endHole: number) => {
    const player = localPlayerScores.get(playerId)
    if (!player) return '-'

    let total = 0
    let hasAnyScore = false

    for (let hole = startHole; hole <= endHole; hole++) {
      const score = player.score[hole - 1]
      if (score !== null) {
        total += score
        hasAnyScore = true
      }
    }

    return hasAnyScore ? total : '-'
  }

  const getNetScore = (playerId: string) => {
    const grossScore = getSubtotal(playerId, 1, 18)
    if (grossScore === '-') return '-'

    const player = localPlayerScores.get(playerId)
    if (!player) return '-'

    return (grossScore as number) - (player.tournamentHandicap || 0)
  }

  const getTotalDots = (playerId: string) => {
    const player = localPlayerScores.get(playerId)
    if (!player) return 0

    return player.dots.reduce((sum, dots) => sum + dots, 0)
  }

  const getFrontNinePar = () => {
    let total = 0
    for (let hole = 1; hole <= 9; hole++) {
      total += getHolePar(hole)
    }
    return total
  }

  const getBackNinePar = () => {
    let total = 0
    for (let hole = 10; hole <= 18; hole++) {
      total += getHolePar(hole)
    }
    return total
  }

  const getTotalPar = () => getFrontNinePar() + getBackNinePar()

  const renderHoleRow = (hole: number) => {
    return (
      <tr
        key={hole}
        className={cn(
          'border-b hover:bg-muted/50 cursor-pointer',
          hole === 9 && 'border-b-2 border-gray-400'
        )}
        onClick={() => isScorer && onRowClick?.(hole)}
      >
        <td className="text-center py-2 px-2 font-medium">{hole}</td>
        <td className="text-center py-2 px-2">{getHolePar(hole)}</td>
        <td className="text-center py-2 px-2 text-sm text-muted-foreground">
          {getHoleHdcp(hole)}
        </td>
        {sortedGolfers.map((golfer, index) => {
          const scoreData = getScore(hole, golfer.id)
          return (
            <td
              key={golfer.id}
              className={cn(
                'text-center py-2 px-2',
                hasStrokes(golfer, hole) && 'bg-yellow-50',
                index === sortedGolfers.length - 1 && 'border-r-2 border-gray-300'
              )}
            >
              {scoreData && (
                <ScoreDisplay
                  score={scoreData.score}
                  dots={scoreData.dots}
                  dnf={scoreData.dnf}
                  par={getHolePar(hole)}
                  sandy={scoreData.sandies?.includes(hole)}
                  greenie={scoreData.greenies?.includes(hole)}
                />
              )}
            </td>
          )
        })}
      </tr>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="py-2 px-2 text-center">Hole</th>
            <th className="py-2 px-2 text-center">Par</th>
            <th className="py-2 px-2 text-center">Hdcp</th>
            {sortedGolfers.map((golfer, index) => (
              <th
                key={golfer.id}
                className={cn(
                  'py-2 px-2 text-center text-xs',
                  index === sortedGolfers.length - 1 && 'border-r-2 border-gray-300'
                )}
              >
                {golfer.shortName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Front Nine */}
          {Array.from({ length: 9 }, (_, i) => i + 1).map(renderHoleRow)}

          {/* Out Total */}
          <tr className="bg-muted font-semibold">
            <td className="text-center py-2 px-2">Out</td>
            <td className="text-center py-2 px-2">{getFrontNinePar()}</td>
            <td className="text-center py-2 px-2"></td>
            {sortedGolfers.map((golfer, index) => (
              <td
                key={golfer.id}
                className={cn(
                  'text-center py-2 px-2',
                  index === sortedGolfers.length - 1 && 'border-r-2 border-gray-300'
                )}
              >
                {getSubtotal(golfer.id, 1, 9)}
              </td>
            ))}
          </tr>

          {/* Back Nine */}
          {Array.from({ length: 9 }, (_, i) => i + 10).map(renderHoleRow)}

          {/* In Total */}
          <tr className="bg-muted font-semibold">
            <td className="text-center py-2 px-2">In</td>
            <td className="text-center py-2 px-2">{getBackNinePar()}</td>
            <td className="text-center py-2 px-2"></td>
            {sortedGolfers.map((golfer, index) => (
              <td
                key={golfer.id}
                className={cn(
                  'text-center py-2 px-2',
                  index === sortedGolfers.length - 1 && 'border-r-2 border-gray-300'
                )}
              >
                {getSubtotal(golfer.id, 10, 18)}
              </td>
            ))}
          </tr>

          {/* Total */}
          <tr className="bg-muted font-bold">
            <td className="text-center py-2 px-2">Total</td>
            <td className="text-center py-2 px-2">{getTotalPar()}</td>
            <td className="text-center py-2 px-2"></td>
            {sortedGolfers.map((golfer, index) => (
              <td
                key={golfer.id}
                className={cn(
                  'text-center py-2 px-2',
                  index === sortedGolfers.length - 1 && 'border-r-2 border-gray-300'
                )}
              >
                {getSubtotal(golfer.id, 1, 18)}
              </td>
            ))}
          </tr>

          {/* Handicap */}
          <tr className="bg-muted">
            <td className="text-center py-2 px-2">Hdcp</td>
            <td className="text-center py-2 px-2"></td>
            <td className="text-center py-2 px-2"></td>
            {sortedGolfers.map((golfer, index) => (
              <td
                key={golfer.id}
                className={cn(
                  'text-center py-2 px-2',
                  index === sortedGolfers.length - 1 && 'border-r-2 border-gray-300'
                )}
              >
                {golfer.tournamentHandicap}
              </td>
            ))}
          </tr>

          {/* Net Score */}
          <tr className="bg-muted">
            <td className="text-center py-2 px-2">Net</td>
            <td className="text-center py-2 px-2"></td>
            <td className="text-center py-2 px-2"></td>
            {sortedGolfers.map((golfer, index) => (
              <td
                key={golfer.id}
                className={cn(
                  'text-center py-2 px-2',
                  index === sortedGolfers.length - 1 && 'border-r-2 border-gray-300'
                )}
              >
                {getNetScore(golfer.id)}
              </td>
            ))}
          </tr>

          {/* Dots */}
          <tr className="bg-muted">
            <td className="text-center py-2 px-2">Dots</td>
            <td className="text-center py-2 px-2"></td>
            <td className="text-center py-2 px-2"></td>
            {sortedGolfers.map((golfer, index) => (
              <td
                key={golfer.id}
                className={cn(
                  'text-center py-2 px-2',
                  index === sortedGolfers.length - 1 && 'border-r-2 border-gray-300'
                )}
              >
                {getTotalDots(golfer.id)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

