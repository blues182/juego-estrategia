import type { FactionId } from "../catalog/factions";
import { FACTIONS } from "../catalog/factions";

/**
 * Un Country representa una facción en la partida actual.
 * Controla: manpower, supply, ejércitos, provincias.
 */
export interface Country {
  factionId: FactionId;
  
  // Recursos
  manpower: number;         // población/recursos militares
  manpowerMax: number;      // límite de manpower
  supply: number;           // suministros disponibles
  supplyMax: number;        // capacidad de suministros
  
  // Producción por tick
  manpowerPerTick: number;  // generado por provincias
  supplyPerTick: number;    // generado por provincias
  
  // Estado
  isAlive: boolean;         // false si fuerza militar = 0
}

/**
 * Crea un Country para una facción
 */
export function createCountry(factionId: FactionId): Country {
  return {
    factionId,
    manpower: 100,
    manpowerMax: 500,
    supply: 50,
    supplyMax: 200,
    manpowerPerTick: 5,
    supplyPerTick: 3,
    isAlive: true,
  };
}

/**
 * Aplica producción de recursos en un tick
 */
export function tickProduction(country: Country): void {
  country.manpower = Math.min(country.manpower + country.manpowerPerTick, country.manpowerMax);
  country.supply = Math.min(country.supply + country.supplyPerTick, country.supplyMax);
}

/**
 * Consume manpower para crear una unidad (aproximadamente)
 */
export function spendManpower(country: Country, amount: number): boolean {
  if (country.manpower >= amount) {
    country.manpower -= amount;
    return true;
  }
  return false;
}

/**
 * Consume supply
 */
export function spendSupply(country: Country, amount: number): boolean {
  if (country.supply >= amount) {
    country.supply -= amount;
    return true;
  }
  return false;
}
