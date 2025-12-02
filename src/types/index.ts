// ============================================
// USER & AUTHENTICATION TYPES
// ============================================

export interface User {
  uid: string
  email: string | null
}

export interface UserProfile {
  email: string
  affiliation: string
  firstName?: string
  lastName?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================
// PLAYER TYPES
// ============================================

export interface StrokeHoles {
  sixes?: {
    firstGame: number[]
    secondGame: number[]
    thirdGame: number[]
  }
  nines?: number[]
  dots?: number[]
  nassau?: number[]
}

export interface Player {
  id: string
  firstName: string
  lastName: string
  shortName: string
  email?: string
  handicapIndex: number
  tournamentHandicap: number
  skinsPool: 'None' | 'Scratch' | 'Handicap' | 'Both'
  affiliation: string
  groupId?: string // Group ID for leaderboard tracking
  
  // Scoring data (18 elements each)
  score: (number | null)[]
  dots: number[]
  dnf: boolean[]
  greenies: number[]
  sandies: number[]
  
  // Cart assignments (for Sixes game)
  cart?: '1' | '2'
  position?: 'driver' | 'rider'
  
  // CRITICAL: Stroke allocations (IMMUTABLE after game setup)
  readonly strokeHoles?: Readonly<StrokeHoles>
  
  // Verifier data
  verifierScore?: (number | null)[]
  verifierDots?: number[]
  verifierDnf?: boolean[]
  verifierGreenies?: number[]
  verifierSandies?: number[]
  
  // Metadata
  createdBy?: string
  creatorEmail?: string
  createdAt?: Date
  lastUpdated?: Date
}

// ============================================
// GAME SETTINGS TYPES
// ============================================

export interface SixesSettings {
  enabled: boolean
  amountPerGame: number
  useDifferentialHandicap: boolean
  distributeStrokesEvenly: boolean
  use2PointsPerGame: boolean
}

export interface NinesSettings {
  enabled: boolean
  amountPerPoint: number
  useDifferentialHandicap: boolean
}

export interface NassauSettings {
  enabled: boolean
  amountPerGame: number
  automaticPresses: boolean
  matchType: 'all' | 'frontback' | 'overall'
}

export interface DotsParticipant {
  playerId: string
  selected: boolean
}

export interface DotsSettings {
  enabled: boolean
  amountPerDot: number
  useDifferentialHandicap: boolean
  trackGreenies: boolean
  trackSandies: boolean
  participants: string[]  // Array of player IDs who are selected
}

export interface GameSettings {
  sixes?: SixesSettings
  nines?: NinesSettings
  nassau?: NassauSettings
  dots?: DotsSettings
}

// ============================================
// GROUP TYPES
// ============================================

export interface Group {
  id: string
  number: number
  index: number
  startingTee: number
  teeTime: string
  scorerId: string
  verifierId?: string | null
  verificationStatus: (string | null)[]
  lastUpdated: Date
  gameSettings: GameSettings | null
  players: Player[]
  par3ScoreLog?: Par3ScoreLogEntry[]
  eventLog?: EventLogEntry[]
}

export interface Par3ScoreLogEntry {
  timestamp: Date
  scorerFirstName: string
  hole: number
  par: number
  playerLogs: Record<string, {
    firstName: string
    score: number | null
    greenieToggle: boolean
    sandyToggle: boolean
    dnfToggle: boolean
    dotsAssigned: string
    calculatedDots: number
    carryOverApplied?: number
  }>
}

export interface EventLogEntry {
  timestamp: Date
  type: string
  data: any
}

// ============================================
// TOURNAMENT TYPES
// ============================================

export interface ParticipantInfo {
  id: string
  firstName: string
  lastName: string
}

export interface RegisteredPlayer {
  playerId: string
  firstName: string
  lastName: string
  email: string
  handicapIndex: number
  status: 'accepted' | 'declined'
  registeredAt: Date
}

export interface WaitingListPlayer {
  playerId: string
  firstName: string
  lastName: string
  email: string
  handicapIndex: number
  addedAt: Date
}

export interface SkinsCompetition {
  enabled: boolean
  scratchBuyIn: number
  handicapBuyIn: number
  useHalfStrokeOnPar3: boolean
  scratchParticipants?: ParticipantInfo[]
  handicapParticipants?: ParticipantInfo[]
  manualScratchPot?: number
  manualHandicapPot?: number
}

export interface ClosestToPinCompetition {
  enabled: boolean
  holes: number[]
  buyIn: number
}

export interface LongDriveCompetition {
  enabled: boolean
  holes: number[]
  buyIn: number
}

export interface Competitions {
  skins?: SkinsCompetition
  closestToPin?: ClosestToPinCompetition
  longDrive?: LongDriveCompetition
}

export interface ShotgunStartConfig {
  enabled: boolean
  startTime: string
}

export interface Tournament {
  id: string
  name: string
  date: Date | string
  course: string // Course ID
  courseId?: string // Alias for backward compatibility
  affiliation: string
  
  // Shotgun start configuration
  shotgunStart: boolean | ShotgunStartConfig // Support both formats
  shotgunStartTime?: string // Deprecated - use shotgunStart.startTime
  teeTimeInterval?: number
  defaultStartingTee?: 1 | 10
  
  // Tournament configuration
  playType?: 'Stroke Play' | 'Match Play'
  scoringFormat?: 'Individual' | 'Team'
  handicapFormat?: 'Custom' | 'Standard'
  
  state: 'Created' | 'Open' | 'Active' | 'Archived'
  code: string
  createdBy: string
  createdAt: Date
  lastUpdated: Date
  
  // Registration
  useOnlineRegistration?: boolean
  maxRegistrations?: number | null
  registeredPlayers?: RegisteredPlayer[]
  waitingList?: WaitingListPlayer[]
  
  // Competitions
  competitions?: Competitions
  
  // Groups (loaded separately)
  groups?: Group[]
  
  // Code tracking
  codeSentBy?: string
  codeSentByName?: string
  codeSentAt?: Date
}

// ============================================
// COURSE TYPES
// ============================================

export interface Hole {
  par: 3 | 4 | 5
  handicap: number // 1-18
  yardage?: number
}

export interface Teebox {
  name: string
  color?: string
  rating?: number
  slope?: number
  yardage?: number
  holes: Hole[]
}

export interface Course {
  id: string
  name: string
  affiliation: string
  address?: string
  telephone?: string
  location?: string // Alias for address (backwards compatibility)
  description?: string
  createdBy: string
  createdAt: Date
  lastUpdated: Date
  teeboxes: Teebox[]
}

// ============================================
// SCORING TYPES
// ============================================

export interface ScoreData {
  score: number | null
  dots: number
  dnf: boolean
  greenieToggle?: boolean
  sandyToggle?: boolean
  greenies?: number[]
  sandies?: number[]
  carryOverApplied?: number
}

export interface ScoreUpdate {
  playerId: string
  hole: number
  scoreData: ScoreData
}

// ============================================
// GAME RESULT TYPES
// ============================================

export interface SixesGameResult {
  gameNumber: 1 | 2 | 3
  team1Players: Player[]
  team2Players: Player[]
  team1Points: number
  team2Points: number
  winner: 'team1' | 'team2' | 'tie'
}

export interface NinesGameResult {
  playerId: string
  totalPoints: number
  pointsByHole: number[]
}

export interface NassauMatchResult {
  player1Id: string
  player2Id: string
  frontNine: number
  backNine: number
  overall: number
}

export interface DotsResult {
  playerId: string
  totalDots: number
  dotsByHole: number[]
  greenies: number[]
  sandies: number[]
}

// ============================================
// UTILITY TYPES
// ============================================

export type HandicapFormat = 'Custom' | 'Standard'

export interface LeaderboardEntry {
  player: Player
  totalScore: number
  holesPlayed: number
  relativeToPar: number
  back9Score: number
  last6Score: number
}

