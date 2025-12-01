import { Player } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CartPositionSelect } from './cart-position-select'

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

interface CartAssignmentsProps {
  value: CartPositions
  players: Player[]
  disabled?: boolean
  onChange: (positions: CartPositions) => void
}

export function CartAssignments({
  value,
  players,
  disabled = false,
  onChange,
}: CartAssignmentsProps) {
  const isPlayerAssigned = (playerId: string): boolean => {
    return (
      value.cart1.driver?.id === playerId ||
      value.cart1.rider?.id === playerId ||
      value.cart2.driver?.id === playerId ||
      value.cart2.rider?.id === playerId
    )
  }

  const assignPosition = (
    player: Player | null,
    cart: 'cart1' | 'cart2',
    position: 'driver' | 'rider'
  ) => {
    onChange({
      ...value,
      [cart]: {
        ...value[cart],
        [position]: player,
      },
    })
  }

  return (
    <div className="space-y-4 pl-6 mt-2">
      <div className="text-sm font-medium">Cart Assignments</div>
      <div className="space-y-4">
        {/* Cart 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cart 1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CartPositionSelect
              value={value.cart1.driver}
              players={players}
              position="driver"
              cartId="cart1"
              isPlayerAssigned={isPlayerAssigned}
              disabled={disabled}
              onChange={(player) => assignPosition(player, 'cart1', 'driver')}
            />
            <CartPositionSelect
              value={value.cart1.rider}
              players={players}
              position="rider"
              cartId="cart1"
              isPlayerAssigned={isPlayerAssigned}
              disabled={disabled}
              onChange={(player) => assignPosition(player, 'cart1', 'rider')}
            />
          </CardContent>
        </Card>

        {/* Cart 2 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cart 2</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CartPositionSelect
              value={value.cart2.driver}
              players={players}
              position="driver"
              cartId="cart2"
              isPlayerAssigned={isPlayerAssigned}
              disabled={disabled}
              onChange={(player) => assignPosition(player, 'cart2', 'driver')}
            />
            <CartPositionSelect
              value={value.cart2.rider}
              players={players}
              position="rider"
              cartId="cart2"
              isPlayerAssigned={isPlayerAssigned}
              disabled={disabled}
              onChange={(player) => assignPosition(player, 'cart2', 'rider')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

