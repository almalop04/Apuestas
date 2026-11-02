# 📘 Arquitectura, Sistema de Diseño y Modelos Estadísticos
**Plataforma de Analítica Deportiva Profesional (Fútbol y Baloncesto)**

---

## 1. Principios de UX y Flujo de Usuario

### 1.1 Jerarquía Visual y Regla de los 2 Clics
- **Nivel 1 (Dashboard Principal)**: Partidos programados para hoy (Fútbol y Baloncesto), filtros rápidos (liga, deporte), probabilidad estimada y estado de disponibilidad de datos.
- **Nivel 2 (Ficha de Partido o Equipo / Jugador - Máximo 2 clics)**:
  - *Clic 1*: Tarjeta del partido en el dashboard $\rightarrow$ Vista detallada del partido (H2H, últimos 5/10 partidos, métricas avanzadas, cálculo de goles/puntos).
  - *Clic 2*: Clic en el nombre de un equipo o jugador dentro del partido $\rightarrow$ Ficha individual del equipo/jugador con desglose histórico y métricas por rol.

### 1.2 Transparencia y Honestidad de los Datos
- **Cada bloque de datos incluye**:
  - `Fuente`: Nombre del proveedor oficial de datos (p. ej. *API-Football / TheRundown / Balldontlie*).
  - `Última actualización`: Marca temporal clara (p. ej. *Actualizado hace 14 min*).
- **Tratamiento de Datos Faltantes ("Sin datos")**:
  - Nunca se muestran campos vacíos, valores `null`, `undefined` ni estimaciones inventadas.
  - Se utiliza una tarjeta o chip visual específico con borde ámbar (`#F5B84B`), icono de advertencia y el texto `"Sin datos suficientes"`.
- **Diferenciación estricta: Frecuencia vs. Probabilidad**:
  - **Frecuencia histórica** (Verde esmeralda `#2DD4A7`): Refleja lo ocurrido empíricamente (p. ej. *7 de los últimos 10 partidos superaron los 2.5 goles*).
  - **Probabilidad estimada** (Azul analítico `#5B8CFF`): Refleja el cálculo del modelo matemático neutralizando sesgos del pasado reciente.
  - Nunca comparten el mismo color, posición ni estilo de etiqueta.
- **Aviso Legal / Discreción Fijo**:
  - Banner sutil en la parte inferior o cabecera: *"Herramienta analítica de estimación estadística. Los datos y proyecciones no garantizan resultados deportivos ni constituyen asesoramiento financiero o de apuestas."*

---

## 2. Estructura de Carpetas del Proyecto

Diseñada para separar estrictamente el origen de los datos, la lógica de cálculo y la presentación visual:

```
apuestas/
├── design-tokens.css             # Tokens globales CSS (colores, fuentes, radios, sombras)
├── docs/                         # Documentación y manuales para no programadores
│   └── arquitectura-y-diseno.md
├── src/
│   ├── app/                      # Enrutamiento de pantallas (Dashboard, Partido, Equipo)
│   │   ├── layout.tsx            # Plantilla global (Aviso legal fijo, Header, Nav)
│   │   ├── page.tsx              # Pantalla 1: Dashboard Principal (Partidos de hoy)
│   │   ├── match/
│   │   │   └── [id]/page.tsx     # Pantalla 2: Ficha detallada de Encuentro
│   │   ├── team/
│   │   │   └── [id]/page.tsx     # Pantalla 3: Ficha de Equipo / Jugador
│   │   └── api/                  # Endpoints locales seguros (ocultan las claves API)
│   │       ├── matches/route.ts
│   │       ├── stats/route.ts
│   │       └── quota/route.ts    # Monitor de consumo de peticiones API
│   │
│   ├── core/                     # Capa de Lógica de Negocio y Matemáticas (Pura)
│   │   ├── stats/
│   │   │   ├── sampleGuard.ts    # Comprobación de muestra mínima (>=5 partidos)
│   │   │   ├── frequencies.ts    # Frecuencias en últimos 5 y 10 partidos
│   │   │   ├── averages.ts       # Promedios móviles y medianas
│   │   │   ├── momentum.ts       # Tendencia y forma ponderada
│   │   │   └── models/
│   │   │       ├── poisson.ts    # Modelo de Poisson para goles/puntos
│   │   │       └── ratings.ts    # Modelo de fuerza relativa ofensiva/defensiva
│   │   └── models.ts             # Tipos de datos estandarizados internos
│   │
│   ├── data/                     # Capa de Acceso a Datos (Adaptadores intercambiables)
│   │   ├── cache/
│   │   │   ├── cacheManager.ts   # Almacenamiento local con caducidad (TTL)
│   │   │   └── quotaTracker.ts   # Contador de peticiones y bloqueo de seguridad
│   │   ├── providers/
│   │   │   ├── baseProvider.ts   # Interfaz común que deben cumplir todos los proveedores
│   │   │   ├── footballApi.ts    # Proveedor de fútbol
│   │   │   ├── basketballApi.ts  # Proveedor de baloncesto
│   │   │   └── mockProvider.ts   # Proveedor de respaldo con datos de prueba realistas
│   │   └── logger.ts             # Registro de errores y actividad en archivo local
│   │
│   ├── components/               # Capa de Presentación (Componentes reutilizables)
│   │   ├── ui/
│   │   │   ├── Card.tsx          # Tarjeta base con borde y superficie accesible
│   │   │   ├── Badge.tsx         # Etiqueta de estado (Victoria, Derrota, Sin Datos)
│   │   │   ├── SegmentedControl.tsx # Selector últimos 5 / 10 partidos o deporte
│   │   │   ├── DataTable.tsx     # Tabla responsive con desplazamiento horizontal interno
│   │   │   ├── ComparisonBar.tsx # Barra comparativa local vs visitante
│   │   │   ├── DataAvailabilityChip.tsx # Chip con proveedor y última actualización
│   │   │   ├── Skeleton.tsx      # Estados de carga esqueletados
│   │   │   ├── QuotaGauge.tsx    # Medidor visual de peticiones consumidas vs límite
│   │   │   └── Disclaimer.tsx    # Banner fijo de advertencia estadística
│   │   └── views/                # Secciones agrupadas de interfaz
│   │       ├── MatchCard.tsx     # Tarjeta de partido para el dashboard
│   │       ├── HeadToHead.tsx    # Cara a cara histórico
│   │       └── ProbabilityCard.tsx # Bloque comparador frecuencia vs probabilidad
│   │
│   └── tests/                    # Pruebas automáticas de lógica y datos
│       ├── stats.test.ts         # Validación de fórmulas matemáticas
│       ├── sampleGuard.test.ts   # Validación de estados "Sin datos" (<5 partidos)
│       └── cache.test.ts         # Validación de caducidad y límites de cuota
│
├── .env.example                  # Plantilla de claves API (sin datos sensibles)
├── .gitignore                    # Protección para que nunca se suban claves ni logs
└── README.md                     # Manual claro paso a paso para no programadores
```

---

## 3. Lista de Pantallas y Componentes

### Pantallas Principales
1. **Dashboard Principal (`/`)**:
   - Selector de deporte (Fútbol / Baloncesto).
   - Barra de estado de API (Peticiones restantes del día y botón de actualizar datos).
   - Lista de partidos de hoy ordenados por relevancia horaria y disponibilidad de datos.
   - Resumen visual rápido: cuota/probabilidad estimada, frecuencia de victorias recientes y chip de calidad de datos.
2. **Ficha Detallada de Encuentro (`/match/[id]`)**:
   - Cabecera del encuentro (Equipos, estadio, fecha, árbitro si disponible).
   - Módulo Comparativo: Frecuencia histórica (últimos 5 y 10 partidos) a la izquierda en Verde `#2DD4A7`, vs. Probabilidad estimada del modelo a la derecha en Azul `#5B8CFF`.
   - Barra comparativa de métricas clave (Goles esperados, tiros a puerta, posesión, rebotes, ritmo de posesiones en baloncesto).
   - Historial directo cara a cara (H2H) con señalización doble (color + etiqueta "V", "E", "D").
3. **Ficha de Equipo / Jugador (`/team/[id]`)**:
   - Estadísticas de la temporada actual.
   - Tendencia de rendimiento (momentum ponderado).
   - Tabla de últimos partidos con scroll horizontal en móvil.
4. **Panel de Ajustes y Monitor de Cuotas (`/admin` o modal)**:
   - Contador de llamadas a la API gastadas en el día.
   - Registro de errores descargable en un clic.

---

## 4. Modelos Estadísticos Explicados en Lenguaje Sencillo

### 4.1 Frecuencia Histórica (Últimos 5 y 10 partidos)
- **Qué es**: Una simple proporción porcentual de cuántas veces ocurrió un hecho concreto en los últimos partidos disputados.
- **Fórmula**: $\text{Frecuencia} = \frac{\text{Partidos donde se cumplió}}{\text{Partidos totales analizados}} \times 100$.
- **Límite**: El pasado reciente sufre de *ruido aleatorio*. Que un equipo haya ganado 4 de sus últimos 5 partidos no significa que tenga un 80% de probabilidad de ganar al líder de la tabla. Por eso se presenta en verde y catalogado explícitamente como "Historial reciente", nunca como pronóstico.

### 4.2 Probabilidad Estimada (Modelo Bivariado de Poisson / Ratio Ofensivo-Defensivo)
- **Qué es**: En deportes de anotación (goles en fútbol o tramos de puntos en baloncesto), el resultado depende de enfrentar la **fuerza atacante del local** contra la **debilidad defensiva del visitante**, y viceversa, ponderado por el factor cancha.
- **Cómo calcula**:
  1. Calcula la media de goles/puntos de la liga.
  2. Calcula el ratio de ataque de cada equipo (cuánto marca respecto a la media de la liga).
  3. Calcula el ratio de defensa (cuánto concede respecto a la media de la liga).
  4. Obtiene el valor esperado ($\lambda$) de goles/puntos para cada equipo.
  5. La distribución de Poisson reparte las probabilidades de cada marcador exacto (0-0, 1-0, 2-1, etc.) y las suma para dar la probabilidad de victoria local, empate o visitante.
- **Límites explicados con honestidad**:
  - Poisson asume que los goles son independientes a lo largo del tiempo (no contempla expulsiones tempranas, cambios tácticos o meteorología extrema).
  - No tiene en cuenta bajas de última hora salvo que estén integradas en las alineaciones.
  - Por esta razón, el modelo se presenta como una **estimación orientativa** y se acompaña de la métrica de fiabilidad.

### 4.3 Regla de Muestra Mínima (Guardia de Integridad)
- **Umbral**: Mínimo **5 partidos** oficiales del equipo en la competición actual.
- **Comportamiento si no se alcanza**:
  - Se desactiva el cálculo de probabilidad estimada.
  - Se muestra el chip: `"Muestra insuficiente (N/5 partidos)"` con estilo ámbar `#F5B84B`.
  - Se impide inducir a error con datos no representativos (por ejemplo, en las dos primeras jornadas de liga).

---

## 5. Accesibilidad y Estándares de Calidad
- **Contraste de Color**: Todo texto principal (`#E6EDF5`) supera un ratio de 12:1 contra el fondo `#0B1018`, muy por encima del mínimo exigido de 4.5:1 (WCAG AA).
- **No dependencia exclusiva del color**: Cada resultado lleva texto explicativo y un icono SVG distintivo (por ejemplo: Victoria = Icono de flecha arriba o check + Verde; Derrota = Icono de cruz + Rojo; Empate = Icono de guión + Gris).
- **Tamaño de toque en móvil**: Todos los botones y selectores tienen una altura mínima de 44 px para facilitar el uso con el dedo.
- **Tablas con scroll seguro**: Las tablas con múltiples columnas numéricas tienen contenedor `overflow-x: auto` con cabeceras fijas para que nunca rompan el diseño en pantallas pequeñas.
