/**
 * Tipos de edificios disponibles en el juego.
 * Cada edificio tiene efectos sobre producción, capacidad, etc.
 */
/**
 * Edificios de CIUDAD (producción, investigación, reclutamiento)
 */
export type CityBuildingType = 
  | "airplane_factory"   // Produce aviones
  | "tank_factory"       // Produce tanques
  | "artillery_factory"  // Produce artillería
  | "barracks"           // Entrena infantería
  | "recruitment_center" // Centro de reclutamiento
  | "capital"            // Centro político/económico
  | "research_lab"       // Genera puntos de investigación
  | "refinery"           // Procesa materiales crudos;

/**
 * Edificios de PROVINCIA (infraestructura, logística, defensa)
 */
export type ProvinceBuildingType =
  | "resource_extraction"// Minas/pozos de petróleo/grano
  | "port"               // Comercio marítimo, movimiento naval (grandes)
  | "small_port"         // Puerto pequeño (solo provincias)
  | "airfield"           // Reabastece/repara aviones (grandes)
  | "small_airfield"     // Pista de repostaje pequeña (solo provincias)
  | "fortress"           // Defensa territorial (aumenta defensa)
  | "supply_depot"       // Almacén de supply
  | "small_hospital"     // Hospital pequeño (recupera morale)
  | "railway"            // Vía de ferrocarril (logística, movimiento)
  | string;

export type BuildingType = CityBuildingType | ProvinceBuildingType | string;  // Extensible

/**
 * Una instancia de edificio en una provincia
 */
export interface Building {
  id: string;
  provinceId: string;
  type: BuildingType;
  
  // Estado
  hp: number;                    // Salud actual
  hpMax: number;                // Salud máxima
  damaged: boolean;              // Si está dañado por combate
  
  // Producción
  productionPerTick: number;     // Lo que produce por tick (depende del tipo)
  efficiency: number;            // 0..100, reduce producción si está dañado
  
  // Nivel
  level: number;                 // 1..10, aumenta con inversión de recursos
}

/**
 * Crea un nuevo edificio
 */
export function createBuilding(
  id: string,
  provinceId: string,
  type: BuildingType,
  hpMax: number = 100,
  productionPerTick: number = 5
): Building {
  return {
    id,
    provinceId,
    type,
    hp: hpMax,
    hpMax,
    damaged: false,
    productionPerTick,
    efficiency: 100,
    level: 1,
  };
}

/**
 * Obtiene la producción real (considerando daño y eficiencia)
 */
export function getActualProduction(building: Building): number {
  return Math.floor(building.productionPerTick * (building.efficiency / 100) * building.level);
}

/**
 * Daña un edificio
 */
export function damageBuilding(building: Building, damage: number): void {
  building.hp = Math.max(0, building.hp - damage);
  building.damaged = building.hp < building.hpMax;
  
  // La eficiencia cae con el daño
  const damagePercent = 1 - (building.hp / building.hpMax);
  building.efficiency = Math.max(10, 100 - damagePercent * 90); // Mínimo 10% eficiencia
}

/**
 * Repara un edificio (cuesta recursos)
 */
export function repairBuilding(building: Building, amount: number): void {
  building.hp = Math.min(building.hp + amount, building.hpMax);
  if (building.hp === building.hpMax) {
    building.damaged = false;
    building.efficiency = 100;
  }
}
