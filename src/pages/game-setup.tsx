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
      <div className="min-h-screen bg-white">
        <header className="bg-emerald-700 text-white px-4 py-5">
          <h1 className="text-center text-lg font-medium tracking-wide">Game Setup</h1>
        </header>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-600" />
            <p className="text-base text-neutral-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <header className="bg-emerald-700 text-white px-4 py-5">
          <h1 className="text-center text-lg font-medium tracking-wide">Game Setup</h1>
        </header>
        <div className="p-4 max-w-lg mx-auto mt-6">
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const validation = validateGameSetup()
  const groupNumber = tournamentsStore.tournaments
    .find((t) => t.id === tournamentId)
    ?.groups?.find((g) => g.id === groupId)?.number

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Clean Header */}
      <header className="bg-emerald-700 text-white px-4 py-5 sticky top-0 z-10">
        <h1 className="text-center text-lg font-medium tracking-wide">
          Game Setup — Group {groupNumber}
        </h1>
      </header>

      {/* Saving Overlay */}
      {saving && (
        <div className="fixed inset-0 bg-white/95 flex items-center justify-center z-50">
          <div className="text-center px-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-600" />
            <p className="text-lg font-medium text-neutral-900">Saving settings...</p>
            <p className="text-sm text-neutral-500 mt-1">Please wait</p>
          </div>
        </div>
      )}

      {/* Main Content - Clean cards */}
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4 pb-24">
        {/* Step 1: Pool Selection */}
        {currentStep >= 1 && (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="text-base font-semibold text-neutral-900">
                1. Pool Selection
              </h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                Select skins pool for each player
              </p>
            </div>
            <div className="p-5">
              <PlayerList
                players={players}
                skinsPoolOptions={SKINS_POOL_OPTIONS}
                disabled={saving}
                onUpdatePlayer={updatePlayer}
              />
              {currentStep === 1 && (
                <div className="mt-5">
                  <Button 
                    onClick={() => setCurrentStep(2)} 
                    className="w-full h-14 text-base font-medium bg-emerald-600 hover:bg-emerald-700"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Cart Assignments */}
        {currentStep >= 2 && (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="text-base font-semibold text-neutral-900">
                2. Cart Assignments
              </h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                Assign players to carts
              </p>
            </div>
            <div className="p-5">
              {players.length === 4 && games.sixes.enabled ? (
                <CartAssignments
                  value={cartPositions}
                  players={players}
                  disabled={saving}
                  onChange={setCartPositions}
                />
              ) : (
                <div className="p-4 bg-neutral-50 rounded-lg text-center">
                  <p className="text-sm text-neutral-600">
                    Cart assignments only needed for 4-player Sixes games
                  </p>
                </div>
              )}
              {currentStep === 2 && (
                <div className="mt-5 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 h-14 text-base font-medium border-neutral-300"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(3)} 
                    className="flex-1 h-14 text-base font-medium bg-emerald-600 hover:bg-emerald-700"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Game Selection */}
        {currentStep >= 3 && (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="text-base font-semibold text-neutral-900">
                3. Game Selection
              </h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                Configure your games
              </p>
            </div>
            <div className="p-5 space-y-4">
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
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700 font-medium">{validation.error}</p>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 h-14 text-base font-medium border-neutral-300"
                >
                  Back
                </Button>
                <Button
                  onClick={saveGameSetup}
                  disabled={!validation.isValid || saving}
                  className="flex-1 h-14 text-base font-medium bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save & Start'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

