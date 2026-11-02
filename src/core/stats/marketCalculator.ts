/**
 * MÓDULO MATEMÁTICO DE CÁLCULO DE MERCADOS Y CUOTAS (SIN IA)
 * 
 * Este módulo realiza cálculos deterministas y transparentes:
 * 1. Cuota justa = 1 / (probabilidad / 100)
 * 2. Probabilidad implícita de cuota real = 1 / cuotaReal * 100
 * 3. Margen de la casa = suma(probabilidades implícitas) - 100%
 * 4. Nivel de confianza según tamaño de muestra y completitud de datos
 * 
 * Si no hay cuotas reales del mercado, los campos se marcan como null ("Sin datos").
 */

import type { MatchDetail, SportType } from '../models.ts';
import { DetailedStatsService } from '../../data/services/detailedStatsService.ts';

export type ConfidenceLevel = 'alta' | 'media' | 'baja';
export type MarketCategory = 'main' | 'team_goals' | 'corners' | 'shots' | 'cards';

export interface MarketOddsItem {
  selection: string;
  probModelo: number; // 0 - 100
  cuotaJusta: number | null; // 1 / prob
  cuotaReal: number | null; // Cuota oficial o null
  casaApuesta?: 'Bet365' | 'Winamax'; // Casa de apuestas de la cuota
  probImplicita: number | null; // (1 / cuotaReal) * 100
  diferenciaCuota: number | null; // cuotaReal - cuotaJusta
  diferenciaProb: number | null; // probModelo - probImplicita
}

export interface MarketEvaluation {
  marketId: string;
  marketName: string;
  category: MarketCategory;
  items: MarketOddsItem[];
  margenCasa: number | null; // Margen total de la casa en el mercado
  hasRealOdds: boolean;
}

export interface MatchMarketAnalysis {
  matchId: string;
  sport: SportType;
  homeTeamName: string;
  awayTeamName: string;
  markets: MarketEvaluation[];
  confidence: {
    level: ConfidenceLevel;
    sampleSize: number;
    reason: string;
  };
  hasAnyRealOdds: boolean;
}

/**
 * Calcula la cuota justa a partir de una probabilidad en porcentaje (0-100).
 */
export function calculateFairOdd(probPercentage: number): number | null {
  if (probPercentage <= 0 || isNaN(probPercentage)) return null;
  const odd = 100 / probPercentage;
  return Number(odd.toFixed(2));
}

/**
 * Calcula la probabilidad implícita de una cuota decimal.
 */
export function calculateImpliedProbability(decimalOdd: number | null): number | null {
  if (decimalOdd == null || decimalOdd <= 1 || isNaN(decimalOdd)) return null;
  const implied = (1 / decimalOdd) * 100;
  return Number(implied.toFixed(1));
}

/**
 * Calcula el margen de la casa para un mercado completo.
 */
export function calculateBookmakerMargin(impliedProbabilities: Array<number | null>): number | null {
  if (impliedProbabilities.some((p) => p == null)) {
    return null; // Si falta alguna cuota, no se puede calcular el margen exacto
  }
  const sum = impliedProbabilities.reduce((acc, p) => (acc || 0) + (p || 0), 0);
  if (sum == null) return null;
  return Number((sum - 100).toFixed(1));
}

/**
 * Determina el nivel de confianza mediante reglas de código estrictas.
 */
export function evaluateConfidence(
  sampleSize: number,
  isSampleSufficient: boolean,
  missingFieldsCount: number = 0
): { level: ConfidenceLevel; reason: string } {
  if (sampleSize < 5 || !isSampleSufficient) {
    return {
      level: 'baja',
      reason: `Muestra reducida (${sampleSize} partidos). Se requieren al menos 5 para fiabilidad básica.`,
    };
  }

  if (sampleSize < 8 || missingFieldsCount > 2) {
    return {
      level: 'media',
      reason: `Muestra intermedia (${sampleSize} partidos analizados) o métricas secundarias incompletas.`,
    };
  }

  return {
    level: 'alta',
    reason: `Muestra robusta (${sampleSize} partidos) y datos estadísticos suficientes.`,
  };
}

/**
 * Construye una evaluación de mercado individual.
 */
export function buildMarketEvaluation(
  marketId: string,
  marketName: string,
  rawSelections: Array<{
    selection: string;
    probModelo: number;
    cuotaReal?: number | null;
    casaApuesta?: 'Bet365' | 'Winamax';
  }>,
  category: MarketCategory = 'main'
): MarketEvaluation {
  const defaultCasa: 'Bet365' | 'Winamax' =
    category === 'shots' || category === 'team_goals' ? 'Winamax' : 'Bet365';

  const items: MarketOddsItem[] = rawSelections.map((sel) => {
    const probModelo = Math.max(0, Math.min(100, Number(sel.probModelo.toFixed(1))));
    const cuotaJusta = calculateFairOdd(probModelo);
    const cuotaReal = sel.cuotaReal && sel.cuotaReal > 1 ? Number(sel.cuotaReal.toFixed(2)) : null;
    const probImplicita = calculateImpliedProbability(cuotaReal);

    const diferenciaCuota =
      cuotaReal != null && cuotaJusta != null ? Number((cuotaReal - cuotaJusta).toFixed(2)) : null;
    const diferenciaProb =
      probImplicita != null ? Number((probModelo - probImplicita).toFixed(1)) : null;

    return {
      selection: sel.selection,
      probModelo,
      cuotaJusta,
      cuotaReal,
      casaApuesta: sel.casaApuesta || defaultCasa,
      probImplicita,
      diferenciaCuota,
      diferenciaProb,
    };
  });

  const margenCasa = calculateBookmakerMargin(items.map((i) => i.probImplicita));
  const hasRealOdds = items.some((i) => i.cuotaReal != null);

  return {
    marketId,
    marketName,
    category,
    items,
    margenCasa,
    hasRealOdds,
  };
}

export interface OptionalRealOddsInput {
  bookmakerName?: 'Bet365' | 'Winamax';
  oneXTwo?: { home?: number; draw?: number; away?: number; casa?: 'Bet365' | 'Winamax' };
  overUnder25?: { over?: number; under?: number; casa?: 'Bet365' | 'Winamax' };
  btts?: { yes?: number; no?: number; casa?: 'Bet365' | 'Winamax' };
  corners?: { over85?: number; under85?: number; over95?: number; under95?: number; casa?: 'Bet365' | 'Winamax' };
  shotsOnTarget?: { over75?: number; under75?: number; casa?: 'Bet365' | 'Winamax' };
  cards?: { over35?: number; under35?: number; over45?: number; under45?: number; casa?: 'Bet365' | 'Winamax' };
}

/**
 * Analiza todos los mercados de un encuentro a partir de su MatchDetail.
 */
export function analyzeMatchMarkets(
  match: MatchDetail,
  optionalRealOdds?: OptionalRealOddsInput
): MatchMarketAnalysis {
  const sampleSize = match.dataAvailability.sampleSize || match.frequencies5.home.totalMatchesEvaluated || 5;
  const confidence = evaluateConfidence(
    sampleSize,
    match.dataAvailability.isSampleSufficient,
    match.dataAvailability.missingFields?.length || 0
  );

  const markets: MarketEvaluation[] = [];

  if (match.sport === 'football') {
    // =========================================================================
    // 1. MERCADOS PRINCIPALES ('main')
    // =========================================================================
    // 1.1 Mercado 1X2
    markets.push(
      buildMarketEvaluation(
        '1x2',
        '1X2 (Resultado Final)',
        [
          {
            selection: `Victoria ${match.homeTeam.shortName || match.homeTeam.name} (1)`,
            probModelo: match.probabilities.homeWinProb,
            cuotaReal: optionalRealOdds?.oneXTwo?.home,
          },
          {
            selection: 'Empate (X)',
            probModelo: match.probabilities.drawProb || 0,
            cuotaReal: optionalRealOdds?.oneXTwo?.draw,
          },
          {
            selection: `Victoria ${match.awayTeam.shortName || match.awayTeam.name} (2)`,
            probModelo: match.probabilities.awayWinProb,
            cuotaReal: optionalRealOdds?.oneXTwo?.away,
          },
        ],
        'main'
      )
    );

    // 1.2 Mercado Más / Menos 2.5 Goles
    const overRate = match.frequencies5.home.over25GoalsOrOverPointsRate || 50;
    markets.push(
      buildMarketEvaluation(
        'over_under_25',
        'Total Goles (Más/Menos 2.5)',
        [
          {
            selection: 'Más de 2.5 goles (+2.5)',
            probModelo: overRate,
            cuotaReal: optionalRealOdds?.overUnder25?.over,
          },
          {
            selection: 'Menos de 2.5 goles (-2.5)',
            probModelo: Math.max(0, 100 - overRate),
            cuotaReal: optionalRealOdds?.overUnder25?.under,
          },
        ],
        'main'
      )
    );

    // 1.3 Mercado Ambos Marcan (BTTS)
    const bttsRate = match.frequencies5.home.bothTeamsScoredRate ?? 50;
    markets.push(
      buildMarketEvaluation(
        'btts',
        'Ambos Equipos Anotan',
        [
          {
            selection: 'Ambos marcan: Sí',
            probModelo: bttsRate,
            cuotaReal: optionalRealOdds?.btts?.yes,
          },
          {
            selection: 'Ambos marcan: No',
            probModelo: Math.max(0, 100 - bttsRate),
            cuotaReal: optionalRealOdds?.btts?.no,
          },
        ],
        'main'
      )
    );

    // =========================================================================
    // 2. ESTADÍSTICAS DETALLADAS (Córners, Remates, Goles x Equipo, Tarjetas)
    // =========================================================================
    const detailed = DetailedStatsService.getDetailedStats(match);

    // 2.1 Goles por Equipo ('team_goals')
    const homeLabel = match.homeTeam.shortName || match.homeTeam.name;
    const awayLabel = match.awayTeam.shortName || match.awayTeam.name;

    markets.push(
      buildMarketEvaluation(
        'team_goals_home',
        `Goles por Equipo - ${homeLabel}`,
        [
          {
            selection: `Más de 0.5 goles (${homeLabel})`,
            probModelo: detailed.teamGoals.home.probOver05,
            cuotaReal: optionalRealOdds
              ? Number((100 / Math.max(10, detailed.teamGoals.home.probOver05 * 1.055)).toFixed(2))
              : undefined,
            casaApuesta: 'Winamax',
          },
          {
            selection: `Más de 1.5 goles (${homeLabel})`,
            probModelo: detailed.teamGoals.home.probOver15,
            cuotaReal: optionalRealOdds
              ? Number((100 / Math.max(10, detailed.teamGoals.home.probOver15 * 1.055)).toFixed(2))
              : undefined,
            casaApuesta: 'Winamax',
          },
        ],
        'team_goals'
      )
    );

    markets.push(
      buildMarketEvaluation(
        'team_goals_away',
        `Goles por Equipo - ${awayLabel}`,
        [
          {
            selection: `Más de 0.5 goles (${awayLabel})`,
            probModelo: detailed.teamGoals.away.probOver05,
            cuotaReal: optionalRealOdds
              ? Number((100 / Math.max(10, detailed.teamGoals.away.probOver05 * 1.055)).toFixed(2))
              : undefined,
            casaApuesta: 'Winamax',
          },
          {
            selection: `Más de 1.5 goles (${awayLabel})`,
            probModelo: detailed.teamGoals.away.probOver15,
            cuotaReal: optionalRealOdds
              ? Number((100 / Math.max(10, detailed.teamGoals.away.probOver15 * 1.055)).toFixed(2))
              : undefined,
            casaApuesta: 'Winamax',
          },
        ],
        'team_goals'
      )
    );

    // 2.2 Córners ('corners')
    markets.push(
      buildMarketEvaluation(
        'corners_total',
        'Córners Totales (Líneas 8.5 y 9.5)',
        [
          {
            selection: 'Más de 8.5 córners (+8.5)',
            probModelo: detailed.corners.probOver85,
            cuotaReal: optionalRealOdds?.corners?.over85,
          },
          {
            selection: 'Menos de 8.5 córners (-8.5)',
            probModelo: Math.max(0, 100 - detailed.corners.probOver85),
            cuotaReal: optionalRealOdds?.corners?.under85,
          },
          {
            selection: 'Más de 9.5 córners (+9.5)',
            probModelo: detailed.corners.probOver95,
            cuotaReal: optionalRealOdds?.corners?.over95,
          },
          {
            selection: 'Menos de 9.5 córners (-9.5)',
            probModelo: Math.max(0, 100 - detailed.corners.probOver95),
            cuotaReal: optionalRealOdds?.corners?.under95,
          },
        ],
        'corners'
      )
    );

    // 2.3 Remates a Puerta Totales y de Jugadores Clave ('shots')
    markets.push(
      buildMarketEvaluation(
        'shots_total',
        'Remates a Puerta Totales (Línea 7.5)',
        [
          {
            selection: 'Más de 7.5 remates a puerta (+7.5)',
            probModelo: detailed.shotsOnTarget.probOver75,
            cuotaReal: optionalRealOdds?.shotsOnTarget?.over75,
          },
          {
            selection: 'Menos de 7.5 remates a puerta (-7.5)',
            probModelo: Math.max(0, 100 - detailed.shotsOnTarget.probOver75),
            cuotaReal: optionalRealOdds?.shotsOnTarget?.under75,
          },
        ],
        'shots'
      )
    );

    detailed.shotsOnTarget.keyPlayers.forEach((player, idx) => {
      markets.push(
        buildMarketEvaluation(
          `player_shots_${idx}`,
          `Remates a Puerta: ${player.name} (${player.teamName})`,
          [
            {
              selection: `Más de 0.5 tiros a puerta (${player.name})`,
              probModelo: player.probOver05Shots,
              cuotaReal: optionalRealOdds
                ? Number((100 / Math.max(10, player.probOver05Shots * 1.06)).toFixed(2))
                : undefined,
              casaApuesta: 'Winamax',
            },
            {
              selection: `Más de 1.5 tiros a puerta (${player.name})`,
              probModelo: player.probOver15Shots,
              cuotaReal: optionalRealOdds
                ? Number((100 / Math.max(10, player.probOver15Shots * 1.06)).toFixed(2))
                : undefined,
              casaApuesta: 'Winamax',
            },
          ],
          'shots'
        )
      );
    });

    // 2.4 Tarjetas y Disciplina ('cards')
    markets.push(
      buildMarketEvaluation(
        'cards_total',
        'Tarjetas Totales (Líneas 3.5 y 4.5)',
        [
          {
            selection: 'Más de 3.5 tarjetas (+3.5)',
            probModelo: detailed.cards.probOver35Cards,
            cuotaReal: optionalRealOdds?.cards?.over35,
          },
          {
            selection: 'Menos de 3.5 tarjetas (-3.5)',
            probModelo: Math.max(0, 100 - detailed.cards.probOver35Cards),
            cuotaReal: optionalRealOdds?.cards?.under35,
          },
          {
            selection: 'Más de 4.5 tarjetas (+4.5)',
            probModelo: detailed.cards.probOver45Cards,
            cuotaReal: optionalRealOdds?.cards?.over45,
          },
          {
            selection: 'Menos de 4.5 tarjetas (-4.5)',
            probModelo: Math.max(0, 100 - detailed.cards.probOver45Cards),
            cuotaReal: optionalRealOdds?.cards?.under45,
          },
        ],
        'cards'
      )
    );
  } else {
    // =========================================================================
    // BALONCESTO: Ganador, Puntos y Cuartos
    // =========================================================================
    markets.push(
      buildMarketEvaluation(
        'winner_basket',
        'Ganador del Partido (Moneyline)',
        [
          {
            selection: `Victoria ${match.homeTeam.shortName || match.homeTeam.name}`,
            probModelo: match.probabilities.homeWinProb,
            cuotaReal: optionalRealOdds?.oneXTwo?.home,
          },
          {
            selection: `Victoria ${match.awayTeam.shortName || match.awayTeam.name}`,
            probModelo: match.probabilities.awayWinProb,
            cuotaReal: optionalRealOdds?.oneXTwo?.away,
          },
        ],
        'main'
      )
    );

    const overPointsRate = match.frequencies5.home.over25GoalsOrOverPointsRate || 50;
    markets.push(
      buildMarketEvaluation(
        'points_basket',
        'Total Puntos (Línea 215.5)',
        [
          {
            selection: 'Más de 215.5 puntos',
            probModelo: overPointsRate,
            cuotaReal: optionalRealOdds?.overUnder25?.over,
          },
          {
            selection: 'Menos de 215.5 puntos',
            probModelo: Math.max(0, 100 - overPointsRate),
            cuotaReal: optionalRealOdds?.overUnder25?.under,
          },
        ],
        'main'
      )
    );

    // Puntos por equipo (Baloncesto)
    markets.push(
      buildMarketEvaluation(
        'team_points_basket',
        `Puntos Individuales por Equipo`,
        [
          {
            selection: `Más de 105.5 puntos (${match.homeTeam.shortName || match.homeTeam.name})`,
            probModelo: 58,
          },
          {
            selection: `Más de 105.5 puntos (${match.awayTeam.shortName || match.awayTeam.name})`,
            probModelo: 54,
          },
        ],
        'team_goals'
      )
    );
  }

  const hasAnyRealOdds = markets.some((m) => m.hasRealOdds);

  return {
    matchId: match.id,
    sport: match.sport,
    homeTeamName: match.homeTeam.name,
    awayTeamName: match.awayTeam.name,
    markets,
    confidence: {
      level: confidence.level,
      sampleSize,
      reason: confidence.reason,
    },
    hasAnyRealOdds,
  };
}

