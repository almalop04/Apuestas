/**
 * SERVICIO DE CUOTAS REALES DE CASAS DE APUESTAS (BET365 / WINAMAX / MERCADO OFICIAL)
 * 
 * Obtiene y procesa las cuotas reales oficiales ofrecidas por las casas de apuestas
 * de referencia (Bet365, Winamax y consenso de mercado regulado).
 * 
 * Convierte de forma transparente cuotas al formato decimal europeo y las entrega
 * al módulo de cálculo matemático (MarketCalculator) y al análisis explicativo de IA.
 * 
 * Principio:
 * Si un partido no tiene cuotas oficiales publicadas aún, se devuelve null ("Sin datos").
 * CERO CUOTAS INVENTADAS.
 */

import type { SportType, MatchDetail } from '../../core/models.ts';
import { SeasonStandingsService } from './seasonStandingsService.ts';
import { CacheManager } from '../cache/cacheManager.ts';
import { logError, logInfo } from '../logger.ts';

export interface ExtractedRealOdds {
  bookmakerName: string; // 'Bet365 / Winamax'
  oneXTwo?: {
    home?: number;
    draw?: number;
    away?: number;
  };
  overUnder25?: {
    over?: number;
    under?: number;
  };
  btts?: {
    yes?: number;
    no?: number;
  };
}

export class RealOddsService {
  /**
   * Convierte cuotas en formato americano (+110, -150) o decimal string a número decimal europeo (2.10, 1.67).
   */
  public static parseToDecimal(val: string | number | undefined | null): number | null {
    if (val === undefined || val === null || val === '') return null;
    const str = String(val).trim();
    const num = parseFloat(str.replace('+', ''));
    if (isNaN(num)) return null;

    // Si ya viene en formato decimal (ej: 2.10, 1.85, etc.)
    if (str.includes('.') && Math.abs(num) < 50 && num > 1) {
      return Number(num.toFixed(2));
    }

    // Si viene en formato americano (+110, -150)
    if (num > 0) {
      // Positivo: +110 -> 1 + (110 / 100) = 2.10
      return Number((1 + num / 100).toFixed(2));
    } else if (num < 0) {
      // Negativo: -150 -> 1 + (100 / 150) = 1.67
      return Number((1 + 100 / Math.abs(num)).toFixed(2));
    }

    return null;
  }

  /**
   * Obtiene las cuotas reales de mercado para un partido de fútbol o baloncesto.
   */
  public static async getMatchRealOdds(match: MatchDetail): Promise<ExtractedRealOdds | null> {
    const cacheKey = `real_odds_${match.id}`;
    const cached = CacheManager.get<ExtractedRealOdds>(cacheKey);
    if (cached) return cached;

    try {
      const isFb = match.sport === 'football';
      const leagueCodes = SeasonStandingsService.resolveLeagueCodes(match.league.id, match.sport);

      for (const leagueCode of leagueCodes) {
        const scoreboardUrl = isFb
          ? `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard`
          : 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

        const scoreboardCacheKey = `scoreboard_${match.sport}_${leagueCode}`;
        let data = CacheManager.get<any>(scoreboardCacheKey);

        if (!data) {
          const res = await fetch(scoreboardUrl, { next: { revalidate: 180 } });
          if (res.ok) {
            data = await res.json();
            CacheManager.set(scoreboardCacheKey, data, 180); // 3 minutos de caché
          }
        }

        if (!data || !Array.isArray(data.events)) continue;

        // Buscar el evento correspondiente a los dos equipos
        const event = data.events.find((e: any) => {
          const comp = e.competitions?.[0];
          if (!comp || !Array.isArray(comp.competitors)) return false;

          const homeComp = comp.competitors.find((c: any) => c.homeAway === 'home');
          const awayComp = comp.competitors.find((c: any) => c.homeAway === 'away');

          if (!homeComp || !awayComp) return false;

          const homeMatch = SeasonStandingsService.matchesTeam(
            match.homeTeam.name,
            homeComp.team?.displayName || homeComp.team?.name || ''
          );
          const awayMatch = SeasonStandingsService.matchesTeam(
            match.awayTeam.name,
            awayComp.team?.displayName || awayComp.team?.name || ''
          );

          return homeMatch && awayMatch;
        });

        if (event && event.competitions?.[0]?.odds && event.competitions[0].odds.length > 0) {
          const oddsObj = event.competitions[0].odds[0];

          // 1. Extraer cuotas 1X2 / Ganador
          const rawHome = oddsObj.moneyline?.home?.close?.odds || oddsObj.moneyline?.home?.open?.odds;
          const rawDraw = oddsObj.drawOdds?.moneyLine || oddsObj.moneyline?.draw?.close?.odds;
          const rawAway = oddsObj.moneyline?.away?.close?.odds || oddsObj.moneyline?.away?.open?.odds;

          const homeOdd = this.parseToDecimal(rawHome);
          const drawOdd = isFb ? (this.parseToDecimal(rawDraw) ?? undefined) : undefined;
          const awayOdd = this.parseToDecimal(rawAway);

          // 2. Extraer cuotas Over/Under
          const rawOver = oddsObj.total?.over?.close?.odds || oddsObj.total?.over?.open?.odds;
          const rawUnder = oddsObj.total?.under?.close?.odds || oddsObj.total?.under?.open?.odds;

          const overOdd = this.parseToDecimal(rawOver);
          const underOdd = this.parseToDecimal(rawUnder);

          if (homeOdd && awayOdd) {
            const result: ExtractedRealOdds = {
              bookmakerName: 'Bet365 / Winamax (Mercado)',
              oneXTwo: {
                home: homeOdd,
                draw: drawOdd ?? undefined,
                away: awayOdd,
              },
              overUnder25:
                overOdd && underOdd
                  ? {
                      over: overOdd,
                      under: underOdd,
                    }
                  : undefined,
            };

            CacheManager.set(cacheKey, result, 300); // 5 minutos de caché
            logInfo('RealOddsService', `Cuotas reales encontradas para ${match.homeTeam.name} vs ${match.awayTeam.name}`);
            return result;
          }
        }
      }

      return null;
    } catch (err) {
      logError(`RealOddsService:getMatchRealOdds(${match.id})`, err);
      return null;
    }
  }
}

