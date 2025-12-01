import type { Player, Group } from '@/types'

// CSV Headers
const CSV_HEADERS = [
  'Group Number',
  'Player Name',
  'Tournament Handicap',
  'Tee Time',
  'Starting Tee',
]

export function generateTemplateCSV(): string {
  // Start with headers
  let csvContent = CSV_HEADERS.join(',') + '\n'

  // Add sample row with instructions
  csvContent += '1,John Doe,10,07:30,1\n'

  return csvContent
}

// Calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  // Normalize strings: lowercase and remove extra spaces
  str1 = str1.toLowerCase().trim()
  str2 = str2.toLowerCase().trim()

  // If strings are equal after normalization, return 1
  if (str1 === str2) return 1

  // Split into words to handle name parts separately
  const words1 = str1.split(' ')
  const words2 = str2.split(' ')

  // Try matching individual words
  let maxWordMatches = 0
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2) maxWordMatches++
      // Also check if one is contained in the other (for shortened names)
      else if (word1.includes(word2) || word2.includes(word1)) {
        maxWordMatches += 0.8 // 80% match for partial word matches
      }
    }
  }

  // Calculate word match score (0 to 1)
  const wordMatchScore = maxWordMatches / Math.max(words1.length, words2.length)

  // Calculate character-based similarity for additional precision
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  // Count matching characters
  let matches = 0
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++
  }

  // Calculate character match score (0 to 1)
  const charMatchScore = matches / longer.length

  // Combine word and character scores, giving more weight to word matches
  return wordMatchScore * 0.7 + charMatchScore * 0.3
}

// Function to find best matching player
function findBestMatch(playerName: string, allPlayers: Player[]): Player | null {
  const matches = allPlayers.map((player) => {
    const fullName = `${player.firstName} ${player.lastName}`
    const similarityScore = Math.max(
      calculateSimilarity(playerName, fullName),
      calculateSimilarity(playerName, player.shortName || ''),
    )
    return {
      player,
      similarity: similarityScore,
      fullName,
    }
  })

  // Sort by similarity score
  matches.sort((a, b) => b.similarity - a.similarity)

  // If best match is below 0.4, it's likely a missing player
  if (matches[0].similarity < 0.4) {
    return null
  }

  // Return best match if similarity is above threshold (0.5 or 50% similar)
  return matches[0].similarity > 0.5 ? matches[0].player : null
}

// Format time to ensure it's in HH:mm format
function formatTime(timeStr: string): string {
  // If time is already in correct format, return as is
  if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
    return timeStr
  }

  // Parse hours and minutes
  const [hours, minutes] = timeStr.split(':').map(Number)

  // Add leading zeros and ensure 24-hour format
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export interface UnmatchedPlayer {
  name: string
  row: number
  groupNumber: number
  handicap: number
  teeTime: string
  startingTee: number
}

export interface ParsedGroup {
  number: number
  teeTime: string
  startingTee: number
  players: Player[]
}

export function parseGroupsCSV(csvContent: string, allPlayers: Player[]): ParsedGroup[] {
  // Split content into lines and remove empty lines
  const lines = csvContent.split('\n').filter((line) => line.trim())

  // Parse headers (first line)
  const headers = lines[0].split(',').map((header) => header.trim())

  // Expected headers
  const expectedHeaders = [
    'Group Number',
    'Player Name',
    'Tournament Handicap',
    'Tee Time',
    'Starting Tee',
  ]

  // Check if headers match expected format
  const headerCheck = headers.map((header) => ({
    found: header,
    expected: expectedHeaders.find((h) => h === header),
    valid: expectedHeaders.includes(header),
  }))

  if (!headerCheck.every((h) => h.valid)) {
    throw new Error('Invalid CSV format. Headers do not match expected format.')
  }

  // Process each line
  const groups: ParsedGroup[] = []
  const unmatchedPlayers: UnmatchedPlayer[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const values = line.split(',').map((v) => v.trim())
    const groupNumber = parseInt(values[0])
    const playerName = values[1]
    const handicap = parseInt(values[2])
    const teeTime = formatTime(values[3]) // Format time before using
    const startingTee = parseInt(values[4])

    // Find matching player
    const matchedPlayer = findBestMatch(playerName, allPlayers)

    if (!matchedPlayer) {
      unmatchedPlayers.push({
        name: playerName,
        row: i + 1,
        groupNumber,
        handicap,
        teeTime,
        startingTee,
      })
      continue
    }

    // Add to groups array
    const group = groups.find((g) => g.number === groupNumber) || {
      number: groupNumber,
      teeTime,
      startingTee,
      players: [],
    }

    const playerData: Player = {
      ...matchedPlayer,
      tournamentHandicap: handicap,
      skinsPool: matchedPlayer.skinsPool || 'None',
      score: Array(18).fill(null),
      dots: Array(18).fill(0),
      dnf: Array(18).fill(false),
      greenies: [],
      sandies: [],
    }

    group.players.push(playerData)

    if (!groups.includes(group)) {
      groups.push(group)
    }
  }

  if (unmatchedPlayers.length > 0) {
    const error = new Error('Some players could not be matched') as any
    error.type = 'UNMATCHED_PLAYERS'
    error.unmatchedPlayers = unmatchedPlayers
    throw error
  }

  return groups
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  // Create download link
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}


