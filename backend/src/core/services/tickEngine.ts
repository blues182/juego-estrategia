import type { GameState } from "../entities/gameState";
import type { Army } from "../entities/army";
import {
  getArmiesInProvince,
  getArmy,
  removeArmy,
  checkVictory,
} from "../entities/gameState";
import {
  damageArmy,
  reduceMorale,
  isArmyDestroyed,
  getArmyTotalHp,
} from "../entities/army";
import { canMoveBetweenProvinces, getProvince } from "../entities/map";
import { tickProduction } from "../entities/country";
import { resolveDuel } from "../rules/combat";
import type { UnitInstance } from "../rules/combat";

/**
 * TickEngine orquesta la ejecución de un tick completo:
 * 1. Producción de recursos
 * 2. Movimiento de ejércitos
 * 3. Resolución de combates
 * 4. Chequeo de victoria
 * 5. Limpieza de órdenes
 */

export interface TickResult {
  tickNumber: number;
  events: TickEvent[];
  victory?: string; // facción que ganó, si aplica
}

export interface TickEvent {
  type: "production" | "movement" | "battle" | "destruction" | "victory";
  message: string;
  details?: any;
}

/**
 * Procesa un tick completo
 */
export function processTick(state: GameState): TickResult {
  const events: TickEvent[] = [];

  // PASO 1: Producción
  for (const country of Object.values(state.countries)) {
    tickProduction(country);
  }
  events.push({
    type: "production",
    message: "Producción de recursos completada",
  });

  // PASO 2: Movimiento
  const movementEvents = processMovement(state);
  events.push(...movementEvents);

  // PASO 3: Combates
  const battleEvents = processBattles(state);
  events.push(...battleEvents);

  // PASO 4: Limpieza de ejércitos destruidos
  const destructionEvents = cleanupDestroyedArmies(state);
  events.push(...destructionEvents);

  // PASO 5: Chequeo de victoria
  const winner = checkVictory(state);
  if (winner) {
    state.winner = winner;
    state.status = "finished";
    events.push({
      type: "victory",
      message: `¡${winner} ha ganado la partida!`,
    });
  }

  // PASO 6: Incrementa tick
  state.currentTick++;

  // PASO 7: Limpia órdenes
  clearAllOrders(state);

  return {
    tickNumber: state.currentTick,
    events,
    victory: winner,
  };
}

/**
 * PASO 2: Procesa movimiento de ejércitos
 */
function processMovement(state: GameState): TickEvent[] {
  const events: TickEvent[] = [];

  for (const army of Object.values(state.armies)) {
    if (!army.order || army.order.type !== "move") continue;

    const targetProvinceId = army.order.targetProvinceId;
    if (!targetProvinceId) continue;

    const currentProvince = getProvince(state.map, army.provinceId);
    const targetProvince = getProvince(state.map, targetProvinceId);

    // Chequea adyacencia
    if (!canMoveBetweenProvinces(currentProvince, targetProvince)) {
      events.push({
        type: "movement",
        message: `${army.name}: No puede moverse a ${targetProvince.name} (no adyacente)`,
      });
      continue;
    }

    // Mueve el ejército
    army.provinceId = targetProvinceId;
    events.push({
      type: "movement",
      message: `${army.name}: Se movió a ${targetProvince.name}`,
    });
  }

  return events;
}

/**
 * PASO 3: Resuelve combates entre ejércitos en la misma provincia
 */
function processBattles(state: GameState): TickEvent[] {
  const events: TickEvent[] = [];
  const processedArmies = new Set<string>();

  for (const provinceId of Object.keys(state.map.provinces)) {
    const armiesHere = getArmiesInProvince(state, provinceId);

    // Agrupa por facción
    const factionGroups: Record<string, Army[]> = {};
    for (const army of armiesHere) {
      if (!factionGroups[army.owner]) factionGroups[army.owner] = [];
      factionGroups[army.owner].push(army);
    }

    // Si hay solo una facción, no hay combate
    if (Object.keys(factionGroups).length <= 1) continue;

    // Hay combate: resuelve entre primeras unidades de cada facción
    const factions = Object.keys(factionGroups);
    const armyA = factionGroups[factions[0]][0];
    const armyB = factionGroups[factions[1]][0];

    if (processedArmies.has(armyA.id) || processedArmies.has(armyB.id)) continue;

    const battleEvent = resolveBattle(state, armyA, armyB, provinceId);
    events.push(battleEvent);

    processedArmies.add(armyA.id);
    processedArmies.add(armyB.id);
  }

  return events;
}

/**
 * Resuelve un combate entre dos ejércitos
 * (simplificado: batalla entre primeras unidades)
 */
function resolveBattle(
  state: GameState,
  armyA: Army,
  armyB: Army,
  provinceId: string
): TickEvent {
  if (armyA.units.length === 0 || armyB.units.length === 0) {
    return {
      type: "battle",
      message: "Combate no se pudo resolver (ejército vacío)",
    };
  }

  let totalDamageToA = 0;
  let totalDamageToB = 0;
  let battleNotes: string[] = [];

  // Simula combate por 3 rounds (simplificado)
  for (let round = 0; round < 3; round++) {
    if (armyA.units.length === 0 || armyB.units.length === 0) break;

    const unitA = armyA.units[0];
    const unitB = armyB.units[0];

    const result = resolveDuel(unitA, unitB);
    totalDamageToA += result.attackerDamage;
    totalDamageToB += result.defenderDamage;
    battleNotes.push(`Round ${round + 1}: ${result.notes.join(" | ")}`);

    // Aplica daño
    if (result.defenderDestroyed) {
      armyB.units.shift();
      battleNotes.push(`→ Unidad de ${armyB.owner} destruida`);
    }
    if (result.attackerDestroyed) {
      armyA.units.shift();
      battleNotes.push(`→ Unidad de ${armyA.owner} destruida`);
    }
  }

  // Reduce morale
  reduceMorale(armyA, 10);
  reduceMorale(armyB, 10);

  const message =
    `${armyA.name} vs ${armyB.name}: ` +
    (armyA.units.length > armyB.units.length
      ? `Victoria para ${armyA.owner}`
      : armyB.units.length > 0
        ? `Victoria para ${armyB.owner}`
        : "Empate");

  return {
    type: "battle",
    message,
    details: {
      armyA: armyA.id,
      armyB: armyB.id,
      armyAUnitsRemaining: armyA.units.length,
      armyBUnitsRemaining: armyB.units.length,
      notes: battleNotes,
    },
  };
}

/**
 * PASO 4: Remueve ejércitos destruidos
 */
function cleanupDestroyedArmies(state: GameState): TickEvent[] {
  const events: TickEvent[] = [];
  const destroyedIds: string[] = [];

  for (const armyId of Object.keys(state.armies)) {
    const army = state.armies[armyId];
    if (isArmyDestroyed(army)) {
      destroyedIds.push(armyId);
      events.push({
        type: "destruction",
        message: `${army.name} fue completamente destruido`,
      });
    }
  }

  for (const id of destroyedIds) {
    removeArmy(state, id);
  }

  return events;
}

/**
 * PASO 7: Limpia órdenes después de ejecución
 */
function clearAllOrders(state: GameState): void {
  for (const army of Object.values(state.armies)) {
    army.order = null;
  }
}
