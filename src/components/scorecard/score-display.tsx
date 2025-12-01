import { Player } from '@/types'
import { cn } from '@/lib/utils'

interface ScoreDisplayProps {
  score: number | null
  dots: number
  dnf: boolean
  par: number
  cellSize?: number
  sandy?: boolean
  greenie?: boolean
}

export function ScoreDisplay({
  score,
  dots,
  dnf,
  par,
  cellSize = 40,
  sandy = false,
  greenie = false,
}: ScoreDisplayProps) {
  if (score === null) return null

  const getScoreColor = () => {
    if (dnf) return 'text-gray-500'
    if (score === 1) return 'text-purple-600 font-bold' // Hole in one
    if (score <= par - 2) return 'text-purple-600 font-bold' // Eagle or better
    if (score === par - 1) return 'text-red-600 font-semibold' // Birdie
    if (score === par) return 'text-gray-900' // Par
    if (score === par + 1) return 'text-blue-600' // Bogey
    if (score === par + 2) return 'text-blue-700 font-semibold' // Double bogey
    return 'text-gray-900'
  }

  return (
    <div className="relative flex items-center justify-center h-full w-full">
      {/* Score */}
      <span className={cn('text-sm', getScoreColor())}>
        {dnf ? 'DNF' : score}
      </span>

      {/* Dots */}
      {dots > 0 && (
        <span className="absolute bottom-0 right-0 text-xs font-bold text-green-600">
          {dots}
        </span>
      )}

      {/* Greenie indicator */}
      {greenie && (
        <span className="absolute top-0 left-0 text-xs" title="Greenie">
          🟢
        </span>
      )}

      {/* Sandy indicator */}
      {sandy && (
        <span className="absolute top-0 right-0 text-xs" title="Sandy">
          🏖️
        </span>
      )}
    </div>
  )
}

