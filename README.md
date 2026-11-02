# 🏆 ProStats — Plataforma Profesional de Analítica Deportiva con IA (Fútbol y Baloncesto)

Bienvenido a **ProStats**, una plataforma web de analítica deportiva avanzada y cuotas justas, diseñada con estándares profesionales de panel de control oscuro (fintech/terminal analítica) e impulsada por **Google Gemini en su plan 100% gratuito**.

Este manual está redactado especialmente para **personas sin conocimientos de programación**: con un solo paso podrás ponerla en marcha y entender todo lo que ves en pantalla.

---

## ⚡ 1. Cómo encender la aplicación (En 1 solo paso)

1. Abre la terminal o consola de comandos en esta carpeta (`Apuestas`).
2. Escribe el siguiente comando y pulsa **Enter**:
   ```bash
   npm run dev
   ```
3. Verás un mensaje que dice:
   ```text
   ✓ Starting...
   - Local: http://localhost:3000
   ```
4. Abre tu navegador (Chrome, Edge, Firefox, Safari) y entra en:
   👉 **http://localhost:3000**

¡Listo! La web estará funcionando a pleno rendimiento en tu pantalla.

---

## 🤖 2. Análisis con Inteligencia Artificial (Gemini Plan 100% Gratuito)

En la ficha de cada partido dispones de una tarjeta llamada **"Análisis IA y Cuotas Justas"**.

### ¿Cómo funciona la IA en ProStats?
* **La IA no calcula ni inventa**: Todos los números y probabilidades los calcula previamente el código matemático en tu ordenador. La IA únicamente redacta una explicación en español claro sobre qué resultados favorecen las estadísticas y qué cuotas tendrían valor teórico.
* **Control de alucinaciones**: Un filtro automático revisa cada respuesta de Gemini; si la IA intentara citar un porcentaje inventado, se descarta y se muestra el explicador por plantillas.
* **Protección de límites**: El análisis solo se genera cuando tú pulsas manualmente el botón *"Generar análisis del partido"*. Cada análisis se guarda en caché durante 24 horas para que no gastes peticiones si vuelves a entrar.
* **Límite diario seguro**: Viene configurada con un tope de **50 análisis al día**. Al llegar a ese número, se activa automáticamente el explicador por plantillas sin errores ni bloqueos.
* **Privacidad**: Nunca se envían datos personales ni nombres de usuario a Google; únicamente los datos numéricos del encuentro. *(Nota: En el plan gratuito de Google AI Studio, Google puede usar los datos públicos enviados para mejorar sus modelos)*.

### ¿Cómo conseguir tu clave gratuita de Gemini (en 2 minutos)?
1. Entra en [Google AI Studio](https://aistudio.google.com/).
2. Inicia sesión con tu cuenta de Google (Gmail).
3. Haz clic en el botón azul **"Get API key"** (Obtener clave de API).
4. Pulsa en **"Create API key in new project"**.
5. Copia la clave generada (empieza por `AIza...` o `AQ...`). **No requiere tarjeta de crédito ni facturación**.
6. Abre el archivo `.env.local` en la carpeta del proyecto y pega tu clave:
   ```env
   GEMINI_API_KEY=tu_clave_aqui
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_DAILY_LIMIT=50
   ```
7. Guarda el archivo. ¡Ya tienes el análisis inteligente activado!

---

## 🧭 3. Guía de Uso de la Interfaz

### A. Dashboard Principal
* **Selector de deporte**: Alterna con un solo clic entre **Fútbol** y **Baloncesto**.
* **Competiciones oficiales**: LaLiga EA Sports, LaLiga Hypermotion, Premier League, Champions League, Serie A, Bundesliga, Ligue 1 y NBA.
* **Ventana de análisis (5 vs 10 partidos)**: Cambia entre el historial de los últimos 5 o 10 encuentros.
* **Transparencia en vivo**: Cada tarjeta te indica la procedencia oficial de los marcadores en tiempo real (Flashscore.es, ESPN o Modelo).

### B. Ficha Detallada del Partido
Al hacer clic en cualquier partido verás:
1. **Frecuencias Históricas (Verde Esmeralda)**: Desglosadas por equipo de forma independiente (*"Ganó 3 de 5 | Empató 1 de 5 | Perdió 1 de 5"*). No se mezclan para no crear confusión con un 1X2.
2. **Probabilidades Estimadas del Modelo (Azul)**: Proyección matemática teórica (Poisson para fútbol y Ritmo/Eficiencia de posesión para NBA) que suma exactamente el 100%.
3. **Tarjeta Análisis IA y Cuotas Justas**:
   * Botón manual de generación.
   * Tabla comparativa de **Cuota Justa ($1 / prob$)** vs **Cuota Real** del mercado. Si no hay cuotas de casas de apuestas, se indica limpiamente *"Sin datos"*.
   * Nivel de confianza dictado por el código: **Alta** (muestra $\ge 8$), **Media** (5 a 7) o **Baja** ($< 5$ partidos).
   * Lista de riesgos y aviso legal permanente: *"Estimación estadística, no resultado seguro ni promesa de rentabilidad."*
4. **Métricas Cara a Cara**: Comparativa de goles y rendimiento. Si una métrica no está en la fuente oficial, se muestra *"Sin datos en la fuente"* sin inventar porcentajes.
5. **Historial Directo (H2H)**: Enfrentamientos directos con fecha oficial de juego. Si no hay registros previos, se indica *"Sin datos previos"*.

---

## 🧪 4. Pruebas Automáticas de Calidad

El proyecto incluye **46 pruebas automáticas** que validan al milímetro que los cálculos matemáticos, el detector anti-alucinaciones, las cuotas justas y los límites de seguridad no fallen.

Para ejecutarlas, abre tu terminal y escribe:
```bash
npm test
```
Verás la confirmación inmediata:
```text
ℹ tests 46
ℹ pass 46
ℹ fail 0
```

---

## 🛠️ 5. Solución de Problemas Frecuentes

### Problema 1: "Aparece 'Límite temporal o error en la API de Google'"
* **Causa**: Puede deberse a que no hay conexión a internet momentáneamente, a que la clave no se ha guardado en `.env.local` o a que se han alcanzado las 50 peticiones gratuitas del día.
* **Solución**: La aplicación nunca se rompe. Cuando esto ocurre, activa automáticamente el **Explicador por Plantillas**, el cual redacta el análisis completo con los mismos números y cuotas justas sin gastar un solo céntimo.

### Problema 2: "El puerto 3000 ya está ocupado"
* **Solución**: Next.js intentará abrir el puerto `3001` (entra en `http://localhost:3001`), o puedes cerrar las terminales previas y volver a escribir `npm run dev`.

### Problema 3: "¿Tengo que pagar algo en algún momento?"
* **Rotundamente NO**. Tanto la API de marcadores (Flashscore / ESPN) como el modelo de Google Gemini (`gemini-2.5-flash`) operan bajo planes gratuitos sin facturación.
