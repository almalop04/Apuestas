# 🏆 ProStats — Plataforma Profesional de Analítica Deportiva (Fútbol y Baloncesto)

Bienvenido a **ProStats**, una plataforma web de analítica deportiva avanzada diseñada con estándares profesionales de panel de control oscuro (fintech/terminal analítica). 

Este manual está redactado especialmente para **personas sin conocimientos de programación**: con un solo paso podrás ponerla en marcha y entender todo lo que ves en pantalla.

---

## ⚡ 1. Cómo encender la aplicación (En 1 solo paso)

Como ya tienes **Node.js** instalado en tu ordenador, no necesitas instalar nada más.

1. Abre la terminal o consola de comandos en esta carpeta (`Apuestas`).
2. Escribe el siguiente comando y pulsa **Enter**:
   ```bash
   npm run dev
   ```
3. Verás un mensaje que dice:
   ```
   ✓ Starting...
   - Local: http://localhost:3000
   ```
4. Abre tu navegador favorito (Chrome, Edge, Firefox, Safari) y entra en:
   👉 **http://localhost:3000**

¡Listo! La web estará funcionando a pleno rendimiento en tu pantalla.

---

## 🧭 2. Cómo usar la web (Guía visual)

### A. Dashboard Principal (Partidos de Hoy)
- **Selector de deporte**: Puedes alternar con un clic entre **Fútbol** y **Baloncesto**.
- **Selector de Modo en Vivo vs Simulador**:
  - `🔴 Partidos Reales Hoy`: Se conecta automáticamente a los marcadores deportivos oficiales y carga los **partidos reales del mundo que se juegan hoy** (LaLiga, Premier League, Serie A, Champions League y NBA), con sus escudos oficiales y proyecciones actualizadas. ¡No necesitas registrarte ni introducir ninguna clave!
  - `Simulador`: Te permite volver a los partidos de prueba controlados para verificar casos especiales como el aviso de "Sin datos suficientes".
- **Ventana de análisis**: Puedes cambiar entre ver las estadísticas de los **Últimos 5 partidos** o de los **Últimos 10 partidos**.
- **Monitor de API**: En la esquina superior derecha verás `API: 1/100`. Indica cuántas peticiones se han gastado hoy de tu cupo seguro. Al llegar al límite diario se bloquea automáticamente para que **nunca tengas sorpresas ni costes**.
- **Transparencia de datos**: Cada tarjeta indica la fuente de los datos (por ejemplo, *Feed Deportivo Oficial (En Vivo)*) y hace cuántos minutos se actualizaron.

### B. Regla de los 2 Clics
- **Clic 1**: Pulsa en cualquier tarjeta de partido o en *"Ver análisis detallado y H2H"*. Irás a la ficha completa del encuentro con el cara a cara histórico, modelos matemáticos y barras comparativas.
- **Clic 2**: Pulsa en el nombre de cualquier equipo (p. ej. *Real Madrid* o *FC Barcelona*). Irás directamente a su ficha individual con sus estadísticas de la temporada y sus últimos partidos.

### C. La regla de oro: Frecuencia vs. Probabilidad
Para que nunca haya confusión ni engaño, la web separa de forma estricta dos conceptos que suelen mezclarse erróneamente:
1. **Frecuencia Histórica (Color Verde Esmeralda #2DD4A7)**: 
   - Te dice **lo que ya ocurrió** en la realidad en los últimos partidos (por ejemplo: *"El equipo local ganó 4 de sus últimos 5 partidos, un 80%"*).
2. **Probabilidad Estimada (Color Azul Analítico #5B8CFF)**: 
   - Es una proyección matemática teórica que neutraliza sesgos del pasado reciente, midiendo el ataque real del local contra la debilidad defensiva del visitante.

### D. ¿Qué significa "Sin datos suficientes"?
Si un equipo tiene **menos de 5 partidos jugados** en la competición (por ejemplo, en las primeras jornadas o en rondas iniciales de copa), el sistema **no inventa números ni muestra huecos en blanco**.
Muestra una tarjeta ámbar (`#F5B84B`) advirtiendo:
`"Sin datos suficientes para proyectar (<5 partidos)"`. De esta forma se protege la honestidad del análisis.

---

## 🔬 3. Explicación de los Modelos Matemáticos

### Modelo de Fútbol (Distribución Bivariada de Poisson)
- **Idea central**: En el fútbol se marcan pocos goles por partido (media habitual de ~1.4 goles por equipo).
- **Cómo calcula**: Compara cuántos goles suele marcar el equipo local en su estadio contra cuántos suele encajar el visitante fuera de casa. Con ello calcula los **Goles Esperados (xG)** de cada bando.
- Luego, mediante la fórmula estadística de Poisson, calcula la probabilidad exacta de cada marcador posible (0-0, 1-0, 2-1, etc.) y las suma para dar el % de victoria local (1), empate (X) y victoria visitante (2).
- **Límites reales**: El modelo no puede predecir expulsiones tempranas, decisiones arbitrales ni cambios tácticos imprevistos.

### Modelo de Baloncesto (Ritmo y Eficiencia por Posesión)
- **Idea central**: En baloncesto se juegan entre 80 y 105 posesiones por partido.
- **Cómo calcula**: Estima cuántas posesiones jugarán ambos equipos (**Ritmo o Pace**) y cuántos puntos anotan por cada 100 posesiones (**Eficiencia Ofensiva vs Defensiva**), sumando la ventaja histórica de jugar en casa (~3.2 puntos).
- A partir de la diferencia de puntos esperada, calcula el porcentaje de victoria de cada equipo. (En baloncesto no hay empate definitivo porque existen prórrogas).
- **Límites reales**: En baloncesto, la baja de una sola estrella altera profundamente el quinteto.

---

## 🧪 4. Cómo comprobar que todo funciona (Pruebas Automáticas)

Hemos programado una batería de **19 pruebas automáticas** que validan al milímetro que las fórmulas matemáticas, los límites de cuota y el tratamiento de datos incompletos no fallen jamás.

Para ejecutarlas, abre tu terminal y escribe:
```bash
npm test
```
Verás un informe verde confirmando que el 100% de las pruebas han superado el control de calidad:
```
✔ 1. Guardia de Muestra Mínima (Sample Guard)
✔ 2. Frecuencias Históricas (Últimos 5 y 10 partidos)
✔ 3. Momentum Ponderado (Racha reciente)
✔ 4. Modelo de Poisson (Fútbol)
✔ 5. Modelo de Ritmo y Eficiencia (Baloncesto)
✔ 6. Gestor de Caché Local (TTL)
✔ 7. Monitor y Bloqueo de Cuota Diaria (Quota Tracker)

ℹ tests 19 | pass 19 | fail 0
```

---

## 🛠️ 5. Solución de Problemas Frecuentes

### Problema 1: "El puerto 3000 ya está ocupado"
- **Por qué ocurre**: Si ya tienes otra pestaña o proceso ejecutando la web.
- **Solución**: Next.js automáticamente intentará abrir el puerto `3001` (entra en `http://localhost:3001`), o puedes cerrar las ventanas de terminal abiertas y volver a lanzar `npm run dev`.

### Problema 2: "¿Cómo consulto los errores si algo falla?"
- La aplicación cuenta con un registrador automático persistente en disco.
- Todos los fallos técnicos se guardan de forma limpia en el archivo:
  `logs/app-errors.log`
- Si alguna vez algo no carga, basta con abrir ese archivo de texto para ver la causa exacta con fecha y hora.

### Problema 3: "¿Tengo que pagar por alguna API?"
- **No, coste 0€**. La web viene configurada por defecto en modo simulado de alta fidelidad (`DATA_MODE=mock`), con partidos reales de LaLiga, Premier League, NBA y EuroLeague.
- Si en el futuro quieres conectar una API de pago o gratuita oficial (como API-Football), solo tienes que abrir el archivo `.env.local`, pegar tu clave en `FOOTBALL_API_KEY=` y cambiar `DATA_MODE=live`. El sistema respetará el límite diario fijado en `DAILY_QUOTA_LIMIT=100` para protegerte de cobros inesperados.

---

## 📁 6. Resumen de la Estructura de Archivos

- `design-tokens.css`: Archivo único con todos los colores, tipografía, radios y sombras del sistema de diseño.
- `src/core/stats/`: Toda la matemática pura (Poisson, Baloncesto, Frecuencias, Muestra mínima).
- `src/data/cache/`: Sistema de caché local con caducidad y contador de peticiones.
- `src/components/ui/`: Componentes visuales reutilizables (tarjetas, botones, tablas, barras, avisos).
- `src/app/`: Las 3 pantallas principales (Dashboard, Ficha de partido y Ficha de equipo).
- `src/tests/`: Pruebas automáticas de verificación continua.
