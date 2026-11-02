/**
 * PRUEBAS AUTOMÁTICAS DE CÁLCULO ESTADÍSTICO Y TRATAMIENTO DE DATOS
 * 
 * Se ejecutan con el test runner nativo de Node.js: `npm test`
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Módulos a probar (usando compilación TS / lógica directa)
import { evaluateSampleSize } from '../core/stats/sampleGuard.ts';
import { calculateFrequencies, calculateWeightedMomentum } from '../core/stats/frequencies.ts';
import { calculatePoissonProbability, calculateFootballProbabilities } from '../core/stats/poisson.ts';
import { calculateBasketballProbabilities } from '../core/stats/basketballModel.ts';
import { calculateEmpiricalProbabilities } from '../core/stats/empiricalProbabilities.ts';
import { SeasonStandingsService } from '../data/services/seasonStandingsService.ts';
import { RealOddsService } from '../data/services/realOddsService.ts';

test('1. Guardia de Muestra Mínima (Sample Guard)', async (t) => {
  await t.test('debe bloquear cálculos si la muestra es menor a 5 partidos', () => {
    const result = evaluateSampleSize(3);
    assert.equal(result.isSufficient, false);
    assert.equal(result.badgeType, 'insufficient');
    assert.match(result.badgeText, /Muestra insuficiente/);
    assert.match(result.reason || '', /Se requieren al menos 5 partidos/);
  });

  await t.test('debe permitir cálculos con aviso si la muestra está entre 5 y 9 partidos', () => {
    const result = evaluateSampleSize(6);
    assert.equal(result.isSufficient, true);
    assert.equal(result.badgeType, 'warning');
    assert.match(result.badgeText, /Muestra básica/);
  });

  await t.test('debe marcar como óptima una muestra de 10 o más partidos', () => {
    const result = evaluateSampleSize(10);
    assert.equal(result.isSufficient, true);
    assert.equal(result.badgeType, 'sufficient');
    assert.match(result.badgeText, /Muestra óptima/);
  });
});

test('2. Frecuencias Históricas (Últimos 5 y 10 partidos)', async (t) => {
  const mockMatches = [
    { teamGoalsOrPoints: 2, opponentGoalsOrPoints: 1, isHome: true, date: '2026-10-25' }, // Win, Total 3 (>2.5), Both scored
    { teamGoalsOrPoints: 1, opponentGoalsOrPoints: 1, isHome: false, date: '2026-10-20' }, // Draw, Total 2 (<=2.5), Both scored
    { teamGoalsOrPoints: 0, opponentGoalsOrPoints: 2, isHome: true, date: '2026-10-15' }, // Loss, Total 2 (<=2.5), Only one scored
    { teamGoalsOrPoints: 3, opponentGoalsOrPoints: 0, isHome: false, date: '2026-10-10' }, // Win, Total 3 (>2.5), Only one scored
    { teamGoalsOrPoints: 2, opponentGoalsOrPoints: 2, isHome: true, date: '2026-10-05' }, // Draw, Total 4 (>2.5), Both scored
  ];

  await t.test('calcula correctamente porcentajes de victoria, empate y derrota en fútbol', () => {
    const freq = calculateFrequencies(mockMatches, 5, 'football');
    assert.equal(freq.totalMatchesEvaluated, 5);
    // 2 victorias = 40%
    assert.equal(freq.homeTeamWins, 40);
    // 2 empates = 40%
    assert.equal(freq.draws, 40);
    // 1 derrota = 20%
    assert.equal(freq.awayTeamWins, 20);
    // Suma de porcentajes debe ser 100%
    assert.equal(freq.homeTeamWins + (freq.draws || 0) + freq.awayTeamWins, 100);
  });

  await t.test('calcula correctamente Over 2.5 y Ambos Marcan', () => {
    const freq = calculateFrequencies(mockMatches, 5, 'football');
    // Partidos con >2.5 goles: partido 1 (3), partido 4 (3), partido 5 (4) = 3 de 5 = 60%
    assert.equal(freq.over25GoalsOrOverPointsRate, 60);
    // Ambos marcan: partido 1, partido 2, partido 5 = 3 de 5 = 60%
    assert.equal(freq.bothTeamsScoredRate, 60);
  });

  await t.test('devuelve valores neutros seguros si la lista de partidos está vacía', () => {
    const freq = calculateFrequencies([], 5, 'football');
    assert.equal(freq.totalMatchesEvaluated, 0);
    assert.equal(freq.homeTeamWins, 0);
    assert.equal(freq.avgGoalsOrPointsScored, 0);
  });
});

test('3. Momentum Ponderado (Racha reciente)', async (t) => {
  const matches = [
    { teamGoalsOrPoints: 3, opponentGoalsOrPoints: 0, isHome: true, date: '2026-10-28' }, // W (peso 5)
    { teamGoalsOrPoints: 2, opponentGoalsOrPoints: 1, isHome: true, date: '2026-10-24' }, // W (peso 4)
    { teamGoalsOrPoints: 2, opponentGoalsOrPoints: 2, isHome: false, date: '2026-10-18' }, // D (peso 3)
    { teamGoalsOrPoints: 0, opponentGoalsOrPoints: 1, isHome: true, date: '2026-10-12' }, // L (peso 2)
    { teamGoalsOrPoints: 1, opponentGoalsOrPoints: 0, isHome: false, date: '2026-10-06' }, // W (peso 1)
  ];

  const momentum = calculateWeightedMomentum(matches);
  assert.equal(momentum.trendDirection, 'up');
  assert.equal(momentum.sequence.join(''), 'WWDLW');
  assert.ok(momentum.momentumScore > 60);
});

test('4. Modelo de Poisson (Fútbol)', async (t) => {
  await t.test('probabilidad de Poisson elemental', () => {
    // Si lambda = 1.0, P(0) = e^-1 ≈ 0.367879
    const p0 = calculatePoissonProbability(0, 1.0);
    assert.ok(Math.abs(p0 - 0.3678) < 0.001);
  });

  await t.test('las probabilidades estimadas deben sumar exactamente el 100%', () => {
    const homeTeam = {
      avgGoalsScoredHome: 1.8,
      avgGoalsConcededHome: 0.9,
      avgGoalsScoredAway: 1.2,
      avgGoalsConcededAway: 1.1,
      matchesPlayed: 12,
    };
    const awayTeam = {
      avgGoalsScoredHome: 1.4,
      avgGoalsConcededHome: 1.3,
      avgGoalsScoredAway: 1.0,
      avgGoalsConcededAway: 1.6,
      matchesPlayed: 12,
    };

    const result = calculateFootballProbabilities(homeTeam, awayTeam);
    const sum = result.homeWinProb + (result.drawProb || 0) + result.awayWinProb;
    assert.equal(sum, 100);
    assert.ok(result.expectedHomeScore > result.expectedAwayScore);
    assert.ok(result.homeWinProb > result.awayWinProb);
    assert.ok(result.explanationText.length > 20);
  });
});

test('5. Modelo de Ritmo y Eficiencia (Baloncesto)', async (t) => {
  const home = {
    pace: 101.2,
    offensiveRating: 118.5,
    defensiveRating: 110.2,
    matchesPlayed: 14,
  };
  const away = {
    pace: 98.4,
    offensiveRating: 111.0,
    defensiveRating: 116.8,
    matchesPlayed: 14,
  };

  const result = calculateBasketballProbabilities(home, away);
  assert.equal(result.homeWinProb + result.awayWinProb, 100);
  // El local es significativamente superior en rating y juega en casa -> Probabilidad alta
  assert.ok(result.homeWinProb > 60);
  assert.ok(result.expectedHomeScore > result.expectedAwayScore);
});

test('6. Probabilidades Empíricas Basadas en Rendimiento Real (calculateEmpiricalProbabilities)', async (t) => {
  await t.test('debe calcular probabilidades empíricas que sumen exactamente el 100% en fútbol', () => {
    const home = { matchesPlayed: 10, wins: 6, draws: 2, losses: 2, avgScored: 2.1, avgConceded: 0.9 };
    const away = { matchesPlayed: 10, wins: 4, draws: 3, losses: 3, avgScored: 1.4, avgConceded: 1.2 };

    const result = calculateEmpiricalProbabilities(home, away, 'football');
    assert.equal(result.homeWinProb + (result.drawProb || 0) + result.awayWinProb, 100);
    assert.equal(result.modelName, 'Rendimiento Oficial Temporada Actual');
    assert.equal(result.expectedHomeScore, 2.1);
    assert.equal(result.expectedAwayScore, 1.4);
    assert.ok(result.homeWinProb > result.awayWinProb);
  });

  await t.test('debe calcular probabilidades en baloncesto sin empates sumando 100%', () => {
    const home = { matchesPlayed: 15, wins: 11, losses: 4, avgScored: 115.5, avgConceded: 108.2 };
    const away = { matchesPlayed: 15, wins: 8, losses: 7, avgScored: 110.1, avgConceded: 112.4 };

    const result = calculateEmpiricalProbabilities(home, away, 'basketball');
    assert.equal(result.homeWinProb + result.awayWinProb, 100);
    assert.equal(result.drawProb, undefined);
    assert.ok(result.homeWinProb > 50);
  });
});

test('7. Servicio de Clasificaciones Oficiales de Temporada (SeasonStandingsService)', async (t) => {
  await t.test('debe normalizar y resolver alias de clubes correctamente', () => {
    assert.equal(SeasonStandingsService.normalize('Deportivo de A Coruña'), 'deportivo');
    assert.equal(SeasonStandingsService.normalize('CA Osasuna'), 'osasuna');
    assert.equal(SeasonStandingsService.normalize('Atlético de Madrid'), 'atletico madrid');
    assert.equal(SeasonStandingsService.normalize('Celta de Vigo'), 'celta vigo');
  });

  await t.test('debe emparejar nombres de equipos de Flashscore con clasificaciones oficiales', () => {
    assert.equal(SeasonStandingsService.matchesTeam('Deportivo de A Coruña', 'Deportivo', 'DEP'), true);
    assert.equal(SeasonStandingsService.matchesTeam('Osasuna', 'Osasuna', 'OSA'), true);
    assert.equal(SeasonStandingsService.matchesTeam('Deportivo Alavés', 'Alavés', 'ALA'), true);
    assert.equal(SeasonStandingsService.matchesTeam('Atlético de Madrid', 'Atlético Madrid', 'ATM'), true);
    assert.equal(SeasonStandingsService.matchesTeam('Real Madrid', 'Real Madrid', 'RMA'), true);
  });

  await t.test('debe mapear correctamente los códigos de liga', () => {
    const fbCodes = SeasonStandingsService.resolveLeagueCodes('esp.1', 'football');
    assert.ok(fbCodes.includes('esp.1'));
    const nbaCodes = SeasonStandingsService.resolveLeagueCodes('nba', 'basketball');
    assert.deepEqual(nbaCodes, ['nba']);
  });
});

test('8. Servicio de Cuotas Reales de Casas de Apuestas (RealOddsService)', async (t) => {
  await t.test('debe convertir cuotas americanas positivas a formato decimal europeo', () => {
    assert.equal(RealOddsService.parseToDecimal('+110'), 2.1);
    assert.equal(RealOddsService.parseToDecimal('+220'), 3.2);
    assert.equal(RealOddsService.parseToDecimal('+285'), 3.85);
  });

  await t.test('debe convertir cuotas americanas negativas a formato decimal europeo', () => {
    assert.equal(RealOddsService.parseToDecimal('-150'), 1.67);
    assert.equal(RealOddsService.parseToDecimal('-200'), 1.5);
  });

  await t.test('debe preservar cuotas ya expresadas en formato decimal', () => {
    assert.equal(RealOddsService.parseToDecimal('2.10'), 2.1);
    assert.equal(RealOddsService.parseToDecimal(1.95), 1.95);
  });

  await t.test('debe devolver null para entradas inválidas o vacías', () => {
    assert.equal(RealOddsService.parseToDecimal(''), null);
    assert.equal(RealOddsService.parseToDecimal(undefined), null);
    assert.equal(RealOddsService.parseToDecimal('abc'), null);
  });
});
