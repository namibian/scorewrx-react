import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Player, Course, Tournament } from '@/types'
import {
  calculateAllSkins,
  calculatePlayerEarnings,
  calculatePotSize,
  type SkinsPoolResult,
} from '@/lib/game-logic/skins-calculation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SkinsPanelProps {
  tournament: Tournament
  course: Course
  allPlayers: Map<string, Player> // All players from all groups
}

export function SkinsPanel({
  tournament,
  course,
  allPlayers,
}: SkinsPanelProps) {
  const skinsConfig = tournament.competitions?.skins

  // Calculate skins for both pools - MUST be before early return
  const { scratch: scratchSkins, handicap: handicapSkins } = useMemo(
    () => {
      if (!skinsConfig?.enabled) {
        return { scratch: {}, handicap: {} }
      }
      return calculateAllSkins(tournament, course, allPlayers)
    },
    [tournament, course, allPlayers, skinsConfig]
  )

  // Get participants for each pool
  const scratchParticipants = useMemo(() => {
    const participants: Array<{
      playerId: string
      firstName: string
      lastName: string
    }> = []
    allPlayers.forEach((player) => {
      if (player.skinsPool === 'Scratch' || player.skinsPool === 'Both') {
        participants.push({
          playerId: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
        })
      }
    })
    return participants
  }, [allPlayers])

  const handicapParticipants = useMemo(() => {
    const participants: Array<{
      playerId: string
      firstName: string
      lastName: string
    }> = []
    allPlayers.forEach((player) => {
      if (player.skinsPool === 'Handicap' || player.skinsPool === 'Both') {
        participants.push({
          playerId: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
        })
      }
    })
    return participants
  }, [allPlayers])

  // Calculate pot sizes
  const scratchPotSize = useMemo(
    () =>
      skinsConfig?.enabled
        ? calculatePotSize(
            scratchParticipants,
            skinsConfig.scratchBuyIn ?? 5,
            skinsConfig.manualScratchPot
              ? { enabled: true, amount: skinsConfig.manualScratchPot }
              : undefined
          )
        : 0,
    [
      skinsConfig,
      scratchParticipants,
    ]
  )

  const handicapPotSize = useMemo(
    () =>
      skinsConfig?.enabled
        ? calculatePotSize(
            handicapParticipants,
            skinsConfig.handicapBuyIn ?? 5,
            skinsConfig.manualHandicapPot
              ? { enabled: true, amount: skinsConfig.manualHandicapPot }
              : undefined
          )
        : 0,
    [
      skinsConfig,
      handicapParticipants,
    ]
  )

  // Calculate earnings for each pool
  const scratchEarnings = useMemo(
    () => calculatePlayerEarnings(scratchSkins, scratchPotSize),
    [scratchSkins, scratchPotSize]
  )

  const handicapEarnings = useMemo(
    () => calculatePlayerEarnings(handicapSkins, handicapPotSize),
    [handicapSkins, handicapPotSize]
  )

  // Early return AFTER all hooks
  if (!skinsConfig?.enabled) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Skins competition not enabled
          </p>
        </CardContent>
      </Card>
    )
  }

  // Helper to render a skins pool
  const renderSkinsPool = (
    poolSkins: SkinsPoolResult,
    earnings: Map<string, number>,
    potSize: number,
    poolName: string
  ) => {
    const totalSkins = Object.values(poolSkins).reduce(
      (sum, playerSkins) => sum + (Array.isArray(playerSkins) ? playerSkins.length : 0),
      0
    )

    if (totalSkins === 0) {
      return (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No skins awarded yet
            </p>
          </CardContent>
        </Card>
      )
    }

    // Get players sorted by earnings
    const sortedPlayers = Array.from(earnings.entries())
      .map(([playerId, amount]) => {
        const player = allPlayers.get(playerId)
        const skins = poolSkins[playerId] || []
        return {
          playerId,
          player,
          amount,
          skinCount: Array.isArray(skins) ? skins.length : 0,
          skins,
        }
      })
      .filter((p) => p.skinCount > 0)
      .sort((a, b) => b.amount - a.amount)

    return (
      <div className="space-y-4">
        {/* Pot Overview */}
        <Card>
          <CardHeader>
            <CardTitle>{poolName} Skins</CardTitle>
            <CardDescription>
              Total Pot: ${potSize.toFixed(2)} • {totalSkins} Skins
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Winners */}
            <div className="space-y-2">
              {sortedPlayers.map((playerData) => (
                <div
                  key={playerData.playerId}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <div className="font-semibold">
                      {playerData.player?.shortName || 'Unknown'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {playerData.skinCount} skin
                      {playerData.skinCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${playerData.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Hole-by-hole breakdown */}
            <details className="mt-4">
              <summary className="cursor-pointer font-medium hover:underline">
                View hole-by-hole breakdown
              </summary>
              <div className="mt-2 space-y-1">
                {Array.from({ length: 18 }, (_unused, idx) => {
                  const hole = idx + 1
                  const winner = Object.entries(poolSkins).find(
                    ([_, skins]) =>
                      Array.isArray(skins) &&
                      skins.some((skin) => skin.hole === hole)
                  )

                  if (!winner) return null

                  const [winnerId, skins] = winner
                  const winnerPlayer = allPlayers.get(winnerId)
                  const skin = Array.isArray(skins)
                    ? skins.find((s) => s.hole === hole)
                    : undefined

                  return (
                    <div
                      key={hole}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <span className="font-medium">Hole {hole}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {winnerPlayer?.shortName || 'Unknown'}
                        </span>
                        {skin && (
                          <Badge variant="outline">
                            Score: {skin.score}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasScratchSkins = scratchParticipants.length > 0
  const hasHandicapSkins = handicapParticipants.length > 0

  if (!hasScratchSkins && !hasHandicapSkins) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No players in skins pools
          </p>
        </CardContent>
      </Card>
    )
  }

  // If only one pool, show it directly
  if (hasScratchSkins && !hasHandicapSkins) {
    return renderSkinsPool(scratchSkins, scratchEarnings, scratchPotSize, 'Scratch')
  }

  if (hasHandicapSkins && !hasScratchSkins) {
    return renderSkinsPool(
      handicapSkins,
      handicapEarnings,
      handicapPotSize,
      'Handicap'
    )
  }

  // Both pools exist - show tabs
  return (
    <Tabs defaultValue="scratch" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="scratch">Scratch</TabsTrigger>
        <TabsTrigger value="handicap">Handicap</TabsTrigger>
      </TabsList>

      <TabsContent value="scratch">
        {renderSkinsPool(scratchSkins, scratchEarnings, scratchPotSize, 'Scratch')}
      </TabsContent>

      <TabsContent value="handicap">
        {renderSkinsPool(
          handicapSkins,
          handicapEarnings,
          handicapPotSize,
          'Handicap'
        )}
      </TabsContent>
    </Tabs>
  )
}

