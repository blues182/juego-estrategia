# Sistema de Economía - Juego de Estrategia (1938-1950)

## 📋 Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Recursos](#recursos)
3. [Producción de Recursos](#producción-de-recursos)
4. [Edificios](#edificios)
5. [Construcción y Costos](#construcción-y-costos)
6. [Tecnologías y Eras](#tecnologías-y-eras)
7. [Refinería y Procesos](#refinería-y-procesos)

---

## 🎯 Visión General

El sistema económico del juego se basa en la gestión de **9 recursos diferentes** producidos por **provincias y ciudades**, con edificios especializados que generan producción y mejoras tecnológicas que aumentan eficiencia.

**Concepto clave:** La economía es la base para crear unidades, edificios y mejorar tecnologías. Sin recursos, no hay ejército.

---

## 💰 Recursos

### Recursos Crudos (De Extracción)

| Recurso | Símbolo | Uso Principal | Generado por |
|---------|---------|--------------|--------------|
| **Metal** | ⚙️ | Construcción de unidades y edificios | resource_extraction (minas) |
| **Pescado** | 🐟 | Alimento, genera manpower | resource_extraction (puertos) |
| **Trigo** | 🌾 | Alimento, genera manpower | resource_extraction (granjas) |
| **Raros** | 💎 | Tecnologías avanzadas, unidades elite | resource_extraction (especial) |
| **Petróleo Crudo** | 🛢️ | Se refina en gasolina y balas | resource_extraction (pozos) |

### Recursos Refinados (Procesados)

| Recurso | Símbolo | Uso Principal | Generado por | Costo Base |
|---------|---------|--------------|--------------|-----------|
| **Gasolina** | ⛽ | Combustible para tanques y aviones | refinery | 1 petróleo → 0.6 gasolina |
| **Balas/Munición** | 🔫 | Consumo en combate | refinery | 1 petróleo → 0.8 balas |

### Recursos Logísticos

| Recurso | Símbolo | Uso Principal | Generado por |
|---------|---------|--------------|--------------|
| **Dinero** | 💵 | Construcción, mantenimiento, gastos generales | capital, ciudades |
| **Manpower** | 👥 | Crear unidades militares | recruitment_center, barracks |
| **Supply** | 📦 | Suministros para ejércitos (logística) | supply_depot, pequeños depósitos |

---

## 📊 Producción de Recursos

### Producción Base (por tick)

Cada provincia genera recursos según su tipo y los edificios que contenga:

```
PROVINCIA ESTÁNDAR:
- Metal: +6/tick (con resource_extraction)
- Petróleo: +4/tick
- Manpower: +5/tick
- Supply: +5/tick
- Dinero: +8/tick (si hay capital o ciudad importante)
```

### Consumo de Recursos (por tick)

El ejército y las operaciones consumen:
```
Consumo General:
- Gasoline: -4/tick (tanques y aviones en misión)
- Ammo: -5/tick (combate activo)
- Supply: -3/tick (ejércitos en campaña)
- Dinero: -2/tick (mantenimiento general)
```

### Tick del Sistema

- **1 Tick = 1 minuto de juego** (ajustable)
- **1 Hora de juego = 60 ticks**
- **Producción constante:** Se aplica en cada tick automáticamente

---

## 🏢 Edificios

### Edificios de Ciudad (Producción y Investigación)

Solo pueden construirse en ciudades (provincias con estado "city").

| Edificio | Costo | Producción | Tiempo | Efectos |
|----------|-------|-----------|--------|---------|
| **Barracks** | 200💵 + 100⚙️ | - | 100 ticks | Entrena infantería |
| **Recruitment Center** | 150💵 + 80⚙️ | +5 manpower/tick | 80 ticks | Centro de reclutamiento |
| **Airplane Factory** | 500💵 + 300⚙️ + 10💎 | Produce aviones | 300 ticks | Manufactura aérea |
| **Tank Factory** | 400💵 + 250⚙️ | Produce tanques | 250 ticks | Manufactura blindada |
| **Artillery Factory** | 350💵 + 200⚙️ | Produce artillería | 200 ticks | Manufactura de artillería |
| **Research Lab** | 300💵 + 150⚙️ + 5💎 | +? research/tick | 150 ticks | Genera puntos de investigación |
| **Capital** | 1000💵 + 500⚙️ + 20💎 | +8 dinero/tick | 500 ticks | Centro político (máxima producción) |
| **Refinery** | 300💵 + 200⚙️ | Refina petróleo | 180 ticks | Convierte petróleo en gasolina/balas |

### Edificios de Provincia (Infraestructura)

Pueden construirse en cualquier provincia.

| Edificio | Costo | Producción | Tiempo | Efectos |
|----------|-------|-----------|--------|---------|
| **Resource Extraction** | 150💵 + 100⚙️ | Variable según tipo | 100 ticks | Extrae metal/petróleo/trigo |
| **Port** | 350💵 + 200⚙️ | - | 200 ticks | Puerto comercial, movimiento naval |
| **Small Port** | 150💵 + 100⚙️ | - | 100 ticks | Puerto pequeño (provincias) |
| **Airfield** | 200💵 + 150⚙️ | - | 150 ticks | Reabastece y repara aviones |
| **Small Airfield** | 80💵 + 60⚙️ | - | 60 ticks | Pista de repostaje pequeña |
| **Railway** | 120💵 + 100⚙️ | +20% logística | 80 ticks | Mejora movimiento y supply |
| **Fortress** | 250💵 + 200⚙️ | - | 120 ticks | +40% defensa provincial |
| **Supply Depot** | 100💵 + 80⚙️ | +5 supply/tick | 80 ticks | Almacén de supply |
| **Small Hospital** | 100💵 + 70⚙️ | - | 60 ticks | Recupera morale de ejércitos |

---

## 🏗️ Construcción y Costos

### Costo de Unidades Militares

Las unidades requieren recursos específicos para fabricarse. El tiempo es por unidad.

#### Infantería
```
Infantry
- Costo: 50💵 + 10⚙️ + 20👥
- Tiempo: 30 ticks
- Producción: barracks, recruitment_center
```

#### Tanques
```
Light Tank      Medium Tank       Heavy Tank
- 150💵         - 250💵          - 400💵
- 80⚙️          - 150⚙️          - 250⚙️
- 5⛽           - 10⛽           - 15⛽
- 15👥          - 25👥          - 40👥
- 60 ticks      - 90 ticks       - 150 ticks
```

#### Aviación
```
Fighter         Bomber           Transport
- 200💵        - 350💵          - 150💵
- 100⚙️        - 200⚙️          - 80⚙️
- 15⛽         - 25⛽           - 10⛽
- 3💎          - 5💎            - -💎
- 10👥         - 15👥          - 8👥
- 50 ticks     - 80 ticks       - 40 ticks
```

#### Artillería
```
Artillery       Rocket Artillery
- 180💵        - 300💵
- 120⚙️        - 150⚙️
- 20🔫         - 30🔫
- 20👥         - 30👥
- 80 ticks     - 120 ticks
```

#### Marina
```
Destroyer       Cruiser          Carrier         Submarine
- 400💵        - 600💵          - 1000💵        - 300💵
- 300⚙️        - 500⚙️          - 800⚙️         - 200⚙️
- 20⛽         - 35⛽           - 50⛽          - 10⛽
- -💎          - 5💎            - 10💎          - 5💎
- 50👥         - 80👥          - 150👥         - 30👥
- 200 ticks    - 300 ticks      - 500 ticks     - 150 ticks
```

### Requisitos Mínimos para Construir

Para construir una unidad:
1. ✅ Tener el **recurso suficiente** en la facción
2. ✅ Tener la **fábrica** apropiada en una ciudad controlada
3. ✅ No estar en **bancarrota total** (dinero ≤ 0)
4. ⏳ Esperar el **tiempo de construcción**

---

## 🔬 Tecnologías y Eras

### Sistema de Eras Históricas

El juego tiene 3 eras que se desbloquean progresivamente:

| Era | Período | Tanques Disponibles | Techs Desbloqueables |
|-----|---------|-------------------|----------------------|
| **EARLY** | 1938-1942 | Light, Medium | Tank Armor I, Engine I, Turret I |
| **MID** | 1943-1946 | Heavy, Super-Heavy | Tank Armor II/III, Engine II, Turret II, Naval I |
| **LATE** | 1947-1950 | Post-guerra Modernizados | Engine III, Naval II, Logistics II |

### Árbol Tecnológico

**11 Líneas de Investigación:**

```
1. TANK ARMOR (3 niveles)
   - Tank Armor I: +10% defensa (200 pts)
   - Tank Armor II: +20% defensa (300 pts)
   - Tank Armor III: +30% defensa (400 pts)

2. TANK ENGINE (3 niveles)
   - Tank Engine I: +15% velocidad, -10% consumo (200 pts)
   - Tank Engine II: +25% velocidad, -20% consumo (300 pts)
   - Tank Engine III: +40% velocidad, -30% consumo (400 pts)

3. TANK TURRET (2 niveles)
   - Tank Turret I: +15% potencia de fuego (250 pts)
   - Tank Turret II: +30% potencia de fuego (350 pts)

4. INFANTRY WEAPONS (2 niveles)
   - Infantry Weapons I: +20% daño (180 pts)
   - Infantry Weapons II: +40% daño (280 pts)

5. AIR SUPERIORITY (2 niveles)
   - Air Superiority I: +20% velocidad y fuego (250 pts)
   - Air Superiority II: +40% velocidad y fuego (350 pts)

6. INDUSTRIAL PRODUCTION (2 niveles)
   - Industrial Production I: +20% velocidad de fábrica (300 pts)
   - Industrial Production II: +40% velocidad de fábrica (400 pts)

7. RESOURCE EFFICIENCY (2 niveles)
   - Resource Efficiency I: -15% costos de construcción (250 pts)
   - Resource Efficiency II: -30% costos de construcción (350 pts)

8. LOGISTICS (2 niveles)
   - Logistics I: +20% supply, -10% consumo (200 pts)
   - Logistics II: +40% supply, -20% consumo (300 pts)

9. FORTIFICATIONS (2 niveles)
   - Fortifications I: +20% defensa provincial (200 pts)
   - Fortifications II: +40% defensa provincial (300 pts)

10. NAVAL WARFARE (2 niveles, solo MID/LATE)
    - Naval Warfare I: +20% potencia naval (300 pts)
    - Naval Warfare II: +40% potencia naval (400 pts)
```

### Cómo Funciona la Investigación

1. **Punto de investigación:** Se generan en Research Labs (+? por tick)
2. **Iniciación:** Selecciona una tech para comenzar investigación
3. **Progreso:** Acumula puntos hasta completarla
4. **Requisitos:** Algunas techs requieren otras o era específica
5. **Bonus:** Al completar, el bonus se aplica automáticamente a unidades/edificios

---

## ⚗️ Refinería y Procesos

### Sistema de Refinería

Las **refinerías** convierten petróleo crudo en productos refinados:

#### Ratios de Conversión

```
PETRÓLEO → GASOLINA
1 petróleo crudo = 0.6 gasolina
(60% de eficiencia de conversión)

PETRÓLEO → BALAS/MUNICIÓN
1 petróleo crudo = 0.8 balas
(80% de eficiencia de conversión)
```

#### Proceso de Refinería

1. Cada refinery puede procesar tanto petróleo como tengas
2. Asignas cantidad de petróleo para gasolina y balas
3. Se convierte automáticamente en cada tick
4. Los productos se almacenan en el pool de recursos de la facción

**Ejemplo:**
```
Tengo: 100 petróleo
Asigno: 50 para gasolina, 50 para balas

Resultado:
- Gasolina: +30 (50 × 0.6)
- Balas: +40 (50 × 0.8)
- Petróleo: -100
```

---

## 📈 Estrategia Económica

### Principios Básicos

1. **Producción Equilibrada:** Necesitas todos los recursos, no solo uno
2. **Especialización Regional:** Algunas provincias producen mejor ciertos recursos
3. **Construcción Progresiva:** Primero fábricas, luego unidades
4. **Investigación Temprana:** Tech temprano = ventaja militar
5. **Logística:** Sin supply, los ejércitos no avanzan

### Tips Económicos

- 🏭 **Construye fábricas temprano:** Mayor producción tarde → ejército fuerte
- 📍 **Posiciona bien:** Resource Extraction donde hay recursos buenos
- 🔍 **Researcha eficiencia:** Resource Efficiency reduce costos un 30%
- ⛽ **Gestiona petróleo:** Es el cuello de botella (necesitas para gasolina y balas)
- 💰 **Capitales son oro:** Capital = +8 dinero/tick (¡diferencial!)
- 🛣️ **Railways:** +20% logística en una provincia (subestima su valor)

---

## 🎮 Ciclo de Juego Económico

**Tick → Producción → Consumo → Movimiento → Combate**

```
1. GENERACIÓN (Cada tick)
   - Ciudades generan dinero
   - Extracción genera recursos crudos
   - Refinerías procesan petróleo
   - Research Labs acumulan puntos

2. CONSUMO (Automático)
   - Ejércitos consumen supply
   - Tanques/aviones consumen gasolina
   - Combate consume munición

3. CONSTRUCCIÓN (A demanda)
   - Seleccionas construir unidad/edificio
   - Se deduce costo de recursos
   - Inicia timer de construcción
   - Al completarse, aparece la unidad/edificio

4. INVESTIGACIÓN (Selectiva)
   - Seleccionas tech a investigar
   - Research points se acumulan
   - Al completar, se aplica bonus
```

---

## 📊 Tabla de Referencia Rápida

| Acción | Costo Mínimo | Tiempo | Requisito |
|--------|-------------|--------|-----------|
| Infantry | 50💵 + 10⚙️ + 20👥 | 30 ticks | barracks |
| Light Tank | 150💵 + 80⚙️ + 5⛽ | 60 ticks | tank_factory |
| Fighter | 200💵 + 100⚙️ + 15⛽ | 50 ticks | airplane_factory |
| Tank Armor I | 200 research pts | ∞ | research_lab |
| Refinery | 300💵 + 200⚙️ | 180 ticks | capital/city |

---

**Última actualización:** 30 de enero de 2026
**Versión:** 1.0 - Sistema económico base
