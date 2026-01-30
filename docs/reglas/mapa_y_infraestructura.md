# Sistema de Mapa - Juego de Estrategia

## 📍 Estructura del Mapa

### División Territorial

El mapa está dividido en **provincias hexagonales** (o cuadradas según implementación).

Cada provincia tiene:
- **ID único**: Ej: "2-1", "3-5" (fila-columna)
- **Propietario**: Facción controladora (GER, JPN, USA, etc.)
- **Posición**: Coordenadas en el mapa
- **Tipo**: Terreno/ciudad
- **Edificios**: Lista de edificios construidos
- **Ejércitos**: Unidades militares presentes
- **Producción**: Recursos generados

### Datos de Provincia

```typescript
interface Province {
  id: string;
  row: number;
  col: number;
  name: string;
  owner: FactionId;
  terrain: "plains" | "mountain" | "forest" | "water";
  isCity: boolean;
  
  // Producción base (sin edificios)
  manpowerProduction: number;
  supplyProduction: number;
  
  // Edificios
  buildings: Building[];
  
  // Ejércitos presentes
  armies: Army[];
  
  // Recursos acumulados (opcional, por provincia)
  resources?: ResourcePool;
}
```

---

## 🗺️ Tipos de Terreno

| Terreno | Movimiento | Visibilidad | Defensa | Especial |
|---------|-----------|-------------|---------|----------|
| **Plains** (Llanura) | Normal (1 tick) | Normal | Base (0%) | Óptimo para tanques |
| **Mountain** (Montaña) | Lento (1.5 ticks) | Limitado | Alto (+30%) | Difícil acceso |
| **Forest** (Bosque) | Medio (1.2 ticks) | Limitado | Medio (+15%) | Emboscadas |
| **Water** (Agua) | Solo naval | Normal | - | Necesita puerto |

---

## 🏙️ Provincias Especiales

### Capital (Capital Province)

- **Producción:** +15 dinero/tick base
- **Edificios:** Solo una por facción
- **Defensa:** Difícil de capturar (-20% daño atacante)
- **Importancia:** Si la pierdes, penalidad económica severa

### Ciudades (City)

- **Producción:** +5 manpower/tick
- **Permite:** Construction de fabricas (tank_factory, airplane_factory, etc.)
- **Importancia:** Centro de poder industrial
- **Déficit:** Más valiosas, más difíciles de defender

### Puertos (Port Province)

- **Requisito:** Terreno "water"
- **Movimiento naval:** Permite flujo de unidades navales
- **Comercio:** Transporte de recursos entre continentes
- **Edificios:** Port, small_port

### Bases Aéreas (Airport Province)

- **Requisito:** Terreno "plains"
- **Permite:** Despegue/aterrizaje de aviones
- **Edificios:** Airfield, small_airfield
- **Reabastecimiento:** Aviones se reparan y recargan

---

## 🚀 Sistema de Requisitos de Infraestructura

### Restricciones de Movimiento

Las unidades requieren infraestructura específica para operar:

#### Infantería
```
✅ Puede moverse a: Cualquier provincia adyacente
❌ No requiere: Nada especial
⏱️ Tiempo de movimiento: 1 tick normal
```

#### Tanques
```
✅ Puede moverse a: Provincias adyacentes (no water)
❌ Requiere gasolina: 5 gasolina por movimiento
⏱️ Tiempo de movimiento: 1 tick (llanura), 1.5 ticks (montaña)
📍 No puede atravesar: Agua, terreno impassable

RESTRICCIÓN ESPECIAL:
- Sin gasolina disponible → NO PUEDE MOVERSE
- Gasolina se deduce automáticamente al mover
```

#### Aviones
```
✅ Puede moverse a: Cualquier provincia del mapa (vuelo)
❌ REQUISITO CRÍTICO: NECESITA PISTA (airfield o small_airfield)
⚠️ SIN PISTA EN DESTINO → FUERZA ATERRIZAJE DE EMERGENCIA
   - Avión recibe daño (30-50% HP)
   - Eficiencia reducida al 50%

SISTEMA DE REPOSTAJE:
- Vuela máximo 40 ticks sin repostar
- Necesita parar en airfield cada 40 ticks
- El repostaje tarda 5 ticks
- Consume 15 gasolina por repostaje completo

RESTRICCIÓN DE MOVIMIENTO:
- Airfield pequeño (small_airfield): Solo aviones pequeños (fighter, transport)
- Airfield grande (airfield): Todos los aviones
- Sin airfield en provincia destino = NO PUEDE ATERRIZAR
```

#### Unidades Navales
```
✅ Puede moverse a: Solo provincias con agua (sea)
❌ REQUISITO CRÍTICO: PUERTO (port o small_port)
⚠️ SIN PUERTO EN DESTINO → NO PUEDE ATRACAR
   - Se queda en aguas internacionales
   - Visible a enemigos
   - Vulnerable a ataques aéreos

TIPOS DE PUERTO:
- Port: Puede atracar cualquier unidad naval (cruiser, carrier, destroyer, etc.)
- Small_port: Solo destructores y submarinos (naves pequeñas)

RESTRICCIÓN DE MOVIMIENTO:
- Carrier sin puerto = BLOQUEDO DE OPERACIONES
- Necesita puerto cada 50 ticks (reabastecimiento)
```

#### Artillería
```
✅ Puede moverse a: Provincias adyacentes (terrestre)
❌ No requiere infraestructura especial
⚠️ Movimiento lento: 1.5 ticks (pesada)
📍 Necesita línea de vista para atacar
```

---

## 🛣️ Red de Infraestructura

### Railway (Vía de Ferrocarril)

```
EFECTO:
- +20% velocidad de movimiento en provincia
- +20% velocidad de suministros (supply)
- No bloquea movimiento
- Se destruye si es capturada la provincia

MÚLTIPLES RAILWAYS:
- Pueden conectarse entre provincias
- +20% por cada railway (acumulativo)
- Máximo +100% (con 5 railways)
```

### Fortress (Fortaleza)

```
EFECTO:
- +40% defensa contra ataques terrestres
- -30% daño de artillería entrante
- Unidades en provincia ganan +2 morale
- Se destruye si provincia es capturada

REQUISITO DE OCUPACIÓN:
- Si provincia tiene fortress, ocupa 30% más tiempo capturarla
```

### Supply Depot (Depósito de Suministros)

```
EFECTO:
- +50% capacidad de supply en provincia
- Ejércitos pueden recargar más rápido
- +1 supply/tick automático
- Vital para campañas largas

SIN SUPPLY DEPOT:
- Ejércitos consumen supply normal
- Pueden desertar si supply llega a 0
```

---

## 📊 Tabla de Requisitos por Tipo de Unidad

| Unidad | Tipo de Mov | Infraestructura Requerida | Máximo Ticks Sin Repostar | Recursos/Movimiento |
|--------|------------|---------------------------|----------------------|-------------------|
| **Infantry** | Terrestre | Ninguna | ∞ | Manpower solo |
| **Light Tank** | Terrestre | Ninguna | 15 ticks | 5 gasolina/movimiento |
| **Medium Tank** | Terrestre | Ninguna | 10 ticks | 10 gasolina/movimiento |
| **Heavy Tank** | Terrestre | Ninguna | 8 ticks | 15 gasolina/movimiento |
| **Artillery** | Terrestre | Ninguna | ∞ | Ninguno |
| **Rocket Artillery** | Terrestre | Ninguna | 12 ticks | 8 gasolina/movimiento |
| **Fighter** | Aéreo | **Airfield/Small** | 40 ticks | 15 gasolina/repostaje |
| **Bomber** | Aéreo | **Airfield** | 35 ticks | 25 gasolina/repostaje |
| **Transport** | Aéreo | **Airfield/Small** | 45 ticks | 10 gasolina/repostaje |
| **Destroyer** | Naval | **Port** | 50 ticks | 20 gasolina/repostaje |
| **Cruiser** | Naval | **Port** | 40 ticks | 35 gasolina/repostaje |
| **Carrier** | Naval | **Port** | 30 ticks | 50 gasolina/repostaje |
| **Submarine** | Naval | **Small Port** | 50 ticks | 10 gasolina/repostaje |

---

## 🎯 Ejemplos de Restricciones en Acción

### Caso 1: Movimiento de Aviones

```
Provincia A (tiene airfield) → Tengo 5 fighters
Provincia B (a 20 ticks de distancia)
Provincia B NO TIENE airfield

RESULTADO:
❌ Los fighters NO PUEDEN VOLAR A PROVINCIA B
   (no pueden aterrizar)

SOLUCIÓN:
✅ Primero construir airfield o small_airfield en Provincia B
✅ LUEGO vuelan los fighters (con repostaje de emergencia)
```

### Caso 2: Tanques sin Gasolina

```
Tengo: 10 medium tanks, 5 gasolina
Quiero: Mover tanks a provincia adyacente (cuesta 10 gasolina/tank)

RESULTADO:
❌ SOLO puedo mover 1 tanque (consume 10 gasolina)
✅ Necesito esperar producción de gasolina

SIN GASOLINA SUFICIENTE:
- Los tanques NO pueden atacar
- Pueden defenderse (pero menos efectivos)
- -50% defensa si no hay gasolina
```

### Caso 3: Puertos y Marina

```
Tengo: 1 carrier, 2 cruisers en Provincia Costera A
Quiero: Mover a Provincia Costera C (2 provincias agua)

RUTA:
Prov A (port) → Agua → Prov B (FALTA PORT) → Agua → Prov C (port)

RESULTADO:
❌ BLOQUEADO EN PROVINCIA B
   - No pueden atracar (no hay puerto)
   - Se quedan en aguas internacionales
   - Vulnerables a ataques aéreos

SOLUCIÓN:
✅ Construir puerto en Provincia B primero
✅ Luego pueden pasar y llegar a Prov C
```

### Caso 4: Aviones en Repostaje

```
Fighter tiene 40 ticks de combustible
Vuela durante 40 ticks a provincia sin airfield

RESULTADO:
⚠️ ATERRIZAJE FORZADO
- Recibe 30-50% daño
- Eficiencia: 50% (no puede atacar a pleno)
- DEBES reparar antes de seguir

SI HAY AIRFIELD:
✅ Aterriza normalmente
✅ Repostaje: 5 ticks
✅ Recupera 100% HP y eficiencia
```

---

## 🏗️ Planificación Estratégica de Infraestructura

### Priority 1: Bases Aéreas
```
→ Sin airfields, los aviones son INÚTILES
→ Máxima prioridad al expandir hacia enemigo
→ Small airfield (60 ticks) mejor inversión temprana
```

### Priority 2: Puertos
```
→ Requieren para operaciones navales
→ No se pueden hacer desembarcos sin puerto cercano
→ Carrier sin puerto = bloqueado
```

### Priority 3: Railways
```
→ Mejora logística general (+20% velocidad)
→ Facilita movimiento rápido de tropas
→ Barato (120 dinero + 100 metal) y rápido (80 ticks)
```

### Priority 4: Fortresses
```
→ Defensa terminal de provincias críticas
→ Aumenta tiempo de ocupación enemiga
→ Mejor en frontera norte/sur
```

---

## 📋 Checklist de Operaciones

**Antes de atacar provincia lejana:**
- ✅ ¿Hay combustible para tanques? (5-15 gasolina cada uno)
- ✅ ¿Hay airfield si llevo aviones? (o construir + 5 ticks espera)
- ✅ ¿Hay puerto si llevo marina? (o bloqueo garantizado)
- ✅ ¿Tengo supply para campaña prolongada? (o deserción de tropas)
- ✅ ¿Hay railway para mover rápido? (opcional pero útil)

---

**Última actualización:** 30 de enero de 2026
**Versión:** 1.0 - Sistema de mapa y restricciones
