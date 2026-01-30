import { FACTIONS, type FactionId } from "../catalog/factions";
import { UNIT_TYPES, type UnitType, getDefenseType, getAttackDamage } from "../catalog/unitTypes";

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
  attackerForceRetreated: boolean; // retiro forzado por supply bajo
  defenderForceRetreated: boolean;
  attackerExpGained: number; // experiencia ganada en combate
  defenderExpGained: number;
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

/** Penalización por HP bajo: 0.5..1.0 según hp/hpMax */
function hpPerformanceMod(hp: number, hpMax: number): number {
  if (hpMax <= 0) return 0.5;
  const pct = clamp(hp, 0, hpMax) / hpMax;
  return 0.5 + pct * 0.5; // 0.5 cuando HP=0, 1.0 cuando HP=100%
}

/** Retiro forzado si supply < 20% */
function checkForceRetreat(unit: UnitInstance): boolean {
  return unit.supply < 20;
}

/**
 * Experiencia ganada en combate:
 * - Base: 5 puntos por combate
 * - +2 si fue atacante
 * - +3 si causó daño significativo (>50% del HP enemigo)
 * - +2 si sobrevivió todo el combate
 */
function calcExperienceGain(
  isAttacker: boolean,
  damageDealt: number,
  damageReceived: number,
  enemyHpMax: number,
  survived: boolean
): number {
  let exp = 5; // base
  if (isAttacker) exp += 2;
  if (damageDealt > enemyHpMax * 0.5) exp += 3;
  if (survived) exp += 2;
  return exp;
}

/**
 * Bono de veteranía por experiencia:
 * - Cada 20 exp = +1% ataque (max +20% a 100 exp)
 */
function veterancyAttackBonus(experience: number): number {
  const vet = Math.floor(Math.min(experience, 100) / 20);
  return 1 + vet * 0.01; // 1.0 a 1.05
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
 * - Selecciona el daño correcto del AttackProfile según el tipo del defensor
 */
function computeDamage(
  attackerType: UnitType,
  attacker: UnitInstance,
  defenderType: UnitType,
  defender: UnitInstance
): number {
  const fAtk = FACTIONS[attacker.owner];
  const fDef = FACTIONS[defender.owner];

  // Determina qué tipo de defensa tiene el defensor
  const defenseType = getDefenseType(defenderType);
  
  // Obtiene el daño base del atacante contra ese tipo defensivo
  const baseAttack = getAttackDamage(attackerType, defenseType);
  const baseDefense = defenderType.defense;

  const atkMult =
    fAtk.attackMult *
    moraleMod(attacker.morale) *
    supplyMod(attacker.supply) *
    expMod(attacker.experience) *
    hpPerformanceMod(attacker.hp, attackerType.hpMax) *
    lowHpBonus(attacker.hp, attackerType.hpMax, attacker.owner) *
    veterancyAttackBonus(attacker.experience);

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
 * Aplicas el resultado fuera: hp -= damageRecibido, experience += expGain
 */
export function resolveDuel(attacker: UnitInstance, defender: UnitInstance): CombatResult {
  const notes: string[] = [];

  const aType = UNIT_TYPES[attacker.typeId];
  const dType = UNIT_TYPES[defender.typeId];

  if (!aType) throw new Error(`Unit type no existe: ${attacker.typeId}`);
  if (!dType) throw new Error(`Unit type no existe: ${defender.typeId}`);

  // Chequea retiro forzado ANTES de combate
  const attackerRetreats = checkForceRetreat(attacker);
  const defenderRetreats = checkForceRetreat(defender);

  if (attackerRetreats) notes.push("Atacante se retira: supply crítico (<20%)");
  if (defenderRetreats) notes.push("Defensor se retira: supply crítico (<20%)");

  const dmgToDef = computeDamage(aType, attacker, dType, defender);
  const dmgToAtk = computeDamage(dType, defender, aType, attacker);

  notes.push(`A->D ${dmgToDef} | D->A ${dmgToAtk}`);

  const defenderDestroyed = defender.hp - dmgToDef <= 0;
  const attackerDestroyed = attacker.hp - dmgToAtk <= 0;

  // Experiencia ganada
  const atkExpGained = calcExperienceGain(
    true,
    dmgToDef,
    dmgToAtk,
    dType.hpMax,
    !attackerDestroyed && !attackerRetreats
  );
  const defExpGained = calcExperienceGain(
    false,
    dmgToAtk,
    dmgToDef,
    aType.hpMax,
    !defenderDestroyed && !defenderRetreats
  );

  return {
    attackerDamage: dmgToAtk,
    defenderDamage: dmgToDef,
    attackerDestroyed,
    defenderDestroyed,
    attackerForceRetreated: attackerRetreats,
    defenderForceRetreated: defenderRetreats,
    attackerExpGained: atkExpGained,
    defenderExpGained: defExpGained,
    notes,
  };
}
