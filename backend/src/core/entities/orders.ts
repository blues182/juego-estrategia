import type { Army, ArmyOrder } from "./army";

/**
 * Sistema de órdenes: permite a los jugadores mandar ejércitos.
 * Las órdenes se ejecutan durante el tick.
 */

/**
 * Asigna una orden a un ejército
 */
export function setArmyOrder(army: Army, order: ArmyOrder): void {
  army.order = order;
}

/**
 * Orden HOLD: ejército se queda en su provincia (defensiva)
 */
export function orderHold(army: Army): void {
  setArmyOrder(army, { type: "hold" });
}

/**
 * Orden MOVE: ejército intenta moverse a provincia adyacente
 */
export function orderMove(army: Army, targetProvinceId: string): void {
  setArmyOrder(army, { type: "move", targetProvinceId });
}

/**
 * Orden ATTACK: ejército ataca a otro ejército en provincia específica (cooldown 15 min)
 */
export function orderAttack(army: Army, targetProvinceId: string, targetArmyId?: string): void {
  setArmyOrder(army, {
    type: "attack",
    targetProvinceId,
    attackArmyId: targetArmyId,
  });
}

/**
 * Orden MOVE_DELAYED: moverse a provincia adyacente pero esperar delayTicks antes de ejecutar.
 * executeAtTick = currentTick + delayTicks (se guarda al asignar la orden).
 */
export function orderMoveDelayed(
  army: Army,
  targetProvinceId: string,
  delayTicks: number,
  currentTick: number
): void {
  setArmyOrder(army, {
    type: "move_delayed",
    targetProvinceId,
    delayTicks,
    executeAtTick: currentTick + delayTicks,
  });
}

/**
 * Orden PATROL: solo para ejércitos con aviones. Patrullar (sin destino); aplica repostaje cada 40 min por 5 min.
 */
export function orderPatrol(army: Army): void {
  setArmyOrder(army, { type: "patrol" });
}

/**
 * Limpia la orden (útil después de ejecutarla)
 */
export function clearOrder(army: Army): void {
  army.order = null;
}
