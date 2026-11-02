/**
 * SERVICIO DE OBTENCIÓN Y CÁLCULO DE ESTADÍSTICAS REALES
 * 
 * Descarga el historial oficial de partidos jugados de cada equipo (fútbol o NBA)
 * y calcula de forma 100% matemática y transparente:
 * - Frecuencias reales en los últimos 5 y 10 partidos.
 * - Promedios reales de goles o puntos anotados y recibidos.
 * - Enfrentamientos directos previos reales (H2H).
 * - Probabilidades del modelo de Poisson y Ritmo de posesión basadas en los datos reales.
 */

import type { HistoricalFrequencies, EstimatedProbabilities, SportType } from '../../core/models.ts';
import { calculateFrequencies, calculateWeightedMomentum, type RawMatchRecord } from '../../core/stats/frequencies.ts';
import { calculateFootballProbabilities } from '../../core/stats/poisson.ts';
import { calculateBasketballProbabilities } from '../../core/stats/basketballModel.ts';
import { evaluateSampleSize } from '../../core/stats/sampleGuard.ts';
import { CacheManager } from '../cache/cacheManager.ts';
import { logError } from '../logger.ts';

export interface RealTeamGameSummary {
  opponent: string;
  opponentId?: string;
  score: string;
  teamScore: number;
  opponentScore: number;
  result: 'W' | 'D' | 'L';
  date: string;
  isHome: boolean;
}

export class RealStatsFetcher {
  /**
   * Obtiene el historial de partidos completados de un equipo de fútbol.
   */
  public static async getFootballTeamHistory(
    teamId: string,
    leagueCode: string = 'eng.1'
  ): Promise<RealTeamGameSummary[]> {
    const cacheKey = `real_football_team_${teamId}_history`;
    const cached = CacheManager.get<RealTeamGameSummary[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/teams/${teamId}/schedule`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) return [];

      const data = await res.json();
      const events = data.events || [];

      const completed = events.filter((e: any) => e.competitions?.[0]?.status?.type?.completed);

      const summaries: RealTeamGameSummary[] = completed.map((e: any) => {
        const comp = e.competitions[0];
        const thisTeamComp = comp.competitors.find((c: any) => String(c.id || c.team?.id) === String(teamId));
        const opponentComp = comp.competitors.find((c: any) => String(c.id || c.team?.id) !== String(teamId));

        const teamScore = parseInt(thisTeamComp?.score?.displayValue || thisTeamComp?.score?.value || thisTeamComp?.score || '0', 10);
        const oppScore = parseInt(opponentComp?.score?.displayValue || opponentComp?.score?.value || opponentComp?.score || '0', 10);

        let result: 'W' | 'D' | 'L' = 'D';
        if (teamScore > oppScore) result = 'W';
        else if (teamScore < oppScore) result = 'L';

        return {
          opponent: opponentComp?.team?.displayName || opponentComp?.team?.name || 'Rival',
          opponentId: String(opponentComp?.id || opponentComp?.team?.id || ''),
          score: `${teamScore} - ${oppScore}`,
          teamScore,
          opponentScore: oppScore,
          result,
          date: e.date ? e.date.substring(0, 10) : 'Reciente',
          isHome: thisTeamComp?.homeAway === 'home',
        };
      });

      // Ordenar por más recientes primero
      summaries.reverse();

      CacheManager.set(cacheKey, summaries, 3600); // 1 hora de caché
      return summaries;
    } catch (err) {
      logError(`RealStatsFetcher:getFootballTeamHistory(${teamId})`, err);
      return [];
    }
  }

  /**
   * Obtiene el historial de partidos completados de un equipo de la NBA.
   */
  public static async getNbaTeamHistory(teamId: string): Promise<RealTeamGameSummary[]> {
    const cacheKey = `real_nba_team_${teamId}_history`;
    const cached = CacheManager.get<RealTeamGameSummary[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/schedule`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) return [];

      const data = await res.json();
      const events = data.events || [];

      const completed = events.filter((e: any) => e.competitions?.[0]?.status?.type?.completed);

      const summaries: RealTeamGameSummary[] = completed.map((e: any) => {
        const comp = e.competitions[0];
        const thisTeamComp = comp.competitors.find((c: any) => String(c.id || c.team?.id) === String(teamId));
        const opponentComp = comp.competitors.find((c: any) => String(c.id || c.team?.id) !== String(teamId));

        const teamScore = parseInt(thisTeamComp?.score?.displayValue || thisTeamComp?.score?.value || thisTeamComp?.score || '0', 10);
        const oppScore = parseInt(opponentComp?.score?.displayValue || opponentComp?.score?.value || opponentComp?.score || '0', 10);

        return {
          opponent: opponentComp?.team?.displayName || opponentComp?.team?.name || 'Rival',
          opponentId: String(opponentComp?.id || opponentComp?.team?.id || ''),
          score: `${teamScore} - ${oppScore}`,
          teamScore,
          opponentScore: oppScore,
          result: teamScore > oppScore ? 'W' : 'L',
          date: e.date ? e.date.substring(0, 10) : 'Reciente',
          isHome: thisTeamComp?.homeAway === 'home',
        };
      });

      summaries.reverse();
      CacheManager.set(cacheKey, summaries, 3600);
      return summaries;
    } catch (err) {
      logError(`RealStatsFetcher:getNbaTeamHistory(${teamId})`, err);
      return [];
    }
  }

  /**
   * Calcula frecuencias y promedios reales a partir de los partidos reales de un equipo.
   */
  public static computeRealFrequencies(
    games: RealTeamGameSummary[],
    sport: SportType = 'football'
  ): {
    freq5: HistoricalFrequencies;
    freq10: HistoricalFrequencies;
    momentum: ReturnType<typeof calculateWeightedMomentum>;
  } {
    const rawRecords: RawMatchRecord[] = games.map((g) => ({
      teamGoalsOrPoints: g.teamScore,
      opponentGoalsOrPoints: g.opponentScore,
      isHome: g.isHome,
      date: g.date,
    }));

    const freq5 = calculateFrequencies(rawRecords, 5, sport);
    const freq10 = calculateFrequencies(rawRecords, 10, sport);
    const momentum = calculateWeightedMomentum(rawRecords);

    return { freq5, freq10, momentum };
  }

  /**
   * Encuentra los enfrentamientos directos previos (H2H) reales entre dos equipos.
   */
  public static extractHeadToHead(
    homeHistory: RealTeamGameSummary[],
    awayTeamId: string,
    leagueName: string
  ): Array<{
    date: string;
    competition: string;
    homeScore: number;
    awayScore: number;
    winner: 'home' | 'away' | 'draw';
  }> {
    const directMatches = homeHistory.filter(
      (g) => g.opponentId === awayTeamId || g.opponent.toLowerCase().includes(awayTeamId.toLowerCase())
    );

    return directMatches.slice(0, 5).map((m) => {
      const winner: 'home' | 'away' | 'draw' =
        m.teamScore > m.opponentScore ? 'home' : m.teamScore < m.opponentScore ? 'away' : 'draw';

      return {
        date: m.date,
        competition: leagueName,
        homeScore: m.isHome ? m.teamScore : m.opponentScore,
        awayScore: m.isHome ? m.opponentScore : m.teamScore,
        winner,
      };
    });
  }
}
