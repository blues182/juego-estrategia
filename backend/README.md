# Backend API - Juego de Estrategia

## Setup

```bash
npm install
npm run dev
```

## Endpoints

### Crear Partida
```bash
POST /games
```

Respuesta:
```json
{
  "success": true,
  "gameId": "uuid",
  "game": { ... }
}
```

### Ver Estado de Partida
```bash
GET /games/:gameId
```

### Agregar Ejército
```bash
POST /games/:gameId/armies
Content-Type: application/json

{
  "owner": "GER",
  "provinceId": "2-1",
  "units": [
    { "typeId": "infantry" },
    { "typeId": "medium_tank" },
    { "typeId": "fighter" }
  ]
}
```

### Enviar Orden
```bash
POST /games/:gameId/orders
Content-Type: application/json

{
  "armyId": "uuid",
  "orderType": "move",
  "targetProvinceId": "2-2"
}
```

Tipos de orden:
- `hold` - Mantenerse en posición
- `move` - Moverse a provincia adyacente
- `attack` - Atacar en provincia

### Ejecutar Tick
```bash
POST /games/:gameId/tick
```

Ejecuta 1 tick (producción, movimiento, combates, limpieza).

### Ejecutar N Ticks
```bash
POST /games/:gameId/ticks/5
```

Ejecuta 5 ticks.

## Ejemplo de Flujo Completo

```bash
# 1. Crear partida
curl -X POST http://localhost:3000/games

# Respuesta: {"gameId": "abc123", ...}

# 2. Agregar ejérc hacia USA
curl -X POST http://localhost:3000/games/abc123/armies \
  -H "Content-Type: application/json" \
  -d '{"owner":"USA","provinceId":"1-1","units":[{"typeId":"infantry"}]}'

# Respuesta: {"armyId": "army-001", ...}

# 3. Dar orden de movimiento
curl -X POST http://localhost:3000/games/abc123/orders \
  -H "Content-Type: application/json" \
  -d '{"armyId":"army-001","orderType":"move","targetProvinceId":"2-2"}'

# 4. Ejecutar tick
curl -X POST http://localhost:3000/games/abc123/tick

# 5. Ver estado
curl http://localhost:3000/games/abc123
```

## Estructura

```
backend/src/
├── server.ts          ← Express app
├── core/
│   ├── catalog/       ← Datos (facciones, unidades)
│   ├── entities/      ← Entidades (Map, Country, Army, GameState)
│   ├── rules/         ← Reglas (Combat)
│   └── services/      ← Servicios (TickEngine)
```
