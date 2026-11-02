/**
 * MODELO ESTADÍSTICO DE POISSON BIVARIADO (FÚTBOL)
 * 
 * ¿Cómo funciona en lenguaje sencillo?
 * 1. Calcula la media de goles que se marcan habitualmente en la liga (ej. 1.45 goles por equipo).
 * 2. Compara la capacidad goleadora del equipo local (fuerza de ataque) contra la facilidad 
 *    con la que el rival concede goles (debilidad de defensa), y añade un plus por jugar en casa (+0.25 goles aprox).
 * 3. Hace lo mismo para el visitante.
 * 4. Esto da el "Valor Esperado de Goles" (denominado Lambda o λ).
 * 5. Con la fórmula de Poisson, calculamos la probabilidad matemática de cada marcador exacto
 *    (desde 0-0 hasta 6-6) y sumamos todas las combinaciones donde gana el local, hay empate o gana el visitante.
 * 
 * Límites del modelo explicados con honestidad:
 * - Asume que los goles ocurren como sucesos independientes (no predice expulsiones tempranas ni giros tácticos).
 * - No contempla el cansancio por partidos entre semana ni el estado anímico salvo que se refleje en los datos.
 */

import type { EstimatedProbabilities } from '../models.ts';

export interface FootballTeamStats {
  avgGoalsScoredHome: number;
  avgGoalsConcededHome: number;
  avgGoalsScoredAway: number;
  avgGoalsConcededAway: number;
  matchesPlayed: number;
}

export interface LeagueStats {
  avgHomeGoals: number; // Típicamente ~1.50
  avgAwayGoals: number; // Típicamente ~1.15
}

/**
 * Función factorial matemática pura.
 */
function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

/**
 * Distribución de Poisson: P(k; λ) = (λ^k * e^-λ) / k!
 */
export function calculatePoissonProbability(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/**
 * Calcula las probabilidades estimadas para un partido de fútbol.
 */
export function calculateFootballProbabilities(
  homeTeam: FootballTeamStats,
  awayTeam: FootballTeamStats,
  league: LeagueStats = { avgHomeGoals: 1.50, avgAwayGoals: 1.15 }
): EstimatedProbabilities {
  // 1. Fuerza ofensiva y defensiva relativa
  // Ataque local = goles anotados en casa / media de goles locales de la liga
  const homeAttackStrength = homeTeam.avgGoalsScoredHome / Math.max(0.1, league.avgHomeGoals);
  // Defensa visitante = goles recibidos fuera / media de goles recibidos fuera (que son los goles locales de la liga)
  const awayDefenseWeakness = awayTeam.avgGoalsConcededAway / Math.max(0.1, league.avgHomeGoals);

  // Ataque visitante = goles anotados fuera / media de goles visitantes de la liga
  const awayAttackStrength = awayTeam.avgGoalsScoredAway / Math.max(0.1, league.avgAwayGoals);
  // Defensa local = goles recibidos en casa / media de goles visitantes de la liga
  const homeDefenseWeakness = homeTeam.avgGoalsConcededHome / Math.max(0.1, league.avgAwayGoals);

  // 2. Goles esperados (λ)
  let expectedHomeGoals = homeAttackStrength * awayDefenseWeakness * league.avgHomeGoals;
  let expectedAwayGoals = awayAttackStrength * homeDefenseWeakness * league.avgAwayGoals;

  // Ajuste de realismo (evitar lambdas anómalas por datos extremos)
  expectedHomeGoals = Math.min(Math.max(expectedHomeGoals, 0.2), 4.5);
  expectedAwayGoals = Math.min(Math.max(expectedAwayGoals, 0.2), 4.0);

  // 3. Matriz de marcadores posibles (de 0 a 6 goles por bando)
  const maxGoals = 6;
  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;

  for (let h = 0; h <= maxGoals; h++) {
    const probH = calculatePoissonProbability(h, expectedHomeGoals);
    for (let a = 0; a <= maxGoals; a++) {
      const probA = calculatePoissonProbability(a, expectedAwayGoals);
      const jointProb = probH * probA;

      if (h > a) {
        homeWinProb += jointProb;
      } else if (h === a) {
        drawProb += jointProb;
      } else {
        awayWinProb += jointProb;
      }
    }
  }

  // Normalizar para que sumen exactamente 100%
  const total = homeWinProb + drawProb + awayWinProb;
  const pHome = Math.round((homeWinProb / total) * 100);
  const pDraw = Math.round((drawProb / total) * 100);
  // Ajuste del remanente para cuadrar el 100% exacto
  const pAway = 100 - pHome - pDraw;

  // Evaluación de fiabilidad en función de la muestra
  const minMatches = Math.min(homeTeam.matchesPlayed, awayTeam.matchesPlayed);
  let confidence: 'alta' | 'media' | 'baja' | 'insuficiente' = 'media';
  if (minMatches >= 15) confidence = 'alta';
  else if (minMatches < 5) confidence = 'insuficiente';

  return {
    homeWinProb: pHome,
    drawProb: pDraw,
    awayWinProb: pAway,
    expectedHomeScore: Math.round(expectedHomeGoals * 100) / 100,
    expectedAwayScore: Math.round(expectedAwayGoals * 100) / 100,
    modelName: 'Distribución Bivariada de Poisson (xG)',
    confidenceRating: confidence,
    explanationText: `El modelo proyecta ${expectedHomeGoals.toFixed(2)} goles para el local y ${expectedAwayGoals.toFixed(2)} para el visitante. El local presenta una probabilidad calculada de victoria del ${pHome}%, empate del ${pDraw}% y victoria visitante del ${pAway}%. Nota: La probabilidad es una estimación neutral y no garantiza el resultado.`,
  };
}
