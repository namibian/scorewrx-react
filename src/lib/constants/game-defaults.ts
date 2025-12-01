// Game constants - these match the Vue/Quasar implementation exactly
export const MAX_STROKES = 18
export const HOLES_PER_GAME = 6
export const TOTAL_GAMES = 3
export const MINIMUM_PLAYERS_SIXES = 4
export const MINIMUM_PLAYERS_NINES = 3
export const DEFAULT_AMOUNT = 5.0
export const DEFAULT_DOTS_AMOUNT = 1.0

// Default settings for sixes game
export const DEFAULT_SIXES_SETTINGS = {
  enabled: false,
  amountPerGame: DEFAULT_AMOUNT,
  useDifferentialHandicap: true,
  distributeStrokesEvenly: true,
  use2PointsPerGame: true,
}

// Default settings for dots game
export const DEFAULT_DOTS_SETTINGS = {
  enabled: true,
  amountPerDot: DEFAULT_DOTS_AMOUNT,
  useDifferentialHandicap: true,
  trackGreenies: true,
  trackSandies: true,
  participants: [] as string[],
}

// Default settings for nines game
export const DEFAULT_NINES_SETTINGS = {
  enabled: false,
  amountPerPoint: 0.5,
  useDifferentialHandicap: true,
}

// Default settings for Nassau game
export const DEFAULT_NASSAU_SETTINGS = {
  enabled: false,
  amountPerGame: 5.0,
  automaticPresses: false,
  matchType: 'all' as const, // 'all' | 'frontback' | 'overall'
}

export const CART_POSITIONS = {
  DRIVER: 'driver',
  RIDER: 'rider',
} as const

export const TEAM_COMBINATIONS = [
  {
    id: 'carts',
    label: 'Carts',
    description: 'Driver/Rider Same Cart',
  },
  {
    id: 'cross',
    label: 'Cross Cart',
    description: 'Driver/Rider Cross Cart',
  },
  {
    id: 'positions',
    label: 'Positions',
    description: 'Drivers vs Riders',
  },
] as const

