import { FACTIONS, type FactionId } from "../catalog/factions";
import { UNIT_TYPES, type UnitType } from "../catalog/unitTypes";

// Instancia en partida (lo mínimo necesario para combate)
export interface UnitInstance {
  id: string;
  owner: FactionId;
  typeId: keyof typeof UNIT_TYPES;
  hp: number;          // 0..hpMax
  morale: number;      // 0..100
  supply: number;      // 0..100
  experience: number;  // 0..100
}

export interface CombatResult {
  attackerDamage: number; // daño que recibe atacante
  defenderDamage: number; // daño que recibe defensor
  attackerDestroyed: boolean;
  defenderDestroyed: boolean;
  notes: string[];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** 0.5..1.2 aprox */
function moraleMod(morale: number): number {
  const m = clamp(morale, 0, 100) / 100;
  return 0.6 + m * 0.6; // 0.6..1.2
}

/** 0.3..1.0 */
function supplyMod(supply: number): number {
  const s = clamp(supply, 0, 100) / 100;
  return 0.3 + s * 0.7; // 0.3..1.0
}

/** 1.0..1.25 */
function expMod(exp: number): number {
  const e = clamp(exp, 0, 100) / 100;
  return 1.0 + e * 0.25;
}

/** HP afecta desempeño: 0.55..1.0 (nunca inútil) */
function hpPerformanceMod(hp: number, hpMax: number): number {
  const p = clamp(hp, 0, hpMax) / hpMax;
  return 0.55 + p * 0.45;
}

/** Bono por HP bajo con cap (para GER/JPN etc.) */
function lowHpBonus(hp: number, hpMax: number, factionId: FactionId): number {
  const f = FACTIONS[factionId];
  const hpPct = clamp(hp, 0, hpMax) / hpMax;

  if (hpPct >= f.lowHpStartsBelow) return 1;

  const t = (f.lowHpStartsBelow - hpPct) / f.lowHpStartsBelow; // 0..1
  const bonus = Math.min(f.lowHpDamageBonusCap, t * f.lowHpDamageBonusCap);
  return 1 + bonus;
}

/**
 * Daño final por tick (simple y balanceable)
 * - Usa softAttack/hardAttack si luego metes armor, por ahora usamos un "attack" genérico:
 *   attack = softAttack (default)
 */
function computeDamage(
  attackerType: UnitType,
  attacker: UnitInstance,
  defenderType: UnitType,
  defender: UnitInstance
): number {
  const fAtk = FACTIONS[attacker.owner];
  const fDef = FACTIONS[defender.owner];

  // ataque base (si luego metes "armor", aquí decides soft vs hard)
  const baseAttack = attackerType.softAttack;
  const baseDefense = defenderType.defense;

  const atkMult =
    fAtk.attackMult *
    moraleMod(attacker.morale) *
    supplyMod(attacker.supply) *
    expMod(attacker.experience) *
    hpPerformanceMod(attacker.hp, attackerType.hpMax) *
    lowHpBonus(attacker.hp, attackerType.hpMax, attacker.owner);

  const defMult =
    fDef.defenseMult *
    moraleMod(defender.morale) *
    supplyMod(defender.supply) *
    hpPerformanceMod(defender.hp, defenderType.hpMax);

  // defensa efectiva (mitiga parte del daño)
  const effectiveDefense = baseDefense * defMult;

  // daño bruto
  const raw = baseAttack * atkMult;

  // mitigación: defensa reduce, pero nunca bloquea todo
  const mitigated = raw - effectiveDefense * 0.5;

  // facción defensora puede recibir más/menos daño
  const afterFaction = mitigated * fDef.damageTakenMult;

  // mínimo 1 si hay combate
  return Math.max(1, Math.round(afterFaction));
}

/**
 * Resuelve combate 1v1 por tick (simétrico).
 * Aplicas el resultado fuera: hp -= damageRecibido
 */
export function resolveDuel(attacker: UnitInstance, defender: UnitInstance): CombatResult {
  const notes: string[] = [];

  const aType = UNIT_TYPES[attacker.typeId];
  const dType = UNIT_TYPES[defender.typeId];

  if (!aType) throw new Error(`Unit type no existe: ${attacker.typeId}`);
  if (!dType) throw new Error(`Unit type no existe: ${defender.typeId}`);

  const dmgToDef = computeDamage(aType, attacker, dType, defender);
  const dmgToAtk = computeDamage(dType, defender, aType, attacker);

  notes.push(`A->D ${dmgToDef} | D->A ${dmgToAtk}`);

  const defenderDestroyed = defender.hp - dmgToDef <= 0;
  const attackerDestroyed = attacker.hp - dmgToAtk <= 0;

  return {
    attackerDamage: dmgToAtk,
    defenderDamage: dmgToDef,
    attackerDestroyed,
    defenderDestroyed,
    notes,
  };
}
