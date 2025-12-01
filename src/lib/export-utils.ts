import type { Tournament, Group, Course } from '@/types'

interface ExportData {
  tournament: Tournament
  groups: Group[]
  course: Course
}

interface PlayerScore {
  Name: string
  Hdcp: number
  [key: number]: string | number // Hole numbers 1-18, Out, In, Total
  Out: number
  In: number
  Total: number
}

/**
 * Export tournament to CSV - EXACT implementation from Vue project
 * This exports player scores with handicap-adjusted scores based on max score rules
 */
export const exportTournamentToCSV = async (data: ExportData): Promise<void> => {
  const { tournament, groups, course } = data

  if (!course || !course.teeboxes || !course.teeboxes[0] || !course.teeboxes[0].holes) {
    console.error('Course data not found')
    throw new Error('Course data not found')
  }

  const holes = course.teeboxes[0].holes
  const playerScores: PlayerScore[] = []

  // Process each group in the tournament
  groups.forEach((group) => {
    if (!group.players) return

    group.players.forEach((player) => {
      // Get scores from the player's score array
      const scores = Array.isArray(player.score) ? player.score : Array(18).fill(null)

      // Adjust scores based on handicap rules
      const adjustedScores = scores.map((score, index) => {
        if (score === null) return null

        const hole = holes[index]
        const holePar = hole.par
        const holeHdcp = hole.handicap
        const playerHandicap = player.tournamentHandicap || 0

        // If player's tournament handicap is less than the hole handicap
        // max score is par + 2
        // If player's tournament handicap is greater than or equal to the hole handicap
        // max score is par + 3
        const maxScore = playerHandicap < holeHdcp ? holePar + 2 : holePar + 3

        return score > maxScore ? maxScore : score
      })

      // Calculate Out (first 9 holes) and In (last 9 holes) totals using adjusted scores
      const outScore = adjustedScores.slice(0, 9).reduce((sum, score) => sum + (score || 0), 0)
      const inScore = adjustedScores.slice(9, 18).reduce((sum, score) => sum + (score || 0), 0)

      // Create a row with the player's name and adjusted scores
      const row: any = {
        Name: player.shortName || `${player.firstName} ${player.lastName}` || 'Unknown Player',
        Hdcp: player.tournamentHandicap || 0
      }

      // Add holes 1-9
      for (let i = 0; i < 9; i++) {
        row[i + 1] = adjustedScores[i] === null ? '' : adjustedScores[i]
      }

      // Out total
      row.Out = outScore

      // Add holes 10-18
      for (let i = 9; i < 18; i++) {
        row[i + 1] = adjustedScores[i] === null ? '' : adjustedScores[i]
      }

      // In total
      row.In = inScore

      // Final total
      row.Total = outScore + inScore

      playerScores.push(row as PlayerScore)
    })
  })

  if (playerScores.length === 0) {
    console.error('No player scores found to export')
    throw new Error('No player scores found to export')
  }

  // Create headers array: Name, Hdcp, 1-9, Out, 10-18, In, Total
  const headers = [
    'Name',
    'Hdcp',
    ...Array.from({ length: 9 }, (_, i) => i + 1),
    'Out',
    ...Array.from({ length: 9 }, (_, i) => i + 10),
    'In',
    'Total'
  ]

  // Convert to CSV
  const csvContent = [
    headers.join(','),
    ...playerScores.map((row) => headers.map((header) => row[header as keyof PlayerScore]).join(','))
  ].join('\n')

  // Create and download the file
  const fileName = `ScoreWRX-scores-${tournament.date}.csv`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Check if a tournament can be exported
 * Exact logic from Vue project
 */
export const canExportTournament = (tournament: Tournament): boolean => {
  // First check if we have groups and players
  if (!tournament.groups || tournament.groups.length === 0) {
    return false
  }

  // Check if all players in all groups have scores for all 18 holes
  let allScoresComplete = true
  for (const group of tournament.groups) {
    if (!group.players) {
      allScoresComplete = false
      break
    }

    for (const player of group.players) {
      // Check if player has a score array
      if (!Array.isArray(player.score)) {
        allScoresComplete = false
        break
      }

      // Check if all 18 holes have a score or are marked as DNF
      for (let i = 0; i < 18; i++) {
        const score = player.score[i]
        const isDNF = player.dnf && player.dnf[i]

        if ((score === null || score === undefined) && !isDNF) {
          allScoresComplete = false
          break
        }
      }

      if (!allScoresComplete) break
    }

    if (!allScoresComplete) break
  }

  // If all scores are complete, allow export regardless of date
  if (allScoresComplete) {
    return true
  }

  // For past tournaments without complete scores, still allow export
  // (e.g., incomplete tournaments from the past)
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Start of today

  const tournamentDate = new Date(tournament.date + 'T12:00:00') // Add time to ensure correct timezone
  const dayAfterTournament = new Date(tournamentDate)
  dayAfterTournament.setDate(dayAfterTournament.getDate() + 1)
  dayAfterTournament.setHours(0, 0, 0, 0) // Start of day after tournament

  // If it's past the tournament day, allow export even if incomplete
  return now >= dayAfterTournament
}

