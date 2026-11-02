/**
 * PRUEBAS AUTOMÁTICAS DE LA FASE B: CÁLCULO DE MERCADOS Y EXPLICADOR POR PLANTILLAS
 * 
 * Se ejecutan con: `npm test` o `node --experimental-strip-types --test src/tests/marketCalculator.test.mjs`
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateFairOdd,
  calculateImpliedProbability,
  calculateBookmakerMargin,
  evaluateConfidence,
  analyzeMatchMarkets,
} from '../core/stats/marketCalculator.ts';
import { TemplateExplainer } from '../core/stats/templateExplainer.ts';

test('1. Cuotas Justas y Probabilidades Implícitas', async (t) => {
  await t.test('debe calcular la cuota justa como 1 / (probabilidad / 100)', () => {
    assert.equal(calculateFairOdd(50), 2.0);
    assert.equal(calculateFairOdd(25), 4.0);
    assert.equal(calculateFairOdd(33.33), 3.0);
    assert.equal(calculateFairOdd(10), 10.0);
  });

  await t.test('debe devolver null para probabilidades menores o iguales a cero o inválidas', () => {
    assert.equal(calculateFairOdd(0), null);
    assert.equal(calculateFairOdd(-5), null);
    assert.equal(calculateFairOdd(NaN), null);
  });

  await t.test('debe calcular la probabilidad implícita de una cuota decimal', () => {
    assert.equal(calculateImpliedProbability(2.0), 50.0);
    assert.equal(calculateImpliedProbability(4.0), 25.0);
    assert.equal(calculateImpliedProbability(1.5), 66.7);
  });

  await t.test('debe devolver null si no hay cuota real o si es menor o igual a 1', () => {
    assert.equal(calculateImpliedProbability(null), null);
    assert.equal(calculateImpliedProbability(1.0), null);
    assert.equal(calculateImpliedProbability(0.5), null);
  });
});

test('2. Margen de la Casa de Apuestas (Overround)', async (t) => {
  await t.test('debe calcular el margen si todas las cuotas del mercado están presentes', () => {
    // Ejemplo: 50% + 28% + 28% = 106% -> margen = 6.0%
    const margin = calculateBookmakerMargin([50.0, 28.0, 28.0]);
    assert.equal(margin, 6.0);
  });

  await t.test('debe devolver null si falta alguna cuota en el mercado', () => {
    const margin = calculateBookmakerMargin([50.0, null, 28.0]);
    assert.equal(margin, null);
  });
});

test('3. Reglas Estrictas de Confianza (Code-Driven)', async (t) => {
  await t.test('muestra menor a 5 debe ser siempre confianza BAJA', () => {
    const conf = evaluateConfidence(3, false, 0);
    assert.equal(conf.level, 'baja');
    assert.match(conf.reason, /Muestra reducida/);
  });

  await t.test('muestra entre 5 y 7 debe ser confianza MEDIA', () => {
    const conf = evaluateConfidence(6, true, 0);
    assert.equal(conf.level, 'media');
    assert.match(conf.reason, /Muestra intermedia/);
  });

  await t.test('muestra de 8 o más sin campos faltantes debe ser confianza ALTA', () => {
    const conf = evaluateConfidence(10, true, 0);
    assert.equal(conf.level, 'alta');
    assert.match(conf.reason, /Muestra robusta/);
  });

  await t.test('muestra de 10 con más de 2 campos faltantes se reduce a MEDIA', () => {
    const conf = evaluateConfidence(10, true, 3);
    assert.equal(conf.level, 'media');
  });
});

test('4. Análisis de Mercados con y sin Cuotas Reales', async (t) => {
  const dummyMatch = {
    id: 'test-match-1',
    sport: 'football',
    league: { id: 'esp.1', name: 'LaLiga', country: 'España', season: '2026/2027' },
    date: '2026-11-02',
    time: '21:00',
    status: 'scheduled',
    homeTeam: { id: 'team-1', name: 'Real Madrid', shortName: 'RMA', sport: 'football' },
    awayTeam: { id: 'team-2', name: 'Barcelona', shortName: 'BAR', sport: 'football' },
    dataAvailability: {
      sourceName: 'Flashscore.es',
      lastUpdated: 'En vivo',
      sampleSize: 10,
      isSampleSufficient: true,
      missingFields: [],
    },
    frequencies5: {
      home: {
        sampleSize: 5,
        totalMatchesEvaluated: 5,
        homeTeamWins: 60,
        awayTeamWins: 20,
        draws: 20,
        over25GoalsOrOverPointsRate: 60,
        avgGoalsOrPointsScored: 2.1,
        avgGoalsOrPointsConceded: 1.0,
      },
      away: {
        sampleSize: 5,
        totalMatchesEvaluated: 5,
        homeTeamWins: 60,
        awayTeamWins: 20,
        draws: 20,
        over25GoalsOrOverPointsRate: 40,
        avgGoalsOrPointsScored: 1.8,
        avgGoalsOrPointsConceded: 1.2,
      },
    },
    frequencies10: {
      home: { sampleSize: 10, totalMatchesEvaluated: 10, homeTeamWins: 70, awayTeamWins: 20, draws: 10, over25GoalsOrOverPointsRate: 60, avgGoalsOrPointsScored: 2.0, avgGoalsOrPointsConceded: 0.9 },
      away: { sampleSize: 10, totalMatchesEvaluated: 10, homeTeamWins: 60, awayTeamWins: 20, draws: 20, over25GoalsOrOverPointsRate: 50, avgGoalsOrPointsScored: 1.7, avgGoalsOrPointsConceded: 1.1 },
    },
    probabilities: {
      homeWinProb: 52,
      drawProb: 24,
      awayWinProb: 24,
      expectedHomeScore: 1.9,
      expectedAwayScore: 1.1,
      modelName: 'Poisson Bivariado',
      confidenceRating: 'alta',
      explanationText: 'Dominio local proyectado.',
    },
    headToHead: [],
    metrics: [],
  };

  await t.test('debe calcular cuotas justas correctamente sin cuotas reales', () => {
    const analysis = analyzeMatchMarkets(dummyMatch);
    assert.equal(analysis.hasAnyRealOdds, false);
    const m1x2 = analysis.markets.find((m) => m.marketId === '1x2');
    assert.ok(m1x2);
    // 52% -> cuota justa 1.92
    assert.equal(m1x2.items[0].cuotaJusta, 1.92);
    assert.equal(m1x2.items[0].cuotaReal, null);
    assert.equal(m1x2.items[0].probImplicita, null);
    assert.equal(m1x2.margenCasa, null);
  });

  await t.test('debe calcular diferencias y margen cuando se suministran cuotas reales', () => {
    const analysis = analyzeMatchMarkets(dummyMatch, {
      oneXTwo: { home: 2.1, draw: 3.4, away: 3.5 },
    });
    assert.equal(analysis.hasAnyRealOdds, true);
    const m1x2 = analysis.markets.find((m) => m.marketId === '1x2');
    assert.ok(m1x2);

    const homeItem = m1x2.items[0];
    assert.equal(homeItem.cuotaReal, 2.1);
    // Prob implícita de 2.1 = 1 / 2.1 * 100 = 47.6%
    assert.equal(homeItem.probImplicita, 47.6);
    // Diferencia cuota = 2.1 - 1.92 = +0.18
    assert.equal(homeItem.diferenciaCuota, 0.18);
    // Diferencia prob = 52 - 47.6 = +4.4%
    assert.equal(homeItem.diferenciaProb, 4.4);
    assert.ok(m1x2.margenCasa != null && m1x2.margenCasa > 0);
  });

  await t.test('debe generar mercados detallados de corners, remates, tarjetas y goles por equipo', () => {
    const analysis = analyzeMatchMarkets(dummyMatch);
    
    // Mercados de goles por equipo
    const homeGoals = analysis.markets.find((m) => m.marketId === 'team_goals_home');
    assert.ok(homeGoals, 'Debe incluir mercado de goles para el equipo local');
    assert.equal(homeGoals.category, 'team_goals');

    // Mercados de córners
    const corners = analysis.markets.find((m) => m.marketId === 'corners_total');
    assert.ok(corners, 'Debe incluir mercado de córners totales');
    assert.equal(corners.category, 'corners');
    assert.ok(corners.items.some((i) => i.selection.includes('8.5')));
    assert.ok(corners.items.some((i) => i.selection.includes('9.5')));

    // Mercados de remates a puerta
    const shots = analysis.markets.find((m) => m.marketId === 'shots_total');
    assert.ok(shots, 'Debe incluir mercado de remates a puerta totales');
    assert.equal(shots.category, 'shots');

    // Mercados de remates de delanteros clave
    const playerShots = analysis.markets.filter((m) => m.marketId.startsWith('player_shots_'));
    assert.ok(playerShots.length >= 2, 'Debe incluir remates de delanteros de ambos clubes');

    // Mercados de tarjetas
    const cards = analysis.markets.find((m) => m.marketId === 'cards_total');
    assert.ok(cards, 'Debe incluir mercado de tarjetas totales');
    assert.equal(cards.category, 'cards');
    assert.ok(cards.items.some((i) => i.selection.includes('3.5')));
  });
});

test('5. Explicador por Plantillas (Respaldo sin IA)', async (t) => {
  const dummyMatch = {
    id: 'test-match-2',
    sport: 'football',
    league: { id: 'esp.1', name: 'LaLiga', country: 'España', season: '2026/2027' },
    date: '2026-11-02',
    time: '21:00',
    status: 'scheduled',
    homeTeam: { id: 'team-1', name: 'Atlético de Madrid', shortName: 'ATM', sport: 'football' },
    awayTeam: { id: 'team-2', name: 'Sevilla', shortName: 'SEV', sport: 'football' },
    dataAvailability: {
      sourceName: 'Flashscore.es',
      lastUpdated: 'En vivo',
      sampleSize: 10,
      isSampleSufficient: true,
      missingFields: [],
    },
    frequencies5: {
      home: { sampleSize: 5, totalMatchesEvaluated: 5, homeTeamWins: 60, awayTeamWins: 20, draws: 20, over25GoalsOrOverPointsRate: 40, avgGoalsOrPointsScored: 1.8, avgGoalsOrPointsConceded: 0.8 },
      away: { sampleSize: 5, totalMatchesEvaluated: 5, homeTeamWins: 40, awayTeamWins: 40, draws: 20, over25GoalsOrOverPointsRate: 40, avgGoalsOrPointsScored: 1.2, avgGoalsOrPointsConceded: 1.4 },
    },
    frequencies10: {
      home: { sampleSize: 10, totalMatchesEvaluated: 10, homeTeamWins: 60, awayTeamWins: 20, draws: 20, over25GoalsOrOverPointsRate: 40, avgGoalsOrPointsScored: 1.7, avgGoalsOrPointsConceded: 0.8 },
      away: { sampleSize: 10, totalMatchesEvaluated: 10, homeTeamWins: 40, awayTeamWins: 40, draws: 20, over25GoalsOrOverPointsRate: 40, avgGoalsOrPointsScored: 1.1, avgGoalsOrPointsConceded: 1.5 },
    },
    probabilities: {
      homeWinProb: 55,
      drawProb: 25,
      awayWinProb: 20,
      expectedHomeScore: 1.7,
      expectedAwayScore: 0.9,
      modelName: 'Poisson Bivariado',
      confidenceRating: 'alta',
      explanationText: 'Ventaja defensiva local.',
    },
    headToHead: [],
    metrics: [],
  };

  const marketAnalysis = analyzeMatchMarkets(dummyMatch);
  const expl = TemplateExplainer.generateAnalysis(marketAnalysis, dummyMatch);

  await t.test('debe terminar obligatoriamente con la advertencia estándar', () => {
    assert.equal(expl.aviso, 'Estimación estadística, no resultado seguro.');
    assert.ok(expl.textoCompleto.endsWith('Estimación estadística, no resultado seguro.'));
  });

  await t.test('debe estructurar resumen, porQue, mercados y riesgos', () => {
    assert.ok(expl.resumen.length > 20);
    assert.ok(expl.porQue.length >= 3);
    assert.ok(expl.mercados.length >= 2);
    assert.ok(expl.riesgos.length >= 2);
    assert.equal(expl.confianza, 'alta');
    assert.equal(expl.isAiGenerated, false);
  });
});

