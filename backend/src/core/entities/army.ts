import type { FactionId } from "../catalog/factions";
import type { UnitInstance } from "../rules/combat";

/**
 * Un Army es un grupo de unidades posicionado en una provincia.
 * Representa un "ejército" que puede moverse, atacar y defenderse.
 */
export interface Army {
  id: string;
  owner: FactionId;
  provinceId: string;      // dónde está posicionado
  units: UnitInstance[];   // unidades en el ejército
  
  // Orden actual (ejecutada en el tick)
  order: ArmyOrder | null;
  
  // Morale general (afecta a todas las unidades)
  morale: number;          // 0..100
  
  // Nombre identificativo
  name?: string;
  
  // Cooldown de ataque: último tick en que participó en combate (solo puede atacar cada 15 min)
  lastAttackTick?: number;
  
  // Aviones: repostaje cada 40 min durante 5 min
  airRefuelingUntilTick?: number;  // hasta qué tick está repostando (solo si tiene aviones)
  airTicksSinceRefuel?: number;    // ticks en misión desde último repostaje
}

/**
 * Órdenes posibles para un ejército
 * - hold: quedarse
 * - move: moverse a provincia adyacente
 * - attack: atacar (mover a provincia y combatir; cooldown 15 min)
 * - move_delayed: moverse pero esperar delayTicks antes de ejecutar
 * - patrol: solo aviones; patrullar (aplica lógica de repostaje cada 40 min)
 */
export type ArmyOrderType = "hold" | "move" | "attack" | "move_delayed" | "patrol";

export interface ArmyOrder {
  type: ArmyOrderType;
  targetProvinceId?: string;   // para move / attack / move_delayed
  attackArmyId?: string;        // para ataque específico a ejército
  delayTicks?: number;          // para move_delayed: cuántos ticks esperar
  executeAtTick?: number;       // para move_delayed: tick en que se ejecuta (currentTick + delayTicks al asignar)
}

/**
 * Crea un nuevo Army
 */
export function createArmy(
  id: string,
  owner: FactionId,
  provinceId: string,
  units: UnitInstance[] = []
): Army {
  return {
    id,
    owner,
    provinceId,
    units,
    order: null,
    morale: 80,
    name: `Ejército ${owner} (${id})`,
  };
}

/**
 * Calcula HP total del ejército
 */
export function getArmyTotalHp(army: Army): number {
  return army.units.reduce((sum, u) => sum + u.hp, 0);
}

/**
 * Calcula HP máximo del ejército
 */
export function getArmyMaxHp(army: Army, getUnitType: (id: string) => any): number {
  return army.units.reduce((sum, u) => {
    const unitType = getUnitType(u.typeId);
    return sum + (unitType?.hpMax || 100);
  }, 0);
}

/**
 * Calcula morale promedio del ejército
 */
export function getArmyAverageMorale(army: Army): number {
  if (army.units.length === 0) return 0;
  const sum = army.units.reduce((s, u) => s + u.morale, 0);
  return sum / army.units.length;
}

/**
 * Calcula supply promedio del ejército
 */
export function getArmyAverageSupply(army: Army): number {
  if (army.units.length === 0) return 0;
  const sum = army.units.reduce((s, u) => s + u.supply, 0);
  return sum / army.units.length;
}

/**
 * Agrega daño a todas las unidades del ejército
 * (distribuyendo daño entre unidades)
 */
export function damageArmy(army: Army, totalDamage: number): number {
  let remainingDamage = totalDamage;
  let unitsDestroyed = 0;

  for (const unit of army.units) {
    if (remainingDamage <= 0) break;

    const unitDamage = Math.min(remainingDamage, unit.hp);
    unit.hp -= unitDamage;
    remainingDamage -= unitDamage;

    if (unit.hp <= 0) unitsDestroyed++;
  }

  // Remueve unidades destruidas
  army.units = army.units.filter((u) => u.hp > 0);

  return unitsDestroyed;
}

/**
 * Reduce morale del ejército
 */
export function reduceMorale(army: Army, amount: number): void {
  army.morale = Math.max(0, army.morale - amount);
  // Reduce morale individual también
  for (const unit of army.units) {
    unit.morale = Math.max(0, unit.morale - amount * 0.5);
  }
}

/**
 * Chequea si el ejército está destruido (sin unidades)
 */
export function isArmyDestroyed(army: Army): boolean {
  return army.units.length === 0;
}

/**
 * Indica si el ejército tiene al menos una unidad aérea (sujeta a repostaje cada 40 min / 5 min)
 */
export function hasAirUnits(
  army: Army,
  getUnitType: (typeId: string) => { domain?: string } | undefined
): boolean {
  return army.units.some((u) => getUnitType(u.typeId)?.domain === "air");
}

/**
 * Indica si el ejército está repostando (aviones) y no puede moverse/atacar este tick.
 * Repostaje dura hasta el tick airRefuelingUntilTick (inclusive).
 */
export function isRefueling(army: Army, currentTick: number): boolean {
  if (army.airRefuelingUntilTick == null) return false;
  return currentTick <= army.airRefuelingUntilTick;
}
