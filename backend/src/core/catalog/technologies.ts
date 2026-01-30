/**
 * Catálogo de tecnologías del juego.
 * Inicializa el árbol tecnológico con todas las tecnologías disponibles.
 */

import type { TechTree, TechType } from "../entities/technology";
import { createTechTree, addTechnology, GameEra } from "../entities/technology";

/**
 * Inicializa el árbol tecnológico completo para una facción
 */
export function initializeTechTree(factionId: string): TechTree {
  const tree = createTechTree(factionId);
  
  // ============ TANK ARMOR ============
  addTechnology(
    tree,
    "tank_armor_i",
    "Tank Armor I",
    "Mejora básica de blindaje para tanques (+10% defensa)",
    200,
    { tank_defense: 0.1 },
    [],
    GameEra.EARLY
  );
  
  addTechnology(
    tree,
    "tank_armor_ii",
    "Tank Armor II",
    "Blindaje avanzado (+20% defensa)",
    300,
    { tank_defense: 0.2 },
    ["tank_armor_i"],
    GameEra.MID
  );
  
  addTechnology(
    tree,
    "tank_armor_iii",
    "Tank Armor III",
    "Blindaje ultra-reforzado (+30% defensa)",
    400,
    { tank_defense: 0.3 },
    ["tank_armor_ii"],
    GameEra.MID
  );
  
  // ============ TANK ENGINE ============
  addTechnology(
    tree,
    "tank_engine_i",
    "Tank Engine I",
    "Motores mejorados (+15% velocidad, -10% consumo)",
    200,
    { tank_speed: 0.15, gasoline_consumption: -0.1 },
    [],
    GameEra.EARLY
  );
  
  addTechnology(
    tree,
    "tank_engine_ii",
    "Tank Engine II",
    "Motores de alto rendimiento (+25% velocidad, -20% consumo)",
    300,
    { tank_speed: 0.25, gasoline_consumption: -0.2 },
    ["tank_engine_i"],
    GameEra.MID
  );
  
  addTechnology(
    tree,
    "tank_engine_iii",
    "Tank Engine III",
    "Motores post-guerra (+40% velocidad, -30% consumo)",
    400,
    { tank_speed: 0.4, gasoline_consumption: -0.3 },
    ["tank_engine_ii"],
    GameEra.LATE
  );
  
  // ============ TANK TURRET ============
  addTechnology(
    tree,
    "tank_turret_i",
    "Tank Turret I",
    "Torreta mejorada (+15% potencia de fuego)",
    250,
    { tank_firepower: 0.15, ammo_consumption: 0.05 },
    [],
    GameEra.EARLY
  );
  
  addTechnology(
    tree,
    "tank_turret_ii",
    "Tank Turret II",
    "Torreta de precisión avanzada (+30% potencia de fuego)",
    350,
    { tank_firepower: 0.3, ammo_consumption: 0.1 },
    ["tank_turret_i"],
    GameEra.MID
  );
  
  // ============ INFANTRY WEAPONS ============
  addTechnology(
    tree,
    "infantry_weapons_i",
    "Infantry Weapons I",
    "Armas de infantería mejoradas (+20% daño)",
    180,
    { infantry_firepower: 0.2, ammo_consumption: 0.1 },
    [],
    GameEra.EARLY
  );
  
  addTechnology(
    tree,
    "infantry_weapons_ii",
    "Infantry Weapons II",
    "Equipamiento de infantería avanzado (+40% daño)",
    280,
    { infantry_firepower: 0.4, ammo_consumption: 0.15 },
    ["infantry_weapons_i"],
    GameEra.MID
  );
  
  // ============ AIR SUPERIORITY ============
  addTechnology(
    tree,
    "air_superiority_i",
    "Air Superiority I",
    "Mejora de aviones (+20% velocidad y potencia de fuego)",
    250,
    { fighter_speed: 0.2, fighter_firepower: 0.2 },
    [],
    GameEra.EARLY
  );
  
  addTechnology(
    tree,
    "air_superiority_ii",
    "Air Superiority II",
    "Dominio aéreo total (+40% velocidad y potencia de fuego)",
    350,
    { fighter_speed: 0.4, fighter_firepower: 0.4 },
    ["air_superiority_i"],
    GameEra.MID
  );
  
  // ============ INDUSTRIAL PRODUCTION ============
  addTechnology(
    tree,
    "industrial_production_i",
    "Industrial Production I",
    "Producción de fábricas mejorada (+20% velocidad)",
    300,
    { factory_speed: 0.2 },
    [],
    GameEra.EARLY
  );
  
  addTechnology(
    tree,
    "industrial_production_ii",
    "Industrial Production II",
    "Cadena de montaje avanzada (+40% velocidad)",
    400,
    { factory_speed: 0.4 },
    ["industrial_production_i"],
    GameEra.MID
  );
  
  // ============ RESOURCE EFFICIENCY ============
  addTechnology(
    tree,
    "resource_efficiency_i",
    "Resource Efficiency I",
    "Uso eficiente de recursos (-15% costos de construcción)",
    250,
    { construction_cost: -0.15 },
    [],
    GameEra.EARLY
  );
  
  addTechnology(
    tree,
    "resource_efficiency_ii",
    "Resource Efficiency II",
    "Optimización extrema (-30% costos de construcción)",
    350,
    { construction_cost: -0.3 },
    ["resource_efficiency_i"],
    GameEra.MID
  );
  
  // ============ LOGISTICS ============
  addTechnology(
    tree,
    "logistics_i",
    "Logistics I",
    "Logística mejorada (+20% supply production, -10% consumption)",
    200,
    { supply_production: 0.2, supply_consumption: -0.1 },
    [],
    GameEra.EARLY
  );
  
  addTechnology(
    tree,
    "logistics_ii",
    "Logistics II",
    "Sistema logístico avanzado (+40% supply production, -20% consumption)",
    300,
    { supply_production: 0.4, supply_consumption: -0.2 },
    ["logistics_i"],
    GameEra.MID
  );
  
  // ============ FORTIFICATIONS ============
  addTechnology(
    tree,
    "fortifications_i",
    "Fortifications I",
    "Defensas mejoradas (+20% defensa provincial)",
    200,
    { defense_bonus: 0.2 },
    [],
    GameEra.EARLY
  );
  
  addTechnology(
    tree,
    "fortifications_ii",
    "Fortifications II",
    "Defensas ultra-reforzadas (+40% defensa provincial)",
    300,
    { defense_bonus: 0.4 },
    ["fortifications_i"],
    GameEra.MID
  );
  
  // ============ NAVAL WARFARE ============
  addTechnology(
    tree,
    "naval_warfare_i",
    "Naval Warfare I",
    "Guerra naval mejorada (+20% potencia naval)",
    300,
    { naval_firepower: 0.2, naval_defense: 0.15 },
    [],
    GameEra.MID
  );
  
  addTechnology(
    tree,
    "naval_warfare_ii",
    "Naval Warfare II",
    "Dominio naval (+40% potencia naval)",
    400,
    { naval_firepower: 0.4, naval_defense: 0.3 },
    ["naval_warfare_i"],
    GameEra.MID
  );
  
  return tree;
}

/**
 * Obtiene las tecnologías disponibles por era
 */
export function getTechsByEra(tree: TechTree, era: string): any[] {
  return Object.values(tree.technologies).filter(
    (tech) => tech.era === era
  );
}
