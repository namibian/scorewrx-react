import { Player } from '@/types'
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
    <div className="space-y-6">
      {/* Cart 1 */}
      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
        <h4 className="text-base font-semibold text-neutral-900 text-left mb-4">Cart 1</h4>
        <div className="space-y-4">
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
        </div>
      </div>

      {/* Cart 2 */}
      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
        <h4 className="text-base font-semibold text-neutral-900 text-left mb-4">Cart 2</h4>
        <div className="space-y-4">
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
        </div>
      </div>
    </div>
  )
}

