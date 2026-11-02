/**
 * INTERFAZ BASE PARA PROVEEDORES DE DATOS DEPORTIVOS
 * 
 * Principio de arquitectura:
 * Cualquier proveedor nuevo (API-Football, TheRundown, SportsDataIO, etc.)
 * solo tiene que implementar esta interfaz. La interfaz de usuario nunca cambiará.
 */

import type { MatchDetail, SportType, Team } from '../../core/models.ts';

export interface SportsDataProvider {
  readonly providerName: string;

  /**
   * Obtiene la lista de partidos programados o en curso para la jornada de hoy (o por desplazamiento de días).
   */
  getTodayMatches(sport: SportType, dayOffset?: number): Promise<MatchDetail[]>;

  /**
   * Obtiene la ficha detallada de un encuentro específico con métricas avanzadas y H2H.
   */
  getMatchDetail(matchId: string): Promise<MatchDetail | null>;

  /**
   * Obtiene la información histórica y plantilla de un equipo específico.
   */
  getTeamDetail(teamId: string): Promise<{
    team: Team;
    recentMatches: Array<{
      opponent: string;
      score: string;
      result: 'W' | 'D' | 'L';
      date: string;
    }>;
    seasonStats: Record<string, number | string>;
  } | null>;
}
