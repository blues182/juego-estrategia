/**
 * Sistema de recursos económicos del juego.
 * Cada facción tiene estos recursos que gasta/produce.
 * 
 * Recursos crudos: metal, pescado, trigo, raros, petróleo
 * Recursos refinados: gasolina (de petróleo), balas (de petróleo)
 * Otros: manpower, supply
 */

export type ResourceType = 
  | "money"              // Dinero para gastos generales/construcción
  | "metal"              // Construcción, unidades blindadas
  | "fish"               // Comida, manpower
  | "wheat"              // Comida, manpower
  | "rare"               // Recursos raros, bonificaciones especiales
  | "oil"                // Petróleo crudo (se refina)
  | "gasoline"           // Gasolina (refinada de petróleo) - combustible para tanques/aviones
  | "ammo"               // Balas (refinadas de petróleo)
  | "manpower"           // Población militar
  | "supply"             // Suministros logísticos
  | string;              // Extensible

/**
 * Cantidad de un recurso
 */
export interface Resource {
  type: ResourceType;
  current: number;
  max: number;
  perTickProduction: number;
  perTickConsumption: number;
}

/**
 * Contenedor de todos los recursos de una facción
 */
export interface ResourcePool {
  money: Resource;
  metal: Resource;
  fish: Resource;
  wheat: Resource;
  rare: Resource;
  oil: Resource;
  gasoline: Resource;
  ammo: Resource;
  manpower: Resource;
  supply: Resource;
  
  [key: string]: Resource;
}

/**
 * Crea un ResourcePool inicial
 */
export function createResourcePool(): ResourcePool {
  return {
    money: {
      type: "money",
      current: 500,
      max: 2000,
      perTickProduction: 8,  // De capital y ciudades
      perTickConsumption: 2, // Mantenimiento general
    },
    metal: {
      type: "metal",
      current: 150,
      max: 600,
      perTickProduction: 6,
      perTickConsumption: 3,
    },
    fish: {
      type: "fish",
      current: 100,
      max: 400,
      perTickProduction: 4,
      perTickConsumption: 2,
    },
    wheat: {
      type: "wheat",
      current: 200,
      max: 800,
      perTickProduction: 8,
      perTickConsumption: 3,
    },
    rare: {
      type: "rare",
      current: 20,
      max: 200,
      perTickProduction: 1,
      perTickConsumption: 0,
    },
    oil: {
      type: "oil",
      current: 80,
      max: 400,
      perTickProduction: 4,
      perTickConsumption: 2,
    },
    gasoline: {
      type: "gasoline",
      current: 50,
      max: 300,
      perTickProduction: 0,  // Se produce en refinerías
      perTickConsumption: 4, // Tanques y aviones lo consumen
    },
    ammo: {
      type: "ammo",
      current: 60,
      max: 250,
      perTickProduction: 0,  // Se produce en refinerías
      perTickConsumption: 5, // Combate lo consume
    },
    manpower: {
      type: "manpower",
      current: 100,
      max: 500,
      perTickProduction: 5,  // De recruitment centers
      perTickConsumption: 2, // Crear unidades consume
    },
    supply: {
      type: "supply",
      current: 100,
      max: 300,
      perTickProduction: 5,  // De supply depots
      perTickConsumption: 3, // Ejércitos lo consumen
    },
  };
}

/**
 * Aplica producción y consumo de recursos
 */
export function tickResources(pool: ResourcePool): void {
  for (const resource of Object.values(pool)) {
    if (
      typeof resource === "object" &&
      resource !== null &&
      "perTickProduction" in resource &&
      "perTickConsumption" in resource
    ) {
      const net = (resource as Resource).perTickProduction - (resource as Resource).perTickConsumption;
      (resource as Resource).current = Math.min(
        (resource as Resource).current + net,
        (resource as Resource).max
      );
      // Si cae a negativo, aplicar penalización o restricción
      if ((resource as Resource).current < 0) {
        (resource as Resource).current = 0;
      }
    }
  }
}

/**
 * Intenta consumir un recurso
 */
export function consumeResource(pool: ResourcePool, type: ResourceType, amount: number): boolean {
  const resource = pool[type];
  if (!resource || resource.current < amount) {
    return false;
  }
  resource.current -= amount;
  return true;
}

/**
 * Agrega un recurso
 */
export function addResource(pool: ResourcePool, type: ResourceType, amount: number): void {
  const resource = pool[type];
  if (resource) {
    resource.current = Math.min(resource.current + amount, resource.max);
  }
}

/**
 * Refina petróleo en gasolina y balas en una refinería
 * Ratios:
 * - 1 petróleo -> 0.6 gasolina
 * - 1 petróleo -> 0.8 balas
 * Ambas rutas compiten por el petróleo disponible
 */
export function refineOil(
  pool: ResourcePool,
  oilForGasoline: number,
  oilForAmmo: number
): { gasolineProduced: number; ammoProduced: number } {
  const totalOilNeeded = oilForGasoline + oilForAmmo;
  
  if (pool.oil.current < totalOilNeeded) {
    return { gasolineProduced: 0, ammoProduced: 0 };
  }
  
  const gasolineProduced = oilForGasoline * 0.6;
  const ammoProduced = oilForAmmo * 0.8;
  
  // Consumir petróleo
  pool.oil.current -= totalOilNeeded;
  
  // Producir refinados
  addResource(pool, "gasoline", Math.floor(gasolineProduced));
  addResource(pool, "ammo", Math.floor(ammoProduced));
  
  return { gasolineProduced: Math.floor(gasolineProduced), ammoProduced: Math.floor(ammoProduced) };
}
