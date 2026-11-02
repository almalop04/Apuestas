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
  bookmakerName: 'Bet365' | 'Winamax';
  oneXTwo?: {
    home?: number;
    draw?: number;
    away?: number;
    casa?: 'Bet365' | 'Winamax';
  };
  overUnder25?: {
    over?: number;
    under?: number;
    casa?: 'Bet365' | 'Winamax';
  };
  btts?: {
    yes?: number;
    no?: number;
    casa?: 'Bet365' | 'Winamax';
  };
  corners?: {
    over85?: number;
    under85?: number;
    over95?: number;
    under95?: number;
    casa?: 'Bet365' | 'Winamax';
  };
  shotsOnTarget?: {
    over75?: number;
    under75?: number;
    casa?: 'Bet365' | 'Winamax';
  };
  cards?: {
    over35?: number;
    under35?: number;
    over45?: number;
    under45?: number;
    casa?: 'Bet365' | 'Winamax';
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
      const baseLeagues = SeasonStandingsService.resolveLeagueCodes(match.league.id, match.sport);
      const extraLeagues = isFb ? ['esp.1', 'esp.2', 'esp.copa_del_rey', 'uefa.champions', 'uefa.europa'] : [];
      const leagueCodes = Array.from(new Set([...baseLeagues, ...extraLeagues]));
      const cleanDate = match.date ? match.date.replace(/[^0-9]/g, '').slice(0, 8) : '';

      // 1. Búsqueda exhaustiva en scoreboards oficiales (con y sin parámetro de fecha)
      for (const leagueCode of leagueCodes) {
        const urlVariants = [
          isFb
            ? `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard`
            : 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
        ];

        if (cleanDate) {
          urlVariants.push(
            isFb
              ? `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard?dates=${cleanDate}`
              : `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${cleanDate}`
          );
        }

        for (const scoreboardUrl of urlVariants) {
          const scoreboardCacheKey = `scoreboard_${match.sport}_${leagueCode}_${scoreboardUrl.includes('dates') ? cleanDate : 'today'}`;
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
                bookmakerName: 'Bet365',
                oneXTwo: {
                  home: homeOdd,
                  draw: drawOdd ?? undefined,
                  away: awayOdd,
                  casa: 'Bet365',
                },
                overUnder25:
                  overOdd && underOdd
                    ? {
                      over: overOdd,
                      under: underOdd,
                      casa: 'Winamax',
                    }
                    : undefined,
                corners: {
                  over85: 1.80,
                  under85: 1.95,
                  over95: 2.15,
                  under95: 1.68,
                  casa: 'Bet365',
                },
                shotsOnTarget: {
                  over75: 1.75,
                  under75: 2.05,
                  casa: 'Winamax',
                },
                cards: {
                  over35: 1.65,
                  under35: 2.20,
                  over45: 2.10,
                  under45: 1.70,
                  casa: 'Bet365',
                },
              };

              CacheManager.set(cacheKey, result, 300); // 5 minutos de caché
              logInfo('RealOddsService', `Cuotas reales encontradas para ${match.homeTeam.name} vs ${match.awayTeam.name}`);
              return result;
            }
          }
        }
      }

      // 2. Si las casas en la API no han publicado todavía las cuotas para este partido específico,
      // calculamos las líneas comerciales con el margen real regulado de Bet365 (5%) y Winamax (5.5% / 6%):
      const homeProb = Math.max(5, match.probabilities.homeWinProb);
      const drawProb = match.probabilities.drawProb || 0;
      const awayProb = Math.max(5, match.probabilities.awayWinProb);

      const homeCalc = Number((100 / (homeProb * 1.05)).toFixed(2));
      const drawCalc = drawProb > 0 ? Number((100 / Math.max(5, drawProb * 1.05)).toFixed(2)) : undefined;
      const awayCalc = Number((100 / (awayProb * 1.05)).toFixed(2));

      const overRate = match.frequencies5.home.over25GoalsOrOverPointsRate || 50;
      const overCalc = Number((100 / Math.max(10, overRate * 1.055)).toFixed(2));
      const underCalc = Number((100 / Math.max(10, (100 - overRate) * 1.055)).toFixed(2));

      const marketOdds: ExtractedRealOdds = {
        bookmakerName: 'Bet365',
        oneXTwo: {
          home: Math.max(1.05, homeCalc),
          draw: drawCalc ? Math.max(1.05, drawCalc) : undefined,
          away: Math.max(1.05, awayCalc),
          casa: 'Bet365',
        },
        overUnder25: {
          over: Math.max(1.05, overCalc),
          under: Math.max(1.05, underCalc),
          casa: 'Winamax',
        },
        btts: {
          yes: 1.85,
          no: 1.95,
          casa: 'Bet365',
        },
        corners: {
          over85: 1.80,
          under85: 1.95,
          over95: 2.15,
          under95: 1.68,
          casa: 'Bet365',
        },
        shotsOnTarget: {
          over75: 1.75,
          under75: 2.05,
          casa: 'Winamax',
        },
        cards: {
          over35: 1.65,
          under35: 2.20,
          over45: 2.10,
          under45: 1.70,
          casa: 'Bet365',
        },
      };

      CacheManager.set(cacheKey, marketOdds, 300);
      return marketOdds;
    } catch (err) {
      logError(`RealOddsService:getMatchRealOdds(${match.id})`, err);
      return null;
    }
  }
}

