import type { MatchDetail } from '../models.ts';

/**
 * Determina si un partido ya ha comenzado (o finalizado) y por tanto ya no se puede apostar en él.
 * 
 * Reglas de descarte:
 * 1. Si el estado del partido es 'live' (en vivo) o 'finished' (finalizado).
 * 2. Si tiene kickoffTimestamp y es menor o igual a la hora actual (nowEpochMs).
 * 3. Fallback: Parsear match.date (YYYY-MM-DD) y match.time (HH:mm). Si la hora programada ya pasó, se considera comenzado.
 */
export function hasMatchStarted(match: MatchDetail, nowEpochMs: number = Date.now()): boolean {
  // 1. Estados directos de partido ya iniciado o concluido
  if (match.status === 'live' || match.status === 'finished') {
    return true;
  }

  // 2. Comprobación por timestamp exacto (ms)
  if (typeof match.kickoffTimestamp === 'number' && match.kickoffTimestamp > 0) {
    return match.kickoffTimestamp <= nowEpochMs;
  }

  // 3. Fallback: interpretar date y time
  try {
    const timeMatch = match.time.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch && match.date) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const parts = match.date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);

        const matchDate = new Date(year, month, day, hours, minutes, 0, 0);
        return matchDate.getTime() <= nowEpochMs;
      }
    }
  } catch {
    // Si falla el parseo, se confía en match.status
  }

  return false;
}

/**
 * Filtra la lista de partidos dejando únicamente aquellos disponibles para apostar (pre-partido).
 * Elimina automáticamente cualquier encuentro cuya hora de inicio ya haya llegado o pasado.
 */
export function filterBettableMatches(matches: MatchDetail[], nowEpochMs: number = Date.now()): MatchDetail[] {
  return matches.filter((m) => !hasMatchStarted(m, nowEpochMs));
}
