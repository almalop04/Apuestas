/**
 * MODELO ESTADÍSTICO DE RITMO Y EFICIENCIA (BALONCESTO)
 * 
 * ¿Cómo funciona en lenguaje sencillo?
 * 1. Estima el "Ritmo" (Pace): cuántas posesiones de balón jugarán ambos equipos.
 * 2. Estima la "Eficiencia Ofensiva y Defensiva" (Puntos por cada 100 posesiones).
 * 3. Incorpora el factor cancha (ventaja histórica en baloncesto de ~3.2 puntos para el local).
 * 4. Calcula la diferencia esperada de puntos (Spread o hándicap teórico).
 * 5. Mediante una función de distribución normal calibrada (con desviación típica de ~11.5 puntos),
 *    obtiene la probabilidad de victoria de cada bando.
 * 
 * En baloncesto no existe el empate definitivo (hay prórrogas reglamentarias), por lo que
 * la probabilidad se reparte exclusivamente entre Local y Visitante (sumando 100%).
 * 
 * Límites del modelo explicados con honestidad:
 * - Es sensible a la ausencia de jugadores estrella (en baloncesto 1 jugador clave define el 25% del quinteto).
 * - No refleja la gestión de minutos (partidos "back-to-back" consecutivos con descanso de titulares).
 */

import type { EstimatedProbabilities } from '../models.ts';

export interface BasketballTeamStats {
  pace: number;              // Posesiones estimadas por 48 min (ej. 99.5)
  offensiveRating: number;   // Puntos anotados por 100 posesiones (ej. 116.2)
  defensiveRating: number;   // Puntos concedidos por 100 posesiones (ej. 112.4)
  matchesPlayed: number;
}

export interface BasketballLeagueStats {
  avgPace: number;           // Media de la liga (ej. 98.8)
  avgOffensiveRating: number;// Media de la liga (ej. 114.5)
  homeCourtAdvantagePoints: number; // Típicamente +3.2 puntos
}

/**
 * Función de distribución normal acumulada aproximada (Sigmoide calibrada para baloncesto).
 */
function spreadToWinProbability(pointDifference: number, stdDev: number = 11.5): number {
  // Conversión matemática precisa: z-score = diff / (stdDev * sqrt(2))
  const z = pointDifference / (stdDev * Math.SQRT2);
  // Aproximación de Abramowitz & Stegun para la función de error
  const t = 1.0 / (1.0 + 0.3275911 * Math.abs(z));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1.0 - poly * Math.exp(-z * z);
  const cdf = 0.5 * (1.0 + (z >= 0 ? erf : -erf));
  return cdf;
}

/**
 * Calcula las probabilidades estimadas para un partido de baloncesto.
 */
export function calculateBasketballProbabilities(
  homeTeam: BasketballTeamStats,
  awayTeam: BasketballTeamStats,
  league: BasketballLeagueStats = {
    avgPace: 99.0,
    avgOffensiveRating: 114.0,
    homeCourtAdvantagePoints: 3.2,
  }
): EstimatedProbabilities {
  // 1. Ritmo esperado del encuentro (promedio armónico de posesiones)
  const expectedPace = (homeTeam.pace + awayTeam.pace) / 2;

  // 2. Eficiencias ofensivas proyectadas
  const homeExpectedEff =
    homeTeam.offensiveRating + (awayTeam.defensiveRating - league.avgOffensiveRating);
  const awayExpectedEff =
    awayTeam.offensiveRating + (homeTeam.defensiveRating - league.avgOffensiveRating);

  // 3. Puntos esperados
  let expectedHomePoints = (expectedPace * homeExpectedEff) / 100 + league.homeCourtAdvantagePoints / 2;
  let expectedAwayPoints = (expectedPace * awayExpectedEff) / 100 - league.homeCourtAdvantagePoints / 2;

  // Redondeo
  expectedHomePoints = Math.round(expectedHomePoints * 10) / 10;
  expectedAwayPoints = Math.round(expectedAwayPoints * 10) / 10;

  // 4. Margen esperado (Spread) y probabilidad
  const pointSpread = expectedHomePoints - expectedAwayPoints;
  const rawHomeProb = spreadToWinProbability(pointSpread);

  const homeWinProb = Math.min(Math.max(Math.round(rawHomeProb * 100), 5), 95);
  const awayWinProb = 100 - homeWinProb;

  // Confianza de muestra
  const minMatches = Math.min(homeTeam.matchesPlayed, awayTeam.matchesPlayed);
  let confidence: 'alta' | 'media' | 'baja' | 'insuficiente' = 'media';
  if (minMatches >= 15) confidence = 'alta';
  else if (minMatches < 5) confidence = 'insuficiente';

  return {
    homeWinProb,
    awayWinProb,
    expectedHomeScore: expectedHomePoints,
    expectedAwayScore: expectedAwayPoints,
    modelName: 'Modelo de Ritmo y Eficiencia por Posesión (NBA/FIBA)',
    confidenceRating: confidence,
    explanationText: `Ritmo proyectado de ${expectedPace.toFixed(1)} posesiones. Puntos proyectados: ${expectedHomePoints} (Local) vs ${expectedAwayPoints} (Visitante). Margen teórico de ${pointSpread > 0 ? '+' : ''}${pointSpread.toFixed(1)} pts a favor del local. Probabilidad de victoria: ${homeWinProb}% Local / ${awayWinProb}% Visitante.`,
  };
}
