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
}

/**
 * Órdenes posibles para un ejército
 */
export type ArmyOrderType = "hold" | "move" | "attack";

export interface ArmyOrder {
  type: ArmyOrderType;
  targetProvinceId?: string;  // para move/attack
  attackArmyId?: string;      // para ataque específico a ejército
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
