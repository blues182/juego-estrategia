// backend/src/core/catalog/unitTypes.ts

export type Domain = "land" | "air" | "naval" | "support" | "logistics";

export type UnitTypeId =
  // Marina
  | "carrier"
  | "destroyer"
  | "battleship"
  | "submarine"
  | "troop_transport"
  | "cargo_ship"
  | "sea_mines"
  // Aero
  | "fighter"
  | "strategic_bomber"
  | "offensive_bomber"
  | "tactical_bomber"
  | "naval_bomber"
  | "jet_fighter"
  // Artillería
  | "aa_gun"
  | "at_gun"
  | "field_artillery"
  // Vehículos
  | "recon_jeep"
  | "light_armored_car"
  | "spg_artillery"
  | "mobile_aa"
  | "light_tank"
  | "medium_tank"
  | "heavy_tank"
  | "railway_gun"
  | "rocket_artillery"
  | "truck_cargo"
  | "landing_vehicle"
  // Infantería
  | "infantry"
  | "commandos"
  | "paratroopers"
  | "sappers"
  | "engineers"
  | "land_mines";

export interface AttackProfile {
  vsInfantry: number;   // daño base contra infantería
  vsArmor: number;      // daño base contra blindados
  vsAir: number;        // daño base contra aéreo
  vsNaval: number;      // daño base contra naval
  vsStructures: number; // daño base contra estructuras
}

export interface UnitType {
  id: UnitTypeId;
  name: string;
  domain: Domain;

  hpMax: number;     // 100 recomendado
  defense: number;   // mitiga daño recibido (base)
  speed: number;     // “pasos” por tick (1 min). Tierra suele 1.
  supplyUse: number; // consumo logístico base (abstracto)

  attack: AttackProfile;

  // Tags útiles para reglas (no obligatorio)
  tags?: string[]; // ej: ["transport", "elite", "siege"]
}

/**
 * Determina qué categoría defensiva tiene una unidad para seleccionar daño correcto
 */
export type DefenseType = "infantry" | "armor" | "air" | "naval" | "structures";

export function getDefenseType(unitType: UnitType): DefenseType {
  if (unitType.tags?.includes("armor")) return "armor";
  if (unitType.domain === "air") return "air";
  if (unitType.domain === "naval") return "naval";
  if (unitType.tags?.includes("structure")) return "structures";
  return "infantry";
}

/**
 * Obtiene el daño que hace un atacante contra un tipo defensivo
 */
export function getAttackDamage(attackerType: UnitType, defenseType: DefenseType): number {
  switch (defenseType) {
    case "infantry":
      return attackerType.attack.vsInfantry;
    case "armor":
      return attackerType.attack.vsArmor;
    case "air":
      return attackerType.attack.vsAir;
    case "naval":
      return attackerType.attack.vsNaval;
    case "structures":
      return attackerType.attack.vsStructures;
  }
}

/**
 * Set base balanceado (EDITABLE):
 * - HP=100 para casi todo (simple UI).
 * - Ataques separados por tipo, como dicen tus reglas.
 * - Ajusta números después con playtests.
 */
export const UNIT_TYPES: Record<UnitTypeId, UnitType> = {
  // =======================
  // MARINA
  // =======================
  carrier: {
    id: "carrier",
    name: "Portaaviones",
    domain: "naval",
    hpMax: 100,
    defense: 16,
    speed: 1,
    supplyUse: 5,
    attack: { vsInfantry: 3, vsArmor: 3, vsAir: 18, vsNaval: 10, vsStructures: 6 },
    tags: ["capital_ship", "air_platform"],
  },
  destroyer: {
    id: "destroyer",
    name: "Destructor",
    domain: "naval",
    hpMax: 100,
    defense: 12,
    speed: 2,
    supplyUse: 3,
    attack: { vsInfantry: 2, vsArmor: 2, vsAir: 8, vsNaval: 12, vsStructures: 3 },
    tags: ["escort", "anti_sub"],
  },
  battleship: {
    id: "battleship",
    name: "Acorazado",
    domain: "naval",
    hpMax: 100,
    defense: 20,
    speed: 1,
    supplyUse: 6,
    attack: { vsInfantry: 6, vsArmor: 6, vsAir: 2, vsNaval: 18, vsStructures: 14 },
    tags: ["capital_ship", "siege"],
  },
  submarine: {
    id: "submarine",
    name: "Submarino",
    domain: "naval",
    hpMax: 100,
    defense: 8,
    speed: 2,
    supplyUse: 2,
    attack: { vsInfantry: 0, vsArmor: 0, vsAir: 0, vsNaval: 16, vsStructures: 0 },
    tags: ["stealth", "anti_convoy"],
  },
  troop_transport: {
    id: "troop_transport",
    name: "Transporte de personal",
    domain: "logistics",
    hpMax: 100,
    defense: 6,
    speed: 2,
    supplyUse: 2,
    attack: { vsInfantry: 0, vsArmor: 0, vsAir: 0, vsNaval: 1, vsStructures: 0 },
    tags: ["transport"],
  },
  cargo_ship: {
    id: "cargo_ship",
    name: "Transporte de mercancía",
    domain: "logistics",
    hpMax: 100,
    defense: 6,
    speed: 2,
    supplyUse: 2,
    attack: { vsInfantry: 0, vsArmor: 0, vsAir: 0, vsNaval: 1, vsStructures: 0 },
    tags: ["logistics", "trade"],
  },
  sea_mines: {
    id: "sea_mines",
    name: "Minas submarinas",
    domain: "support",
    hpMax: 100,
    defense: 2,
    speed: 0,
    supplyUse: 1,
    attack: { vsInfantry: 0, vsArmor: 0, vsAir: 0, vsNaval: 10, vsStructures: 0 },
    tags: ["area_denial"],
  },

  // =======================
  // AERO
  // =======================
  fighter: {
    id: "fighter",
    name: "Caza",
    domain: "air",
    hpMax: 100,
    defense: 8,
    speed: 3,
    supplyUse: 3,
    attack: { vsInfantry: 4, vsArmor: 2, vsAir: 16, vsNaval: 3, vsStructures: 1 },
    tags: ["air_superiority"],
  },
  strategic_bomber: {
    id: "strategic_bomber",
    name: "Bombardero estratégico",
    domain: "air",
    hpMax: 100,
    defense: 10,
    speed: 2,
    supplyUse: 5,
    attack: { vsInfantry: 6, vsArmor: 6, vsAir: 2, vsNaval: 4, vsStructures: 18 },
    tags: ["structure_damage"],
  },
  offensive_bomber: {
    id: "offensive_bomber",
    name: "Bombardero ofensivo",
    domain: "air",
    hpMax: 100,
    defense: 9,
    speed: 2,
    supplyUse: 4,
    attack: { vsInfantry: 12, vsArmor: 10, vsAir: 1, vsNaval: 6, vsStructures: 8 },
    tags: ["ground_attack"],
  },
  tactical_bomber: {
    id: "tactical_bomber",
    name: "Bombardero táctico",
    domain: "air",
    hpMax: 100,
    defense: 9,
    speed: 2,
    supplyUse: 4,
    attack: { vsInfantry: 10, vsArmor: 8, vsAir: 1, vsNaval: 5, vsStructures: 6 },
    tags: ["flexible"],
  },
  naval_bomber: {
    id: "naval_bomber",
    name: "Bombardero naval",
    domain: "air",
    hpMax: 100,
    defense: 8,
    speed: 2,
    supplyUse: 4,
    attack: { vsInfantry: 2, vsArmor: 2, vsAir: 1, vsNaval: 16, vsStructures: 2 },
    tags: ["anti_ship"],
  },
  jet_fighter: {
    id: "jet_fighter",
    name: "Caza a reacción",
    domain: "air",
    hpMax: 100,
    defense: 9,
    speed: 4,
    supplyUse: 4,
    attack: { vsInfantry: 5, vsArmor: 2, vsAir: 20, vsNaval: 3, vsStructures: 1 },
    tags: ["late_game"],
  },

  // =======================
  // ARTILLERÍA
  // =======================
  aa_gun: {
    id: "aa_gun",
    name: "Antiaéreo",
    domain: "support",
    hpMax: 100,
    defense: 6,
    speed: 1,
    supplyUse: 2,
    attack: { vsInfantry: 3, vsArmor: 2, vsAir: 18, vsNaval: 0, vsStructures: 2 },
    tags: ["anti_air"],
  },
  at_gun: {
    id: "at_gun",
    name: "Antitanques",
    domain: "support",
    hpMax: 100,
    defense: 7,
    speed: 1,
    supplyUse: 2,
    attack: { vsInfantry: 2, vsArmor: 16, vsAir: 0, vsNaval: 0, vsStructures: 2 },
    tags: ["anti_armor"],
  },
  field_artillery: {
    id: "field_artillery",
    name: "Artillería",
    domain: "support",
    hpMax: 100,
    defense: 5,
    speed: 1,
    supplyUse: 3,
    attack: { vsInfantry: 18, vsArmor: 6, vsAir: 0, vsNaval: 0, vsStructures: 10 },
    tags: ["siege", "support_fire"],
  },

  // =======================
  // VEHÍCULOS
  // =======================
  recon_jeep: {
    id: "recon_jeep",
    name: "Jeep de exploración",
    domain: "land",
    hpMax: 100,
    defense: 4,
    speed: 2,
    supplyUse: 1,
    attack: { vsInfantry: 4, vsArmor: 2, vsAir: 0, vsNaval: 0, vsStructures: 1 },
    tags: ["recon"],
  },
  light_armored_car: {
    id: "light_armored_car",
    name: "Blindado ligero",
    domain: "land",
    hpMax: 100,
    defense: 8,
    speed: 2,
    supplyUse: 2,
    attack: { vsInfantry: 8, vsArmor: 6, vsAir: 0, vsNaval: 0, vsStructures: 2 },
    tags: ["mobile"],
  },
  spg_artillery: {
    id: "spg_artillery",
    name: "Artillería AP (autopropulsada)",
    domain: "land",
    hpMax: 100,
    defense: 10,
    speed: 1,
    supplyUse: 3,
    attack: { vsInfantry: 16, vsArmor: 10, vsAir: 0, vsNaval: 0, vsStructures: 8 },
    tags: ["support_fire"],
  },
  mobile_aa: {
    id: "mobile_aa",
    name: "AA móviles",
    domain: "land",
    hpMax: 100,
    defense: 9,
    speed: 1,
    supplyUse: 2,
    attack: { vsInfantry: 4, vsArmor: 4, vsAir: 16, vsNaval: 0, vsStructures: 2 },
    tags: ["anti_air"],
  },
  light_tank: {
    id: "light_tank",
    name: "Tanque ligero",
    domain: "land",
    hpMax: 100,
    defense: 12,
    speed: 1,
    supplyUse: 3,
    attack: { vsInfantry: 12, vsArmor: 14, vsAir: 0, vsNaval: 0, vsStructures: 4 },
    tags: ["armor"],
  },
  medium_tank: {
    id: "medium_tank",
    name: "Tanque blindado mediano",
    domain: "land",
    hpMax: 100,
    defense: 16,
    speed: 1,
    supplyUse: 4,
    attack: { vsInfantry: 14, vsArmor: 18, vsAir: 0, vsNaval: 0, vsStructures: 5 },
    tags: ["armor"],
  },
  heavy_tank: {
    id: "heavy_tank",
    name: "Tanque blindado pesado",
    domain: "land",
    hpMax: 100,
    defense: 20,
    speed: 1,
    supplyUse: 5,
    attack: { vsInfantry: 16, vsArmor: 22, vsAir: 0, vsNaval: 0, vsStructures: 6 },
    tags: ["armor"],
  },
  railway_gun: {
    id: "railway_gun",
    name: "Cañón ferroviario",
    domain: "support",
    hpMax: 100,
    defense: 6,
    speed: 1,
    supplyUse: 4,
    attack: { vsInfantry: 22, vsArmor: 10, vsAir: 0, vsNaval: 0, vsStructures: 18 },
    tags: ["siege", "heavy_support"],
  },
  rocket_artillery: {
    id: "rocket_artillery",
    name: "Artillería AP de cohetes",
    domain: "support",
    hpMax: 100,
    defense: 5,
    speed: 1,
    supplyUse: 4,
    attack: { vsInfantry: 26, vsArmor: 8, vsAir: 0, vsNaval: 0, vsStructures: 12 },
    tags: ["siege"],
  },
  truck_cargo: {
    id: "truck_cargo",
    name: "Transporte de mercancía (camiones)",
    domain: "logistics",
    hpMax: 100,
    defense: 3,
    speed: 2,
    supplyUse: 1,
    attack: { vsInfantry: 0, vsArmor: 0, vsAir: 0, vsNaval: 0, vsStructures: 0 },
    tags: ["logistics"],
  },
  landing_vehicle: {
    id: "landing_vehicle",
    name: "Vehículos de desembarco",
    domain: "logistics",
    hpMax: 100,
    defense: 6,
    speed: 2,
    supplyUse: 2,
    attack: { vsInfantry: 1, vsArmor: 1, vsAir: 0, vsNaval: 1, vsStructures: 0 },
    tags: ["amphibious", "transport"],
  },

  // =======================
  // INFANTERÍA
  // =======================
  infantry: {
    id: "infantry",
    name: "Infantería",
    domain: "land",
    hpMax: 100,
    defense: 10,
    speed: 1,
    supplyUse: 1,
    attack: { vsInfantry: 10, vsArmor: 3, vsAir: 0, vsNaval: 0, vsStructures: 2 },
    tags: ["line"],
  },
  commandos: {
    id: "commandos",
    name: "Comandos",
    domain: "land",
    hpMax: 100,
    defense: 9,
    speed: 1,
    supplyUse: 2,
    attack: { vsInfantry: 14, vsArmor: 4, vsAir: 0, vsNaval: 0, vsStructures: 5 },
    tags: ["elite"],
  },
  paratroopers: {
    id: "paratroopers",
    name: "Aerotransportada",
    domain: "land",
    hpMax: 100,
    defense: 8,
    speed: 1,
    supplyUse: 2,
    attack: { vsInfantry: 12, vsArmor: 3, vsAir: 0, vsNaval: 0, vsStructures: 3 },
    tags: ["airborne"],
  },
  sappers: {
    id: "sappers",
    name: "Zapadores",
    domain: "land",
    hpMax: 100,
    defense: 9,
    speed: 1,
    supplyUse: 2,
    attack: { vsInfantry: 10, vsArmor: 4, vsAir: 0, vsNaval: 0, vsStructures: 8 },
    tags: ["siege", "demolition"],
  },
  engineers: {
    id: "engineers",
    name: "Ingenieros",
    domain: "support",
    hpMax: 100,
    defense: 7,
    speed: 1,
    supplyUse: 2,
    attack: { vsInfantry: 6, vsArmor: 2, vsAir: 0, vsNaval: 0, vsStructures: 6 },
    tags: ["support", "build"],
  },
  land_mines: {
    id: "land_mines",
    name: "Minas (terrestres)",
    domain: "support",
    hpMax: 100,
    defense: 2,
    speed: 0,
    supplyUse: 1,
    attack: { vsInfantry: 10, vsArmor: 14, vsAir: 0, vsNaval: 0, vsStructures: 0 },
    tags: ["area_denial"],
  },
};
