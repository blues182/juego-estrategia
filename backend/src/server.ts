import express, { Request, Response } from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

// Importar core
import { FACTIONS, type FactionId } from "./core/catalog/factions";
import { UNIT_TYPES } from "./core/catalog/unitTypes";
import { createGameState, getArmy, addArmy, updateCountriesProductionFromMap } from "./core/entities/gameState";
import { createDemoMap } from "./core/entities/map";
import { createCountry } from "./core/entities/country";
import { createArmy } from "./core/entities/army";
import { processTick } from "./core/services/tickEngine";
import { orderMove, orderAttack, orderHold, orderMoveDelayed, orderPatrol } from "./core/entities/orders";
import type { GameState } from "./core/entities/gameState";
import type { UnitInstance } from "./core/rules/combat";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// En memoria (para demo)
const games: Record<string, GameState> = {};

// =======================
// RUTAS API
// =======================

// Directorio para guardar partidas (snapshots JSON)
const DATA_DIR = path.join(process.cwd(), "data", "games");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * POST /games
 * Crea una nueva partida
 */
app.post("/games", (req: Request, res: Response) => {
  try {
    const gameId = uuidv4();
    const map = createDemoMap();

    // Crea países para cada facción
    const countries: Record<FactionId, any> = {
      GER: createCountry("GER"),
      ITA: createCountry("ITA"),
      JPN: createCountry("JPN"),
      USA: createCountry("USA"),
      UK: createCountry("UK"),
      FRA: createCountry("FRA"),
      USSR: createCountry("USSR"),
    };

    // Crea GameState
    const gameState = createGameState(
      gameId,
      `Partida ${gameId.substring(0, 8)}`,
      map,
      Object.keys(FACTIONS) as FactionId[],
      countries
    );

    updateCountriesProductionFromMap(gameState);

    games[gameId] = gameState;

    res.status(201).json({
      success: true,
      gameId,
      game: gameState,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /games/:gameId
 * Obtiene el estado de una partida
 */
app.get("/games/:gameId", (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = games[gameId];

    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Partida no encontrada",
      });
    }

    res.json({
      success: true,
      game,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /games/:gameId/armies
 * Crea un nuevo ejército
 */
app.post("/games/:gameId/armies", (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { owner, provinceId, units } = req.body;

    const game = games[gameId];
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Partida no encontrada",
      });
    }

    // Valida entrada
    if (!owner || !provinceId) {
      return res.status(400).json({
        success: false,
        error: "Falta owner o provinceId",
      });
    }

    const armyId = uuidv4();

    // Crea unidades si se proporcionan
    const armyUnits: UnitInstance[] = [];
    if (units && Array.isArray(units)) {
      for (const unitDef of units) {
        armyUnits.push({
          id: uuidv4(),
          owner,
          typeId: unitDef.typeId || "infantry",
          hp: UNIT_TYPES[unitDef.typeId]?.hpMax || 100,
          morale: 80,
          supply: 100,
          experience: 0,
        });
      }
    }

    const army = createArmy(armyId, owner, provinceId, armyUnits);
    addArmy(game, army);

    res.status(201).json({
      success: true,
      armyId,
      army,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /games/:gameId/orders
 * Envía una orden a un ejército: hold, move, attack, move_delayed, patrol
 * - move_delayed: targetProvinceId, delayTicks (cuántos ticks esperar; 1 tick = 5 min)
 * - patrol: solo para ejércitos con aviones (patrullar; repostaje cada 40 min por 5 min)
 */
app.post("/games/:gameId/orders", (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { armyId, orderType, targetProvinceId, targetArmyId, delayTicks } = req.body;

    const game = games[gameId];
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Partida no encontrada",
      });
    }

    const army = getArmy(game, armyId);
    if (!army) {
      return res.status(404).json({
        success: false,
        error: "Ejército no encontrado",
      });
    }

    if (orderType === "hold") {
      orderHold(army);
    } else if (orderType === "move") {
      if (!targetProvinceId) {
        return res.status(400).json({ success: false, error: "Falta targetProvinceId" });
      }
      orderMove(army, targetProvinceId);
    } else if (orderType === "attack") {
      if (!targetProvinceId) {
        return res.status(400).json({ success: false, error: "Falta targetProvinceId" });
      }
      orderAttack(army, targetProvinceId, targetArmyId);
    } else if (orderType === "move_delayed") {
      if (!targetProvinceId || delayTicks == null) {
        return res.status(400).json({ success: false, error: "Falta targetProvinceId o delayTicks" });
      }
      const ticks = Math.max(1, Math.floor(Number(delayTicks)));
      orderMoveDelayed(army, targetProvinceId, ticks, game.currentTick);
    } else if (orderType === "patrol") {
      orderPatrol(army);
    } else {
      return res.status(400).json({
        success: false,
        error: "Tipo de orden no válido (hold, move, attack, move_delayed, patrol)",
      });
    }

    res.json({
      success: true,
      army,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /games/:gameId/tick
 * Ejecuta un tick de la partida
 */
app.post("/games/:gameId/tick", (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = games[gameId];

    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Partida no encontrada",
      });
    }

    if (game.status !== "active") {
      return res.status(400).json({
        success: false,
        error: "Partida no está activa",
      });
    }

    const tickResult = processTick(game);

    res.json({
      success: true,
      tickResult,
      gameState: game,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /games/:gameId/ticks/:count
 * Ejecuta múltiples ticks
 */
app.post("/games/:gameId/ticks/:count", (req: Request, res: Response) => {
  try {
    const { gameId, count } = req.params;
    const tickCount = parseInt(count);

    const game = games[gameId];
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Partida no encontrada",
      });
    }

    if (tickCount < 1 || tickCount > 100) {
      return res.status(400).json({
        success: false,
        error: "Count debe estar entre 1 y 100",
      });
    }

    const results = [];
    for (let i = 0; i < tickCount; i++) {
      if (game.status !== "active") break;
      results.push(processTick(game));
    }

    res.json({
      success: true,
      ticksExecuted: results.length,
      results,
      gameState: game,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /games/:gameId/save
 * Guarda el estado actual de la partida en un archivo JSON en /data/games
 */
app.post("/games/:gameId/save", (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = games[gameId];
    if (!game) return res.status(404).json({ success: false, error: "Partida no encontrada" });

    const filePath = path.join(DATA_DIR, `${gameId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(game, null, 2), "utf-8");

    res.json({ success: true, file: filePath });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * POST /games/:gameId/load
 * Carga el estado de la partida desde /data/games/<gameId>.json
 */
app.post("/games/:gameId/load", (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const filePath = path.join(DATA_DIR, `${gameId}.json`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: "Snapshot no encontrado" });

    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as GameState;

    // Restaurar al almacenamiento en memoria
    games[gameId] = parsed;

    res.json({ success: true, gameId });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * GET /health
 * Health check
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// =======================
// INICIO SERVIDOR
// =======================

app.listen(PORT, () => {
  console.log(`🎮 Servidor de Juego Estrategia corriendo en http://localhost:${PORT}`);
  console.log(`📚 Endpoints disponibles:`);
  console.log(`   POST   /games                    - Crear partida`);
  console.log(`   GET    /games/:gameId            - Ver estado`);
  console.log(`   POST   /games/:gameId/armies     - Agregar ejército`);
  console.log(`   POST   /games/:gameId/orders     - Enviar orden`);
  console.log(`   POST   /games/:gameId/tick       - Ejecutar 1 tick`);
  console.log(`   POST   /games/:gameId/ticks/:n   - Ejecutar N ticks`);
  console.log(`   GET    /health                   - Health check`);
});
