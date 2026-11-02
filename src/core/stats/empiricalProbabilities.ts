/**
 * CÁLCULO EMPÍRICO DE PROBABILIDADES BASADO 100% EN DATOS REALES DE TEMPORADA
 * 
 * Principio clave: Cero modelos teóricos ni aproximaciones abstractas (sin Poisson ni xG teórico).
 * Se calcula directamente a partir de los partidos reales disputados en la temporada actual:
 * 1. Tasa de victorias, empates y derrotas oficiales del equipo local.
 * 2. Tasa de victorias, empates y derrotas oficiales del equipo visitante.
 * 3. Cruce empírico ponderado normalizado al 100%.
 * 4. Medias reales de goles o puntos anotados y recibidos en la temporada.
 */

import type { EstimatedProbabilities, SportType } from '../models.ts';

export interface TeamSeasonRecord {
  matchesPlayed: number;
  wins: number;
  draws?: number;
  losses: number;
  avgScored: number;
  avgConceded: number;
}

export function calculateEmpiricalProbabilities(
  homeStats: TeamSeasonRecord,
  awayStats: TeamSeasonRecord,
  sport: SportType = 'football'
): EstimatedProbabilities {
  const isFb = sport === 'football';

  // Si no hay partidos disputados suficientes, proteger con valores neutros
  if (homeStats.matchesPlayed === 0 && awayStats.matchesPlayed === 0) {
    return {
      homeWinProb: isFb ? 38 : 50,
      drawProb: isFb ? 28 : undefined,
      awayWinProb: isFb ? 34 : 50,
      expectedHomeScore: 0,
      expectedAwayScore: 0,
      modelName: 'Rendimiento Oficial Temporada Actual',
      confidenceRating: 'insuficiente',
      explanationText: 'Sin partidos oficiales previos en la temporada actual para calcular frecuencias reales.',
    };
  }

  const hPlayed = Math.max(1, homeStats.matchesPlayed);
  const aPlayed = Math.max(1, awayStats.matchesPlayed);

  // Tasas empíricas individuales
  const hWinRate = (homeStats.wins / hPlayed) * 100;
  const hDrawRate = isFb ? ((homeStats.draws || 0) / hPlayed) * 100 : 0;
  const hLossRate = (homeStats.losses / hPlayed) * 100;

  const aWinRate = (awayStats.wins / aPlayed) * 100;
  const aDrawRate = isFb ? ((awayStats.draws || 0) / aPlayed) * 100 : 0;
  const aLossRate = (awayStats.losses / aPlayed) * 100;

  let homeProbRaw: number;
  let drawProbRaw: number;
  let awayProbRaw: number;

  if (isFb) {
    // Cruce empírico: victorias del local + derrotas del visitante frente a frente
    homeProbRaw = (hWinRate + aLossRate) / 2;
    drawProbRaw = (hDrawRate + aDrawRate) / 2;
    awayProbRaw = (aWinRate + hLossRate) / 2;

    // Asegurar un piso mínimo empírico para evitar probabilidades 0% si hay pocos partidos
    homeProbRaw = Math.max(10, homeProbRaw);
    drawProbRaw = Math.max(15, drawProbRaw);
    awayProbRaw = Math.max(10, awayProbRaw);

    const total = homeProbRaw + drawProbRaw + awayProbRaw;
    const homeWinProb = Math.round((homeProbRaw / total) * 100);
    const awayWinProb = Math.round((awayProbRaw / total) * 100);
    const drawProb = Math.max(0, 100 - homeWinProb - awayWinProb);

    return {
      homeWinProb,
      drawProb,
      awayWinProb,
      expectedHomeScore: Number(homeStats.avgScored.toFixed(1)),
      expectedAwayScore: Number(awayStats.avgScored.toFixed(1)),
      modelName: 'Rendimiento Oficial Temporada Actual',
      confidenceRating: hPlayed >= 8 && aPlayed >= 8 ? 'alta' : hPlayed >= 5 ? 'media' : 'baja',
      explanationText: `Probabilidad empírica obtenida del rendimiento verificado en ${hPlayed} partidos del local y ${aPlayed} del visitante en la temporada actual.`,
    };
  } else {
    // Baloncesto (NBA / FIBA): sin empates
    homeProbRaw = (hWinRate + aLossRate) / 2;
    awayProbRaw = (aWinRate + hLossRate) / 2;

    homeProbRaw = Math.max(15, homeProbRaw);
    awayProbRaw = Math.max(15, awayProbRaw);

    const total = homeProbRaw + awayProbRaw;
    const homeWinProb = Math.round((homeProbRaw / total) * 100);
    const awayWinProb = 100 - homeWinProb;

    return {
      homeWinProb,
      awayWinProb,
      expectedHomeScore: Number(homeStats.avgScored.toFixed(1)),
      expectedAwayScore: Number(awayStats.avgScored.toFixed(1)),
      modelName: 'Rendimiento Oficial Temporada Actual',
      confidenceRating: hPlayed >= 8 && aPlayed >= 8 ? 'alta' : hPlayed >= 5 ? 'media' : 'baja',
      explanationText: `Probabilidad empírica basada en el balance de victorias reales en ${hPlayed} partidos del local y ${aPlayed} del visitante esta temporada.`,
    };
  }
}

