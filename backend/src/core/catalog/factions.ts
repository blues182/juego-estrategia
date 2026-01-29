export type FactionId = "GER" | "ITA" | "JPN" | "USA" | "UK" | "FRA" | "USSR";

export interface FactionModifiers {
  attackMult: number;
  defenseMult: number;
  damageTakenMult: number;

  moraleMult: number;
  supplyUseMult: number;

  lowHpDamageBonusCap: number; // ej 0.25 = +25% máx
  lowHpStartsBelow: number;    // ej 0.50 = empieza <50% HP

  retreatChanceMult: number;   // <1 se retira menos
  manpowerLossMult: number;    // >1 pierde más manpower
}

export const FACTIONS: Record<FactionId, FactionModifiers> = {
  GER: { attackMult: 1.08, defenseMult: 1.02, damageTakenMult: 1.00, moraleMult: 1.05, supplyUseMult: 1.05, lowHpDamageBonusCap: 0.25, lowHpStartsBelow: 0.50, retreatChanceMult: 1.00, manpowerLossMult: 1.00 },
  ITA: { attackMult: 1.00, defenseMult: 1.06, damageTakenMult: 0.98, moraleMult: 1.02, supplyUseMult: 0.98, lowHpDamageBonusCap: 0.10, lowHpStartsBelow: 0.40, retreatChanceMult: 1.05, manpowerLossMult: 0.98 },
  JPN: { attackMult: 1.06, defenseMult: 0.98, damageTakenMult: 1.02, moraleMult: 1.08, supplyUseMult: 1.02, lowHpDamageBonusCap: 0.20, lowHpStartsBelow: 0.55, retreatChanceMult: 0.80, manpowerLossMult: 1.15 },
  USA: { attackMult: 1.00, defenseMult: 1.00, damageTakenMult: 1.00, moraleMult: 1.00, supplyUseMult: 1.00, lowHpDamageBonusCap: 0.10, lowHpStartsBelow: 0.45, retreatChanceMult: 1.00, manpowerLossMult: 1.00 },
  UK:  { attackMult: 1.00, defenseMult: 1.00, damageTakenMult: 1.00, moraleMult: 1.00, supplyUseMult: 1.00, lowHpDamageBonusCap: 0.10, lowHpStartsBelow: 0.45, retreatChanceMult: 1.00, manpowerLossMult: 1.00 },
  FRA: { attackMult: 1.00, defenseMult: 1.00, damageTakenMult: 1.00, moraleMult: 1.00, supplyUseMult: 1.00, lowHpDamageBonusCap: 0.10, lowHpStartsBelow: 0.45, retreatChanceMult: 1.00, manpowerLossMult: 1.00 },
  USSR:{ attackMult: 1.00, defenseMult: 1.00, damageTakenMult: 1.00, moraleMult: 1.00, supplyUseMult: 1.00, lowHpDamageBonusCap: 0.10, lowHpStartsBelow: 0.45, retreatChanceMult: 1.00, manpowerLossMult: 1.00 },
};
