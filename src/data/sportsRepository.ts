/**
 * REPOSITORIO CENTRAL DE DATOS DEPORTIVOS
 * 
 * Principio de arquitectura:
 * Esta es la ÚNICA puerta de acceso a los datos para toda la aplicación.
 * Ninguna pantalla llama a APIs externas ni accede a la caché directamente.
 * 
 * Flujo:
 * 1. ¿Está en la caché y no ha caducado? -> Devolver al instante (0 peticiones gastadas).
 * 2. Si no está en caché -> Comprobar si se ha alcanzado la cuota diaria.
 * 3. Si hay cuota -> Pedir al proveedor configurado (Mock o Real).
 * 4. Guardar en caché con su TTL correspondiente.
 */

import type { MatchDetail, SportType, ApiQuotaStatus } from '../core/models.ts';
import { isGLeagueMatch } from '../core/utils/matchFilter.ts';
import { CacheManager } from './cache/cacheManager.ts';
import { QuotaTracker } from './cache/quotaTracker.ts';
import { MockSportsProvider } from './providers/mockProvider.ts';
import { FootballApiProvider } from './providers/footballApiProvider.ts';
import { LivePublicSportsProvider } from './providers/livePublicProvider.ts';
import { FlashscoreSportsProvider } from './providers/flashscoreProvider.ts';
import { SeasonStandingsService } from './services/seasonStandingsService.ts';
import { logError, logInfo } from './logger.ts';

export class SportsRepository {
  private static mockProvider = new MockSportsProvider();
  private static footballApiProvider = new FootballApiProvider();
  private static livePublicProvider = new LivePublicSportsProvider();
  private static flashscoreProvider = new FlashscoreSportsProvider();

  /**
   * Obtiene los partidos de hoy (o por desplazamiento de días) para un deporte dado, con caché automática.
   */
  public static async getTodayMatches(
    sport: SportType,
    requestedMode?: 'live' | 'mock',
    dayOffset: number = 0
  ): Promise<{
    matches: MatchDetail[];
    fromCache: boolean;
    quota: ApiQuotaStatus;
  }> {
    const mode = requestedMode || process.env.DATA_MODE || 'live';

    // Calcular la fecha objetivo en hora de España para aislar la clave de caché por día
    const target = new Date();
    target.setDate(target.getDate() + dayOffset);
    const madridDateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const targetDateStr = madridDateFormatter.format(target);

    const cacheKey = `today_matches_${sport}_${mode}_${targetDateStr}_d${dayOffset}`;
    const cached = CacheManager.get<MatchDetail[]>(cacheKey);

    if (cached) {
      return {
        matches: cached,
        fromCache: true,
        quota: QuotaTracker.getStatus(),
      };
    }

    try {
      let matches: MatchDetail[] = [];

      if (mode === 'live') {
        // 1. Prioridad: Feed Oficial en Tiempo Real de Flashscore.es
        try {
          matches = await this.flashscoreProvider.getTodayMatches(sport, dayOffset);
        } catch (err) {
          logError('SportsRepository:flashscoreProvider', err);
        }

        // 2. Si hay clave oficial de API-Football configurada en .env.local
        if (matches.length === 0 && sport === 'football' && process.env.FOOTBALL_API_KEY) {
          try {
            QuotaTracker.recordApiCall();
            matches = await this.footballApiProvider.getTodayMatches(sport, dayOffset);
          } catch (err) {
            logError('SportsRepository:apiFootball', err);
          }
        }

        // 3. Fallback a feed abierto si Flashscore no devuelve partidos
        if (matches.length === 0) {
          matches = await this.livePublicProvider.getTodayMatches(sport, dayOffset);
        }

        // 4. Si no hay partidos programados para hoy en ningún feed, usar simulador
        if (matches.length === 0) {
          matches = await this.mockProvider.getTodayMatches(sport, dayOffset);
        }
      } else {
        // Modo simulador explícito
        matches = await this.mockProvider.getTodayMatches(sport, dayOffset);
      }

      // Enriquecer partidos con datos oficiales verídicos de la temporada actual (excluyendo expresamente G League)
      if (matches.length > 0) {
        matches = matches.filter((m) => !isGLeagueMatch(m));
        matches = await Promise.all(
          matches.map((m) => SeasonStandingsService.enrichMatchWithSeasonStats(m))
        );
      }

      // Guardar en caché (120 segundos para partidos del día)
      const ttl = Number(process.env.CACHE_TTL_LIVE_MATCHES) || 120;
      CacheManager.set(cacheKey, matches, ttl);

      return {
        matches,
        fromCache: false,
        quota: QuotaTracker.getStatus(),
      };
    } catch (err) {
      logError(`SportsRepository:getTodayMatches(${sport})`, err);
      // En caso de fallo o bloqueo de cuota, recuperar mock de emergencia
      const fallback = await this.mockProvider.getTodayMatches(sport, dayOffset);
      return {
        matches: fallback,
        fromCache: false,
        quota: QuotaTracker.getStatus(),
      };
    }
  }

  /**
   * Obtiene la ficha de un partido individual por su ID.
   */
  public static async getMatchById(matchId: string): Promise<{
    match: MatchDetail | null;
    fromCache: boolean;
  }> {
    const cacheKey = `match_detail_${matchId}`;
    const cached = CacheManager.get<MatchDetail>(cacheKey);

    if (cached) {
      return { match: cached, fromCache: true };
    }

    try {
      // 1. Buscar en Flashscore.es
      let match = await this.flashscoreProvider.getMatchDetail(matchId);
      // 2. Buscar en feed público abierto
      if (!match) {
        match = await this.livePublicProvider.getMatchDetail(matchId);
      }
      // 3. Buscar en simulador
      if (!match) {
        match = await this.mockProvider.getMatchDetail(matchId);
      }

      if (match) {
        // Enriquecer con datos 100% verídicos de la temporada actual
        match = await SeasonStandingsService.enrichMatchWithSeasonStats(match);
        CacheManager.set(cacheKey, match, 300);
      }
      return { match, fromCache: false };
    } catch (err) {
      logError(`SportsRepository:getMatchById(${matchId})`, err);
      return { match: null, fromCache: false };
    }
  }

  /**
   * Obtiene la ficha de un equipo.
   */
  public static async getTeamById(teamId: string) {
    const cacheKey = `team_detail_${teamId}`;
    const cached = CacheManager.get<any>(cacheKey);
    if (cached) return { teamData: cached, fromCache: true };

    try {
      let teamData: any = await this.flashscoreProvider.getTeamDetail(teamId);
      if (!teamData) {
        teamData = await this.livePublicProvider.getTeamDetail(teamId);
      }
      if (!teamData) {
        teamData = await this.mockProvider.getTeamDetail(teamId);
      }

      if (teamData) {
        CacheManager.set(cacheKey, teamData, 1800);
      }
      return { teamData, fromCache: false };
    } catch (err) {
      logError(`SportsRepository:getTeamById(${teamId})`, err);
      return { teamData: null, fromCache: false };
    }
  }

  /**
   * Obtiene el estado actual del monitor de cuota.
   */
  public static getQuotaStatus(): ApiQuotaStatus {
    return QuotaTracker.getStatus();
  }
}
