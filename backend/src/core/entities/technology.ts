/**
 * Sistema de tecnología e investigación con Eras históricas.
 * Las facciones invierten puntos de investigación para desbloquer upgrades.
 * 
 * ERAS HISTÓRICAS:
 * - ERA_EARLY (1938-1942): Tanques iniciales, tecnología base
 * - ERA_MID (1943-1946): Tanques pesados, producción mejorada
 * - ERA_LATE (1947-1950): Tanques post-guerra modernizados
 */

export enum GameEra {
  EARLY = "1938-1942",   // Tanques: Light, Medium
  MID = "1943-1946",     // Tanques: Heavy, Super-Heavy
  LATE = "1947-1950",    // Tanques: Modernizados
}

export type TechType = 
  // TANK UPGRADES
  | "tank_armor_i"
  | "tank_armor_ii"
  | "tank_armor_iii"
  | "tank_engine_i"
  | "tank_engine_ii"
  | "tank_engine_iii"
  | "tank_turret_i"
  | "tank_turret_ii"
  
  // INFANTRY
  | "infantry_weapons_i"
  | "infantry_weapons_ii"
  
  // AIR
  | "air_superiority_i"
  | "air_superiority_ii"
  
  // PRODUCTION
  | "industrial_production_i"
  | "industrial_production_ii"
  
  // ECONOMY
  | "resource_efficiency_i"
  | "resource_efficiency_ii"
  
  // LOGISTICS
  | "logistics_i"
  | "logistics_ii"
  
  // DEFENSE
  | "fortifications_i"
  | "fortifications_ii"
  
  // NAVAL
  | "naval_warfare_i"
  | "naval_warfare_ii"
  
  | string;

/**
 * Un tech individual con su progreso
 */
export interface Technology {
  id: TechType;
  name: string;
  description: string;
  era?: GameEra;  // Era en que se desbloquea
  
  // Progreso de investigación
  researchPointsRequired: number;
  researchPointsCurrent: number;
  completed: boolean;
  completedAtTick?: number;
  
  // Requisitos
  prerequisiteTechs?: TechType[];
  requiredEra?: GameEra;  // Era mínima requerida
  
  // Bonus cuando se completa
  bonus: Record<string, number>;  // ej: { "tank_armor": 0.1 } = +10% armor
}

/**
 * Árbol tecnológico de una facción
 */
export interface TechTree {
  factionId: string;
  technologies: Record<TechType, Technology>;
  researchPointsPerTick: number;
  totalResearchPoints: number;
  currentEra: GameEra;
  eraUnlockedAt?: Record<GameEra, number>;  // Tick en que se desbloqueó cada era
}

/**
 * Crea un TechTree vacío para una facción
 */
export function createTechTree(factionId: string): TechTree {
  return {
    factionId,
    technologies: {},
    researchPointsPerTick: 0,
    totalResearchPoints: 0,
    currentEra: GameEra.EARLY,
    eraUnlockedAt: {
      [GameEra.EARLY]: 0,
      [GameEra.MID]: Infinity,
      [GameEra.LATE]: Infinity,
    },
  };
}

/**
 * Agrega una tecnología al árbol
 */
export function addTechnology(
  tree: TechTree,
  id: TechType,
  name: string,
  description: string,
  pointsRequired: number,
  bonus: Record<string, number>,
  prerequisites?: TechType[],
  era?: GameEra
): void {
  tree.technologies[id] = {
    id,
    name,
    description,
    era,
    researchPointsRequired: pointsRequired,
    researchPointsCurrent: 0,
    completed: false,
    prerequisiteTechs: prerequisites,
    requiredEra: era,
    bonus,
  };
}

/**
 * Verifica si un tech puede ser investigado (tiene prerequisites y era)
 */
export function canResearch(tree: TechTree, techId: TechType): boolean {
  const tech = tree.technologies[techId];
  if (!tech || tech.completed) return false;
  
  // Verificar era requerida
  if (tech.requiredEra && tree.currentEra !== tech.requiredEra) {
    return false;
  }
  
  // Verificar prerequisites
  if (tech.prerequisiteTechs) {
    return tech.prerequisiteTechs.every(
      (prereq) => tree.technologies[prereq]?.completed
    );
  }
  return true;
}

/**
 * Cambia a la siguiente era
 */
export function advanceToEra(tree: TechTree, newEra: GameEra, currentTick: number): boolean {
  if (tree.currentEra === GameEra.EARLY && newEra === GameEra.MID) {
    tree.currentEra = GameEra.MID;
    tree.eraUnlockedAt![GameEra.MID] = currentTick;
    return true;
  }
  if (tree.currentEra === GameEra.MID && newEra === GameEra.LATE) {
    tree.currentEra = GameEra.LATE;
    tree.eraUnlockedAt![GameEra.LATE] = currentTick;
    return true;
  }
  return false;
}

/**
 * Aplica investigación por tick
 */
export function tickResearch(tree: TechTree): void {
  tree.totalResearchPoints += tree.researchPointsPerTick;
  
  // Buscar techs en progreso y avanzarlas
  for (const tech of Object.values(tree.technologies)) {
    if (!tech.completed && tech.researchPointsCurrent > 0 && tree.totalResearchPoints > 0) {
      const pointsToAdd = Math.min(tree.researchPointsPerTick, tree.totalResearchPoints);
      tech.researchPointsCurrent += pointsToAdd;
      tree.totalResearchPoints -= pointsToAdd;
      
      if (tech.researchPointsCurrent >= tech.researchPointsRequired) {
        tech.completed = true;
        tech.completedAtTick = new Date().getTime(); // O pasar tick del juego
      }
    }
  }
}

/**
 * Comienza la investigación de un tech
 */
export function startResearch(tree: TechTree, techId: TechType): boolean {
  if (!canResearch(tree, techId)) return false;
  
  const tech = tree.technologies[techId];
  if (tech.researchPointsCurrent === 0) {
    tech.researchPointsCurrent = 1;
    return true;
  }
  return false;
}
