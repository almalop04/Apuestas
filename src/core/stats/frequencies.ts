/**
 * CÁLCULO DE FRECUENCIAS HISTÓRICAS REALES
 * 
 * Principio de diseño UX:
 * La frecuencia histórica refleja lo que OCURRIÓ en el pasado (hechos empíricos).
 * Se presenta siempre con el color verde esmeralda (#2DD4A7) y nunca debe
 * confundirse con una probabilidad o predicción de futuro.
 */

import type { HistoricalFrequencies, SportType } from '../models.ts';

export interface RawMatchRecord {
  teamGoalsOrPoints: number;
  opponentGoalsOrPoints: number;
  isHome: boolean;
  date: string;
}

/**
 * Calcula frecuencias históricas para un tramo de 5 o 10 partidos.
 */
export function calculateFrequencies(
  matches: RawMatchRecord[],
  windowSize: 5 | 10,
  sport: SportType = 'football'
): HistoricalFrequencies {
  // Tomar los últimos N partidos (si hay menos, se toma lo que haya)
  const sample = matches.slice(0, windowSize);
  const total = sample.length;

  if (total === 0) {
    return {
      sampleSize: windowSize,
      totalMatchesEvaluated: 0,
      homeTeamWins: 0,
      awayTeamWins: 0,
      draws: 0,
      over25GoalsOrOverPointsRate: 0,
      bothTeamsScoredRate: 0,
      avgGoalsOrPointsScored: 0,
      avgGoalsOrPointsConceded: 0,
    };
  }

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let overThresholdCount = 0;
  let bothScoredCount = 0;
  let totalScored = 0;
  let totalConceded = 0;

  // Umbral estándar: 2.5 goles en fútbol, 215.5 puntos en baloncesto
  const threshold = sport === 'football' ? 2.5 : 215.5;

  for (const m of sample) {
    totalScored += m.teamGoalsOrPoints;
    totalConceded += m.opponentGoalsOrPoints;

    const matchTotal = m.teamGoalsOrPoints + m.opponentGoalsOrPoints;
    if (matchTotal > threshold) {
      overThresholdCount++;
    }

    if (sport === 'football' && m.teamGoalsOrPoints > 0 && m.opponentGoalsOrPoints > 0) {
      bothScoredCount++;
    }

    if (m.teamGoalsOrPoints > m.opponentGoalsOrPoints) {
      wins++;
    } else if (m.teamGoalsOrPoints === m.opponentGoalsOrPoints) {
      draws++;
    } else {
      losses++;
    }
  }

  const roundTo1Dec = (n: number) => Math.round(n * 10) / 10;
  const toPercentage = (count: number) => Math.round((count / total) * 100);

  return {
    sampleSize: windowSize,
    totalMatchesEvaluated: total,
    homeTeamWins: toPercentage(wins),
    awayTeamWins: toPercentage(losses),
    draws: sport === 'football' ? toPercentage(draws) : undefined,
    winsCount: wins,
    drawsCount: sport === 'football' ? draws : 0,
    lossesCount: losses,
    over25GoalsOrOverPointsRate: toPercentage(overThresholdCount),
    bothTeamsScoredRate: sport === 'football' ? toPercentage(bothScoredCount) : undefined,
    avgGoalsOrPointsScored: roundTo1Dec(totalScored / total),
    avgGoalsOrPointsConceded: roundTo1Dec(totalConceded / total),
  };
}

/**
 * Calcula la racha / momentum ponderado de los últimos partidos.
 * Da más peso al partido más reciente (5x, 4x, 3x, 2x, 1x).
 */
export function calculateWeightedMomentum(matches: RawMatchRecord[]): {
  momentumScore: number; // Escala de 0 a 100
  trendDirection: 'up' | 'stable' | 'down';
  sequence: ('W' | 'D' | 'L')[];
} {
  const sample = matches.slice(0, 5);
  if (sample.length === 0) {
    return { momentumScore: 50, trendDirection: 'stable', sequence: [] };
  }

  const sequence: ('W' | 'D' | 'L')[] = [];
  let weightedPoints = 0;
  let totalWeights = 0;

  sample.forEach((m, index) => {
    // El partido en index 0 es el más reciente -> mayor peso (5, 4, 3...)
    const weight = sample.length - index;
    totalWeights += weight;

    if (m.teamGoalsOrPoints > m.opponentGoalsOrPoints) {
      sequence.push('W');
      weightedPoints += 3 * weight;
    } else if (m.teamGoalsOrPoints === m.opponentGoalsOrPoints) {
      sequence.push('D');
      weightedPoints += 1 * weight;
    } else {
      sequence.push('L');
    }
  });

  const maxPossible = totalWeights * 3;
  const momentumScore = Math.round((weightedPoints / maxPossible) * 100);

  let trendDirection: 'up' | 'stable' | 'down' = 'stable';
  if (momentumScore >= 65) trendDirection = 'up';
  else if (momentumScore <= 35) trendDirection = 'down';

  return { momentumScore, trendDirection, sequence };
}
