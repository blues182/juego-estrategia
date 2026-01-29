import type { FactionId } from "../catalog/factions";

export type Terrain = "plains" | "mountain" | "forest" | "desert" | "coast";
export type ProvinceControlType = "land" | "naval";

/**
 * Una provincia es una región del mapa que puede contener ejércitos.
 * Controla terreno, recursos y posiciones.
 */
export interface Province {
  id: string;
  name: string;
  x: number;
  y: number;
  terrain: Terrain;
  controlType: ProvinceControlType; // tierra o mar
  
  // Control político
  owner: FactionId | null; // null = neutral/incontrolado
  
  // Recursos
  manpowerProduction: number; // manpower por tick
  supplyProduction: number;   // supply por tick
  
  // Conectividad
  adjacentProvinces: string[]; // IDs de provincias adyacentes
  
  // Fortificaciones (básicas)
  fortification: number; // 0..100 (sube defensa de ejércitos aquí)
}

/**
 * Mapa estático (define la geografía del mundo)
 */
export interface GameMap {
  provinces: Record<string, Province>;
  width: number;
  height: number;
  name: string;
}

/**
 * Mapa simple de demostración: 3x3 con provincias conectadas
 */
export function createDemoMap(): GameMap {
  const provinces: Record<string, Province> = {
    // Fila 1
    "1-1": {
      id: "1-1",
      name: "Normandía",
      x: 1,
      y: 1,
      terrain: "plains",
      controlType: "land",
      owner: "USA",
      manpowerProduction: 5,
      supplyProduction: 3,
      adjacentProvinces: ["2-1", "1-2"],
      fortification: 0,
    },
    "2-1": {
      id: "2-1",
      name: "París",
      x: 2,
      y: 1,
      terrain: "plains",
      controlType: "land",
      owner: "FRA",
      manpowerProduction: 8,
      supplyProduction: 5,
      adjacentProvinces: ["1-1", "3-1", "2-2"],
      fortification: 20,
    },
    "3-1": {
      id: "3-1",
      name: "Rin",
      x: 3,
      y: 1,
      terrain: "mountain",
      controlType: "land",
      owner: "GER",
      manpowerProduction: 6,
      supplyProduction: 2,
      adjacentProvinces: ["2-1", "3-2"],
      fortification: 40,
    },
    // Fila 2
    "1-2": {
      id: "1-2",
      name: "Atlántico",
      x: 1,
      y: 2,
      terrain: "coast",
      controlType: "naval",
      owner: "UK",
      manpowerProduction: 0,
      supplyProduction: 4,
      adjacentProvinces: ["1-1", "2-2"],
      fortification: 0,
    },
    "2-2": {
      id: "2-2",
      name: "Bélgica",
      x: 2,
      y: 2,
      terrain: "plains",
      controlType: "land",
      owner: null,
      manpowerProduction: 3,
      supplyProduction: 2,
      adjacentProvinces: ["1-2", "2-1", "3-2", "2-3"],
      fortification: 0,
    },
    "3-2": {
      id: "3-2",
      name: "Polonia",
      x: 3,
      y: 2,
      terrain: "forest",
      controlType: "land",
      owner: "USSR",
      manpowerProduction: 10,
      supplyProduction: 3,
      adjacentProvinces: ["3-1", "2-2", "3-3"],
      fortification: 15,
    },
    // Fila 3
    "1-3": {
      id: "1-3",
      name: "Iberia",
      x: 1,
      y: 3,
      terrain: "desert",
      controlType: "land",
      owner: null,
      manpowerProduction: 2,
      supplyProduction: 1,
      adjacentProvinces: ["2-3"],
      fortification: 0,
    },
    "2-3": {
      id: "2-3",
      name: "Mediterráneo",
      x: 2,
      y: 3,
      terrain: "coast",
      controlType: "naval",
      owner: "ITA",
      manpowerProduction: 0,
      supplyProduction: 3,
      adjacentProvinces: ["1-3", "3-3", "2-2"],
      fortification: 0,
    },
    "3-3": {
      id: "3-3",
      name: "Balcanes",
      x: 3,
      y: 3,
      terrain: "mountain",
      controlType: "land",
      owner: "JPN",
      manpowerProduction: 4,
      supplyProduction: 2,
      adjacentProvinces: ["3-2", "2-3"],
      fortification: 10,
    },
  };

  return {
    provinces,
    width: 3,
    height: 3,
    name: "Europa WWII Simplificada",
  };
}

/**
 * Obtiene provincia por ID
 */
export function getProvince(map: GameMap, provinceId: string): Province {
  const province = map.provinces[provinceId];
  if (!province) throw new Error(`Provincia no existe: ${provinceId}`);
  return province;
}

/**
 * Verifica si se puede mover de una provincia a otra (deben ser adyacentes)
 */
export function canMoveBetweenProvinces(from: Province, to: Province): boolean {
  return from.adjacentProvinces.includes(to.id);
}
