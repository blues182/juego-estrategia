import type { FactionId } from "../catalog/factions";
import type { GameMap } from "./map";
import type { Country } from "./country";
import type { Army } from "./army";

/**
 * GameState representa el estado completo de una partida en progreso.
 * Contiene: mapa, países, ejércitos, y metadatos de la partida.
 */
export interface GameState {
  // Metadatos
  id: string;
  name: string;
  currentTick: number;
  maxTicks?: number;
  status: "waiting" | "active" | "paused" | "finished";
  
  // Entidades
  map: GameMap;
  countries: Record<FactionId, Country>;
  armies: Record<string, Army>;  // id -> Army
  
  // Quien ganó (null si aún no hay ganador)
  winner?: FactionId | null;
}

/**
 * Crea un nuevo GameState
 */
export function createGameState(
  gameId: string,
  gameName: string,
  map: GameMap,
  factions: FactionId[],
  countries: Record<FactionId, Country>
): GameState {
  return {
    id: gameId,
    name: gameName,
    currentTick: 0,
    maxTicks: 500,
    status: "active",
    map,
    countries,
    armies: {},
    winner: null,
  };
}

/**
 * Obtiene todos los ejércitos de una facción
 */
export function getArmiesByFaction(state: GameState, faction: FactionId): Army[] {
  return Object.values(state.armies).filter((a) => a.owner === faction);
}

/**
 * Obtiene todos los ejércitos en una provincia
 */
export function getArmiesInProvince(state: GameState, provinceId: string): Army[] {
  return Object.values(state.armies).filter((a) => a.provinceId === provinceId);
}

/**
 * Busca un ejército por ID
 */
export function getArmy(state: GameState, armyId: string): Army | undefined {
  return state.armies[armyId];
}

/**
 * Agrega un ejército al estado
 */
export function addArmy(state: GameState, army: Army): void {
  if (state.armies[army.id]) {
    throw new Error(`Army con ID ${army.id} ya existe`);
  }
  state.armies[army.id] = army;
}

/**
 * Remueve un ejército (destruido)
 */
export function removeArmy(state: GameState, armyId: string): void {
  delete state.armies[armyId];
}

/**
 * Actualiza la producción de cada país según las provincias que controla en el mapa.
 * Suma manpowerProduction y supplyProduction de las provincias donde owner === factionId.
 */
export function updateCountriesProductionFromMap(state: GameState): void {
  for (const factionId of Object.keys(state.countries) as FactionId[]) {
    const country = state.countries[factionId];
    let manpowerPerTick = 0;
    let supplyPerTick = 0;
    for (const province of Object.values(state.map.provinces)) {
      if (province.owner === factionId) {
        manpowerPerTick += province.manpowerProduction;
        supplyPerTick += province.supplyProduction;
      }
    }
    country.manpowerPerTick = manpowerPerTick;
    country.supplyPerTick = supplyPerTick;
  }
}

/**
 * Chequea si hay un ganador (una sola facción con ejércitos)
 */
export function checkVictory(state: GameState): FactionId | null {
  const factionsWithArmies = new Set<FactionId>();
  
  for (const army of Object.values(state.armies)) {
    if (army.units.length > 0) {
      factionsWithArmies.add(army.owner);
    }
  }
  
  // Si solo queda una facción, gana
  if (factionsWithArmies.size === 1) {
    return Array.from(factionsWithArmies)[0];
  }
  
  return null;
}
