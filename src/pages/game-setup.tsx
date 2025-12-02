import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { useCoursesStore } from '@/stores/courses-store'
import {
  Player,
  Course,
} from '@/types'
import {
  DEFAULT_SIXES_SETTINGS,
  DEFAULT_NINES_SETTINGS,
  DEFAULT_NASSAU_SETTINGS,
  DEFAULT_DOTS_SETTINGS,
  MINIMUM_PLAYERS_SIXES,
  MINIMUM_PLAYERS_NINES,
} from '@/lib/constants/game-defaults'
import { PlayerList } from '@/components/game-setup/player-list'
import { CartAssignments } from '@/components/game-setup/cart-assignments'
import { SixesSetup } from '@/components/game-setup/sixes-setup'
import { NinesSetup } from '@/components/game-setup/nines-setup'
import { NassauSetup } from '@/components/game-setup/nassau-setup'
import { DotsSetup } from '@/components/game-setup/dots-setup'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

const SKINS_POOL_OPTIONS = ['None', 'Both', 'Handicap', 'Scratch']

interface CartPositions {
  cart1: {
    driver: Player | null
    rider: Player | null
  }
  cart2: {
    driver: Player | null
    rider: Player | null
  }
}

export default function GameSetupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { tournamentId, groupId, playerId } = useParams<{
    tournamentId: string
    groupId: string
    playerId: string
  }>()

  const tournamentsStore = useTournamentsStore()
  const coursesStore = useCoursesStore()
  
  // Preserve debug mode through navigation
  const debugParam = searchParams.get('debug') === 'true' ? '?debug=true' : ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  const [players, setPlayers] = useState<Player[]>([])
  const [courseData, setCourseData] = useState<Course | null>(null)

  const [games, setGames] = useState({
    sixes: { ...DEFAULT_SIXES_SETTINGS },
    nines: { ...DEFAULT_NINES_SETTINGS },
    nassau: { ...DEFAULT_NASSAU_SETTINGS },
    dots: { ...DEFAULT_DOTS_SETTINGS },
  })

  const [cartPositions, setCartPositions] = useState<CartPositions>({
    cart1: { driver: null, rider: null },
    cart2: { driver: null, rider: null },
  })

  // Load tournament and course data
  useEffect(() => {
    const loadData = async () => {
      if (!tournamentId || !groupId) return

      setLoading(true)
      setError(null)

      try {
        const tournament = await tournamentsStore.getTournament(tournamentId)
        if (!tournament) {
          throw new Error('Tournament not found')
        }

        const group = tournament.groups?.find((g) => g.id === groupId)
        if (!group) {
          throw new Error('Group not found')
        }

        // Initialize players
        setPlayers(
          group.players.map((player) => ({
            ...player,
            score: player.score || Array(18).fill(null),
            dots: player.dots || Array(18).fill(0),
            dnf: player.dnf || Array(18).fill(false),
            greenies: player.greenies || [],
            sandies: player.sandies || [],
            cart: player.cart || '',
            position: player.position || '',
            skinsPool: player.skinsPool || 'None',
          }))
        )

        // Initialize cart positions
        const existingCartPositions: CartPositions = {
          cart1: { driver: null, rider: null },
          cart2: { driver: null, rider: null },
        }
        group.players.forEach((player) => {
          if (player.cart && player.position) {
            const cartKey = `cart${player.cart}` as 'cart1' | 'cart2'
            const posKey = player.position as 'driver' | 'rider'
            existingCartPositions[cartKey][posKey] = player
          }
        })
        setCartPositions(existingCartPositions)

        // Initialize game settings
        const existingSettings = group.gameSettings || {}
        const playerCount = group.players.length

        setGames({
          sixes: {
            ...DEFAULT_SIXES_SETTINGS,
            ...existingSettings.sixes,
            enabled:
              playerCount === MINIMUM_PLAYERS_SIXES &&
              (existingSettings.sixes?.enabled ?? true),
          },
          nines: {
            ...DEFAULT_NINES_SETTINGS,
            ...existingSettings.nines,
            enabled:
              playerCount === MINIMUM_PLAYERS_NINES &&
              (existingSettings.nines?.enabled ?? true),
          },
          nassau: {
            ...DEFAULT_NASSAU_SETTINGS,
            ...existingSettings.nassau,
            enabled: playerCount === 2 && (existingSettings.nassau?.enabled ?? true),
          },
          dots: {
            ...DEFAULT_DOTS_SETTINGS,
            ...existingSettings.dots,
            enabled: existingSettings.dots?.enabled ?? true,
          },
        })

        // Load course data
        if (tournament.courseId) {
          const course = await coursesStore.getCourse(tournament.courseId)
          setCourseData(course)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [tournamentId, groupId, tournamentsStore, coursesStore])

  const updatePlayer = (playerId: string, field: string, value: any) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === playerId ? { ...player, [field]: value } : player
      )
    )
  }

  const validateGameSetup = (): { isValid: boolean; error: string | null } => {
    if (!players.length) {
      return { isValid: false, error: 'No players available' }
    }

    // Check if any game is enabled
    if (
      !games.sixes.enabled &&
      !games.nines.enabled &&
      !games.dots.enabled &&
      !games.nassau.enabled
    ) {
      return { isValid: false, error: 'At least one game type must be enabled' }
    }

    // Check cart assignments only if Sixes game is enabled
    if (games.sixes.enabled) {
      const hasAllPositions =
        cartPositions.cart1.driver &&
        cartPositions.cart1.rider &&
        cartPositions.cart2.driver &&
        cartPositions.cart2.rider
      if (!hasAllPositions) {
        return { isValid: false, error: 'All cart positions must be assigned for Sixes' }
      }
    }

    // Check dots game setup
    if (games.dots.enabled && games.dots.participants.length < 2) {
      return {
        isValid: false,
        error: 'Dots game requires at least 2 participants',
      }
    }

    // Check player handicaps
    const hasInvalidHandicaps = players.some(
      (player) =>
        player.tournamentHandicap === null ||
        player.tournamentHandicap === undefined ||
        player.tournamentHandicap < -10 ||
        player.tournamentHandicap > 50
    )

    if (hasInvalidHandicaps) {
      return {
        isValid: false,
        error: 'All players must have valid handicaps (-10 to 50)',
      }
    }

    return { isValid: true, error: null }
  }

  const saveGameSetup = async () => {
    if (!tournamentId || !groupId || !playerId) return

    setSaving(true)

    try {
      const validation = validateGameSetup()
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid game setup')
      }

      if (!courseData) {
        throw new Error('Course data is required for game setup. Please try again.')
      }

      // TODO: Calculate stroke holes for each player
      // This will require implementing the stroke calculation logic
      // For now, we'll save without stroke calculation

      const finalPlayers = players.map((player) => ({
        ...player,
        cart: games.sixes.enabled ? player.cart || null : null,
        position: games.sixes.enabled ? player.position || null : null,
        skinsPool: player.skinsPool || 'None',
        score: Array(18).fill(null),
        dots: Array(18).fill(0),
        dnf: Array(18).fill(false),
        greenies: [],
        sandies: [],
      }))

      // Save game settings and navigate to scorecard
      await tournamentsStore.saveGameSetup({
        tournamentId,
        groupId,
        gameSettings: {
          sixes: games.sixes.enabled ? games.sixes : undefined,
          nines: games.nines.enabled ? games.nines : undefined,
          nassau: games.nassau.enabled ? games.nassau : undefined,
          dots: games.dots.enabled ? games.dots : undefined,
        },
        players: finalPlayers,
        scorerId: playerId,
      })

      // Check if we're in the /scoring flow or the legacy flow
      const isInScoringFlow = window.location.pathname.startsWith('/scoring/')
      if (isInScoringFlow) {
        navigate(`/scoring/scorecard/${tournamentId}/${playerId}/${groupId}${debugParam}`)
      } else {
        navigate(`/tournament/${tournamentId}/group/${groupId}/player/${playerId}/scorecard`)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save game setup')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const validation = validateGameSetup()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10">
        <h1 className="text-center text-xl font-semibold">
          Game Setup - Group{' '}
          {
            tournamentsStore.tournaments
              .find((t) => t.id === tournamentId)
              ?.groups?.find((g) => g.id === groupId)?.number
          }
        </h1>
      </header>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto p-4 space-y-6 pb-24">
        {saving && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="text-center bg-card p-6 rounded-lg shadow-lg">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Saving game settings...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Please wait while we save your settings
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Pool Selection */}
        {currentStep >= 1 && (
          <Card>
            <CardHeader>
              <CardTitle>1. Pool Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Select skins pool participation for each player
              </div>
              <PlayerList
                players={players}
                skinsPoolOptions={SKINS_POOL_OPTIONS}
                disabled={saving}
                onUpdatePlayer={updatePlayer}
              />
              {currentStep === 1 && (
                <div className="mt-4">
                  <Button onClick={() => setCurrentStep(2)} className="w-full" size="lg">
                    Continue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Cart Assignments */}
        {currentStep >= 2 && (
          <Card>
            <CardHeader>
              <CardTitle>2. Cart Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Assign players to carts
              </div>
              {players.length === 4 && games.sixes.enabled ? (
                <CartAssignments
                  value={cartPositions}
                  players={players}
                  disabled={saving}
                  onChange={setCartPositions}
                />
              ) : (
                <Alert>
                  <AlertDescription>
                    Cart assignments are only needed for 4-player Sixes games
                  </AlertDescription>
                </Alert>
              )}
              {currentStep === 2 && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                    size="lg"
                  >
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)} className="flex-1" size="lg">
                    Continue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Game Selection */}
        {currentStep >= 3 && (
          <Card>
            <CardHeader>
              <CardTitle>3. Game Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Select games and configure settings
              </div>

              {/* Sixes Game */}
              <SixesSetup
                value={games.sixes}
                players={players}
                courseData={courseData}
                saving={saving}
                disabled={players.length !== 4}
                onChange={(settings) => setGames((prev) => ({ ...prev, sixes: settings }))}
              />

              {/* Nines Game */}
              <NinesSetup
                value={games.nines}
                players={players}
                saving={saving}
                disabled={players.length !== 3}
                onChange={(settings) => setGames((prev) => ({ ...prev, nines: settings }))}
              />

              {/* Nassau Game */}
              <NassauSetup
                value={games.nassau}
                players={players}
                saving={saving}
                disabled={players.length !== 2}
                onChange={(settings) => setGames((prev) => ({ ...prev, nassau: settings }))}
              />

              {/* Dots Game */}
              <DotsSetup
                value={games.dots}
                players={players}
                courseData={courseData}
                saving={saving}
                onChange={(settings) => setGames((prev) => ({ ...prev, dots: settings }))}
              />

              {!validation.isValid && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{validation.error}</AlertDescription>
                </Alert>
              )}

              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1"
                  size="lg"
                >
                  Back
                </Button>
                <Button
                  onClick={saveGameSetup}
                  disabled={!validation.isValid || saving}
                  className="flex-1"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save & Continue'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

