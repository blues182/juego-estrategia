/**
 * Sistema de requisitos de infraestructura para movimiento y operaciones
 * Define qué edificios/infraestructura necesita cada tipo de unidad
 */

import type { Army } from "../entities/army";
import type { Building } from "../entities/buildings";

/**
 * Tipo de requisito de infraestructura
 */
export type InfrastructureRequirement = 
  | "airfield"           // Pista de aterrizaje
  | "small_airfield"     // Pista pequeña
  | "port"               // Puerto comercial
  | "small_port"         // Puerto pequeño
  | "railway"            // Vía de ferrocarril (bonus, no bloqueante)
  | "supply_depot"       // Depósito de suministros
  | "fortress"           // Fortaleza (defensa)
  | none;                // Sin requisito

/**
 * Requisitos de infraestructura por tipo de unidad
 */
export const UNIT_INFRASTRUCTURE_REQUIREMENTS: Record<string, {
  required: InfrastructureRequirement[];
  optional: InfrastructureRequirement[];
  maxTicksWithoutResupply: number;
  consumptionPerTick?: Record<string, number>;
}> = {
  // INFANTERÍA - Sin requisitos
  "infantry": {
    required: [],
    optional: ["supply_depot"],
    maxTicksWithoutResupply: Infinity,
  },
  
  // TANQUES - Requieren gasolina
  "light_tank": {
    required: [],
    optional: ["supply_depot", "railway"],
    maxTicksWithoutResupply: 15,
    consumptionPerTick: { gasoline: 0.5 },
  },
  "medium_tank": {
    required: [],
    optional: ["supply_depot", "railway"],
    maxTicksWithoutResupply: 10,
    consumptionPerTick: { gasoline: 1 },
  },
  "heavy_tank": {
    required: [],
    optional: ["supply_depot", "railway"],
    maxTicksWithoutResupply: 8,
    consumptionPerTick: { gasoline: 1.5 },
  },
  
  // ARTILLERÍA - Sin requisitos especiales
  "artillery": {
    required: [],
    optional: ["supply_depot", "railway"],
    maxTicksWithoutResupply: Infinity,
  },
  "rocket_artillery": {
    required: [],
    optional: ["supply_depot", "railway"],
    maxTicksWithoutResupply: 12,
    consumptionPerTick: { gasoline: 0.8 },
  },
  
  // AVIACIÓN - REQUIEREN AIRFIELD PARA ATERRIZAR
  "fighter": {
    required: ["airfield", "small_airfield"],  // Puede usar cualquiera
    optional: ["railway"],
    maxTicksWithoutResupply: 40,  // Sin repostar
    consumptionPerTick: { gasoline: 1.5 },
  },
  "bomber": {
    required: ["airfield"],  // Solo airfield grande
    optional: ["railway"],
    maxTicksWithoutResupply: 35,
    consumptionPerTick: { gasoline: 2.5 },
  },
  "transport": {
    required: ["airfield", "small_airfield"],
    optional: ["railway"],
    maxTicksWithoutResupply: 45,
    consumptionPerTick: { gasoline: 1 },
  },
  
  // MARINA - REQUIEREN PUERTO PARA ATRACAR
  "destroyer": {
    required: ["port", "small_port"],
    optional: ["railway"],
    maxTicksWithoutResupply: 50,
    consumptionPerTick: { gasoline: 2 },
  },
  "cruiser": {
    required: ["port"],  // Solo puerto grande
    optional: ["railway"],
    maxTicksWithoutResupply: 40,
    consumptionPerTick: { gasoline: 3.5 },
  },
  "carrier": {
    required: ["port"],  // Solo puerto grande
    optional: ["railway"],
    maxTicksWithoutResupply: 30,
    consumptionPerTick: { gasoline: 5 },
  },
  "submarine": {
    required: ["port", "small_port"],
    optional: ["railway"],
    maxTicksWithoutResupply: 50,
    consumptionPerTick: { gasoline: 1 },
  },
};

/**
 * Verifica si una provincia tiene la infraestructura requerida para un tipo de unidad
 */
export function hasRequiredInfrastructure(
  buildings: Building[],
  unitType: string,
  allowEmergencyLanding: boolean = false
): boolean {
  const requirements = UNIT_INFRASTRUCTURE_REQUIREMENTS[unitType];
  if (!requirements || requirements.required.length === 0) {
    return true;  // Sin requisitos
  }

  // Obtener tipos de edificios en la provincia
  const buildingTypes = buildings.map((b) => b.type);

  // Verificar si tiene al menos UNA de las infraestructuras requeridas
  const hasInfra = requirements.required.some((infraType) =>
    buildingTypes.includes(infraType)
  );

  if (!hasInfra && !allowEmergencyLanding) {
    return false;  // No tiene la infraestructura
  }

  return true;
}

/**
 * Calcula bonus de movimiento por railways
 * +20% velocidad por cada railway (acumulativo)
 */
export function calculateMovementBonus(buildings: Building[]): number {
  const railwayCount = buildings.filter((b) => b.type === "railway").length;
  return 1 + railwayCount * 0.2;  // 1.0, 1.2, 1.4, 1.6, etc.
}

/**
 * Calcula penalty si NO hay infraestructura requerida (aterrizaje forzado)
 */
export function calculateEmergencyLandingPenalty(): {
  hpDamagePercent: number;
  efficiencyReduction: number;
} {
  return {
    hpDamagePercent: 30 + Math.random() * 20,  // 30-50% daño
    efficiencyReduction: 0.5,  // Eficiencia al 50%
  };
}

/**
 * Obtiene el máximo de ticks que una unidad puede estar sin repostar
 */
export function getMaxTicksWithoutResupply(unitType: string): number {
  const requirements = UNIT_INFRASTRUCTURE_REQUIREMENTS[unitType];
  return requirements?.maxTicksWithoutResupply ?? Infinity;
}

/**
 * Verifica si una unidad PUEDE MOVERSE a una provincia destino
 * Lógica completa: chequeea infraestructura, gasolina, etc.
 */
export function canMoveToProvince(
  unitType: string,
  destinationBuildings: Building[],
  currentGasoline: number,
  currentSupply: number
): {
  canMove: boolean;
  reason?: string;
} {
  const requirements = UNIT_INFRASTRUCTURE_REQUIREMENTS[unitType];

  if (!requirements) {
    return { canMove: false, reason: "Unknown unit type" };
  }

  // Verificar infraestructura requerida
  const buildingTypes = destinationBuildings.map((b) => b.type);
  const hasInfra = requirements.required.length === 0 ||
    requirements.required.some((infraType) => buildingTypes.includes(infraType));

  if (!hasInfra) {
    // Unidades aéreas/navales sin infraestructura = NO PUEDEN MOVERSE
    if (
      unitType.includes("fighter") ||
      unitType.includes("bomber") ||
      unitType.includes("transport") ||
      unitType.includes("destroyer") ||
      unitType.includes("cruiser") ||
      unitType.includes("carrier") ||
      unitType.includes("submarine")
    ) {
      return {
        canMove: false,
        reason: `Cannot move to destination: Missing required infrastructure (${requirements.required.join(
          ", "
        )})`,
      };
    }
  }

  // Verificar gasolina si es tanque
  if (unitType.includes("tank")) {
    const gasConsumption = requirements.consumptionPerTick?.gasoline ?? 0;
    if (gasConsumption > 0 && currentGasoline < gasConsumption) {
      return {
        canMove: false,
        reason: `Insufficient gasoline (have ${currentGasoline}, need ${gasConsumption})`,
      };
    }
  }

  // Verificar supply mínimo
  if (currentSupply <= 0) {
    return {
      canMove: false,
      reason: "No supply available (army will desert)",
    };
  }

  return { canMove: true };
}

/**
 * Calcula penalidad de defensa por fortaleza
 */
export function getDefenseBonus(buildings: Building[]): number {
  const hasFortress = buildings.some((b) => b.type === "fortress");
  return hasFortress ? 1.4 : 1.0;  // +40% defensa con fortress
}

/**
 * Calcula tiempo de ocupación/conquista de provincia
 */
export function calculateConquestTime(buildings: Building[], baseTime: number = 30): number {
  let totalTime = baseTime;

  // Fortress aumenta tiempo de conquista
  const fortressCount = buildings.filter((b) => b.type === "fortress").length;
  totalTime *= 1 + fortressCount * 0.3;  // +30% por cada fortress

  return Math.ceil(totalTime);
}
