export interface UnitType {
  id: string;
  name: string;
  hpMax: number;
  softAttack: number;
  hardAttack: number;
  defense: number;
  speed: number;
  supplyUse: number;
}

export const UNIT_TYPES: Record<string, UnitType> = {};
