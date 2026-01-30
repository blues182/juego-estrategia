import type { GameState } from "../entities/gameState";
import type { Army } from "../entities/army";
import {
  getArmiesInProvince,
  removeArmy,
  checkVictory,
} from "../entities/gameState";
import {
  reduceMorale,
  isArmyDestroyed,
  hasAirUnits,
  isRefueling,
} from "../entities/army";
import { canMoveBetweenProvinces, getProvince } from "../entities/map";
import { tickProduction } from "../entities/country";
import { resolveDuel } from "../rules/combat";
import { UNIT_TYPES } from "../catalog/unitTypes";
import type { UnitInstance } from "../rules/combat";

/** 1 tick = 5 minutos */
export const MINUTES_PER_TICK = 5;
/** Aviones: repostar cada 40 min = 8 ticks */
export const REFUEL_INTERVAL_TICKS = 8;
/** Repostaje dura 5 min = 1 tick */
export const REFUEL_DURATION_TICKS = 1;
/** Un ejército solo puede atacar cada 15 min = 3 ticks */
export const ATTACK_COOLDOWN_TICKS = 3;

const getUnitType = (typeId: string) => UNIT_TYPES[typeId as keyof typeof UNIT_TYPES];

/**
 * TickEngine orquesta la ejecución de un tick completo:
 * 0. Actualizar estado de repostaje de aviones
 * 1. Producción de recursos
 * 2. Movimiento / ataque / move_delayed (patrol no mueve)
 * 3. Resolución de combates (marca lastAttackTick; cooldown 15 min)
 * 4. Limpieza de ejércitos destruidos
 * 5. Chequeo de victoria
 * 6. Incrementar tick
 * 7. Limpieza de órdenes
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
 * Actualiza estado de repostaje de aviones: cada 40 min repostan 5 min.
 */
function updateAirRefuelState(state: GameState): TickEvent[] {
  const events: TickEvent[] = [];
  const t = state.currentTick;

  for (const army of Object.values(state.armies)) {
    if (!hasAirUnits(army, getUnitType)) continue;

    // Terminar repostaje al tick siguiente al de repostaje (durante t === airRefuelingUntilTick siguen repostando)
    if (army.airRefuelingUntilTick != null && t > army.airRefuelingUntilTick) {
      army.airRefuelingUntilTick = undefined;
      army.airTicksSinceRefuel = 0;
      events.push({
        type: "movement",
        message: `${army.name}: Finalizó repostaje de combustible`,
      });
      continue;
    }

    // Si está repostando, no avanza el contador
    if (army.airRefuelingUntilTick != null) continue;

    const since = (army.airTicksSinceRefuel ?? 0) + 1;
    army.airTicksSinceRefuel = since;

    if (since >= REFUEL_INTERVAL_TICKS) {
      army.airRefuelingUntilTick = t + REFUEL_DURATION_TICKS;
      army.airTicksSinceRefuel = 0;
      events.push({
        type: "movement",
        message: `${army.name}: Repostando combustible (5 min)`,
      });
    }
  }

  return events;
}

/**
 * Procesa un tick completo
 */
export function processTick(state: GameState): TickResult {
  const events: TickEvent[] = [];
  const t = state.currentTick;

  // PASO 0: Repostaje de aviones
  const refuelEvents = updateAirRefuelState(state);
  events.push(...refuelEvents);

  // PASO 1: Producción
  for (const country of Object.values(state.countries)) {
    tickProduction(country);
  }
  events.push({
    type: "production",
    message: "Producción de recursos completada",
  });

  // PASO 2: Movimiento / ataque / move_delayed (patrol no mueve)
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
 * PASO 2: Procesa movimiento, ataque, move_delayed. Patrol no mueve (solo aplica repostaje).
 * - Aviones en repostaje no se mueven ni atacan.
 * - Ataque: cooldown 15 min (solo puede atacar cada 3 ticks).
 * - move_delayed: solo ejecuta cuando currentTick >= executeAtTick.
 */
function processMovement(state: GameState): TickEvent[] {
  const events: TickEvent[] = [];
  const t = state.currentTick;

  for (const army of Object.values(state.armies)) {
    if (!army.order) continue;

    // Aviones en repostaje: no moverse ni atacar
    if (isRefueling(army, t)) continue;

    const isMove = army.order.type === "move";
    const isAttack = army.order.type === "attack";
    const isMoveDelayed = army.order.type === "move_delayed";
    const isPatrol = army.order.type === "patrol";

    if (isPatrol) continue; // patrol = quedarse; la lógica de repostaje ya se aplicó arriba

    if (isMoveDelayed) {
      const executeAt = army.order.executeAtTick ?? t;
      if (t < executeAt) continue; // aún no es el tick de ejecución
      // ejecutar como move
    }

    const targetProvinceId = army.order.targetProvinceId;
    if (!targetProvinceId && !isMoveDelayed) continue;
    if (isMoveDelayed && !targetProvinceId) continue;

    const tid = targetProvinceId!;
    const currentProvince = getProvince(state.map, army.provinceId);
    const targetProvince = getProvince(state.map, tid);

    if (!canMoveBetweenProvinces(currentProvince, targetProvince)) {
      events.push({
        type: "movement",
        message: `${army.name}: No puede ${isAttack ? "atacar" : "moverse"} a ${targetProvince.name} (no adyacente)`,
      });
      continue;
    }

    // Cooldown de ataque: solo puede atacar cada 15 min (3 ticks)
    if (isAttack) {
      const last = army.lastAttackTick ?? -999;
      if (t < last + ATTACK_COOLDOWN_TICKS) {
        events.push({
          type: "movement",
          message: `${army.name}: En cooldown de ataque (próximo ataque en ${(last + ATTACK_COOLDOWN_TICKS - t) * MINUTES_PER_TICK} min)`,
        });
        continue;
      }
    }

    army.provinceId = tid;
    events.push({
      type: "movement",
      message: isAttack
        ? `${army.name}: Atacó y se desplazó a ${targetProvince.name}`
        : isMoveDelayed
          ? `${army.name}: Se movió (retrasado) a ${targetProvince.name}`
          : `${army.name}: Se movió a ${targetProvince.name}`,
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

  // Cooldown de ataque: solo pueden atacar de nuevo en 15 min
  armyA.lastAttackTick = state.currentTick;
  armyB.lastAttackTick = state.currentTick;

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
 * PASO 7: Limpia órdenes después de ejecución.
 * No limpia move_delayed si executeAtTick > currentTick (aún no se ejecutó).
 */
function clearAllOrders(state: GameState): void {
  const t = state.currentTick;
  for (const army of Object.values(state.armies)) {
    const o = army.order;
    if (!o) continue;
    if (o.type === "move_delayed" && o.executeAtTick != null && t < o.executeAtTick) continue;
    army.order = null;
  }
}
