/**
 * Costos de fabricación de unidades y construcción de edificios
 * Define qué recursos se gastan para producir cada cosa
 */

import type { ResourceType } from "../entities/resources";

/**
 * Costo de construir/producir algo
 * Los valores pueden variar según dificultad, tecnología, etc.
 */
export interface ConstructionCost {
  money?: number;
  metal?: number;
  fish?: number;
  wheat?: number;
  rare?: number;
  oil?: number;
  gasoline?: number;
  ammo?: number;
  manpower?: number;
  supply?: number;
}

/**
 * Costos de unidades militares
 */
export const UNIT_COSTS: Record<string, ConstructionCost> = {
  // Infantería
  "infantry": {
    money: 50,
    metal: 10,
    manpower: 20,
  },
  
  // Tanques
  "light_tank": {
    money: 150,
    metal: 80,
    gasoline: 5,
    manpower: 15,
  },
  "medium_tank": {
    money: 250,
    metal: 150,
    gasoline: 10,
    manpower: 25,
  },
  "heavy_tank": {
    money: 400,
    metal: 250,
    gasoline: 15,
    manpower: 40,
  },
  
  // Artillería
  "artillery": {
    money: 180,
    metal: 120,
    ammo: 20,
    manpower: 20,
  },
  "rocket_artillery": {
    money: 300,
    metal: 150,
    rare: 5,
    ammo: 30,
    manpower: 30,
  },
  
  // Aire
  "fighter": {
    money: 200,
    metal: 100,
    gasoline: 15,
    rare: 3,
    manpower: 10,
  },
  "bomber": {
    money: 350,
    metal: 200,
    gasoline: 25,
    rare: 5,
    manpower: 15,
  },
  "transport": {
    money: 150,
    metal: 80,
    gasoline: 10,
    manpower: 8,
  },
  
  // Marina
  "destroyer": {
    money: 400,
    metal: 300,
    gasoline: 20,
    manpower: 50,
  },
  "cruiser": {
    money: 600,
    metal: 500,
    gasoline: 35,
    rare: 5,
    manpower: 80,
  },
  "carrier": {
    money: 1000,
    metal: 800,
    gasoline: 50,
    rare: 10,
    manpower: 150,
  },
  "submarine": {
    money: 300,
    metal: 200,
    gasoline: 10,
    rare: 5,
    manpower: 30,
  },
};

/**
 * Costos de construcción de edificios
 * Tiempo en ticks también se puede agregar
 */
export const BUILDING_COSTS: Record<string, ConstructionCost> = {
  // CIUDAD - Producción
  "barracks": {
    money: 200,
    metal: 100,
  },
  "recruitment_center": {
    money: 150,
    metal: 80,
  },
  "airplane_factory": {
    money: 500,
    metal: 300,
    rare: 10,
  },
  "tank_factory": {
    money: 400,
    metal: 250,
  },
  "artillery_factory": {
    money: 350,
    metal: 200,
  },
  "research_lab": {
    money: 300,
    metal: 150,
    rare: 5,
  },
  "refinery": {
    money: 300,
    metal: 200,
  },
  "capital": {
    money: 1000,
    metal: 500,
    rare: 20,
  },
  
  // PROVINCIA - Infraestructura/Logística
  "resource_extraction": {
    money: 150,
    metal: 100,
  },
  "port": {
    money: 350,
    metal: 200,
  },
  "small_port": {
    money: 150,
    metal: 100,
  },
  "airfield": {
    money: 200,
    metal: 150,
  },
  "small_airfield": {
    money: 80,
    metal: 60,
  },
  "railway": {
    money: 120,
    metal: 100,
  },
  "fortress": {
    money: 250,
    metal: 200,
  },
  "supply_depot": {
    money: 100,
    metal: 80,
  },
  "small_hospital": {
    money: 100,
    metal: 70,
  },
};

/**
 * Tiempo de construcción en ticks
 * (1 tick = 1 minuto en el juego, ajusta según necesites)
 */
export const BUILDING_BUILD_TIME: Record<string, number> = {
  // CIUDAD
  "barracks": 100,
  "recruitment_center": 80,
  "airplane_factory": 300,
  "tank_factory": 250,
  "artillery_factory": 200,
  "research_lab": 150,
  "refinery": 180,
  "capital": 500,
  
  // PROVINCIA
  "resource_extraction": 100,
  "port": 200,
  "small_port": 100,
  "airfield": 150,
  "small_airfield": 60,
  "railway": 80,
  "fortress": 120,
  "supply_depot": 80,
  "small_hospital": 60,
};

/**
 * Tiempo de producción de unidades en ticks
 */
export const UNIT_BUILD_TIME: Record<string, number> = {
  "infantry": 30,
  "light_tank": 60,
  "medium_tank": 90,
  "heavy_tank": 150,
  "artillery": 80,
  "rocket_artillery": 120,
  "fighter": 50,
  "bomber": 80,
  "transport": 40,
  "destroyer": 200,
  "cruiser": 300,
  "carrier": 500,
  "submarine": 150,
};

/**
 * Obtiene el costo de producir algo
 */
export function getProductionCost(unitType: string): ConstructionCost {
  return UNIT_COSTS[unitType] || {};
}

/**
 * Obtiene el costo de construir un edificio
 */
export function getBuildingCost(buildingType: string): ConstructionCost {
  return BUILDING_COSTS[buildingType] || {};
}

/**
 * Obtiene el tiempo de construcción
 */
export function getBuildingBuildTime(buildingType: string): number {
  return BUILDING_BUILD_TIME[buildingType] || 100;
}

/**
 * Obtiene el tiempo de producción de unidad
 */
export function getUnitBuildTime(unitType: string): number {
  return UNIT_BUILD_TIME[unitType] || 50;
}

/**
 * Verifica si se pueden gastar los recursos necesarios
 */
export function canAffordProduction(
  resources: Record<ResourceType, number>,
  cost: ConstructionCost
): boolean {
  for (const [resourceType, amount] of Object.entries(cost)) {
    if ((resources[resourceType as ResourceType] || 0) < amount) {
      return false;
    }
  }
  return true;
}

/**
 * Deduce los costos de los recursos
 */
export function deductProductionCost(
  resources: Record<ResourceType, number>,
  cost: ConstructionCost
): void {
  for (const [resourceType, amount] of Object.entries(cost)) {
    const type = resourceType as ResourceType;
    if (resources[type]) {
      resources[type] -= amount;
    }
  }
}
