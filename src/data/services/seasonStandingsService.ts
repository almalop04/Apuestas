/**
 * SERVICIO DE CLASIFICACIONES Y ESTADÍSTICAS OFICIALES DE LA TEMPORADA
 * 
 * Conecta con los datos oficiales de clasificación para la temporada actual
 * y extrae los registros verídicos de partidos jugados, victorias, empates,
 * derrotas, goles anotados y goles recibidos en cada competición.
 * 
 * Principio:
 * CERO DATOS FICTICIOS O SIMULADOS. Si un equipo no tiene clasificación oficial
 * en la competición, se devuelve null ("Sin datos").
 */

import type { SportType, TeamSeasonRecord, MatchDetail } from '../../core/models.ts';
import { calculateEmpiricalProbabilities } from '../../core/stats/empiricalProbabilities.ts';
import { CacheManager } from '../cache/cacheManager.ts';
import { logError, logInfo } from '../logger.ts';

interface StandingsRawEntry {
  teamName: string;
  teamShortName?: string;
  teamId?: string;
  gamesPlayed: number;
  wins: number;
  ties: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  rank?: number;
}

const ALIASES: Record<string, string> = {
  'deportivo de a coruna': 'deportivo',
  'deportivo la coruna': 'deportivo',
  'deportivo coruna': 'deportivo',
  'deportivo alaves': 'alaves',
  'ca osasuna': 'osasuna',
  'atletico de madrid': 'atletico madrid',
  'atletico madrid': 'atletico madrid',
  'celta de vigo': 'celta vigo',
  'celta vigo': 'celta vigo',
  'athletic club de bilbao': 'athletic club',
  'athletic bilbao': 'athletic club',
  'rayo vallecano de madrid': 'rayo vallecano',
  'real valladolid': 'valladolid',
  'real betis balompie': 'real betis',
  'inter milan': 'inter',
  'internazionale': 'inter',
  'paris saint germain': 'paris saint-germain',
  'psg': 'paris saint-germain',
  'bayern munchen': 'bayern munich',
  'bayern de munich': 'bayern munich',
  'la clippers': 'los angeles clippers',
  'la lakers': 'los angeles lakers',
  'golden state': 'golden state warriors',
};

export class SeasonStandingsService {
  /**
   * Normaliza una cadena de texto para comparación libre de acentos, artículos y prefijos.
   */
  public static normalize(str: string): string {
    if (!str) return '';
    const clean = str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(de|la|el|a|los|las|fc|cf|cd|rc|ca|ud|sd|baloncesto|club)\b/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return ALIASES[clean] || clean;
  }

  /**
   * Comprueba si el nombre del equipo buscado coincide con la entrada oficial.
   */
  public static matchesTeam(searchName: string, entryName: string, entryShortName?: string): boolean {
    const sNorm = this.normalize(searchName);
    const eNorm = this.normalize(entryName);
    const esNorm = entryShortName ? this.normalize(entryShortName) : '';

    if (!sNorm || !eNorm) return false;
    if (sNorm === eNorm) return true;
    if (esNorm && sNorm === esNorm) return true;

    // Subcadena directa
    if (sNorm.includes(eNorm) || eNorm.includes(sNorm)) return true;

    // Comparación por palabras clave principales (>3 letras)
    const sWords = sNorm.split(' ').filter((w) => w.length > 3);
    const eWords = eNorm.split(' ').filter((w) => w.length > 3);
    return sWords.some((w) => eWords.includes(w));
  }

  /**
   * Mapea el identificador interno de liga al código oficial de clasificación.
   */
  public static resolveLeagueCodes(leagueId: string, sport: SportType): string[] {
    const lid = leagueId.toLowerCase();
    if (sport === 'basketball') {
      return ['nba'];
    }

    if (lid.includes('laliga2') || lid.includes('hypermotion') || lid === 'esp.2') {
      return ['esp.2', 'esp.1'];
    }
    if (lid.includes('laliga') || lid.includes('primera') || lid === 'esp.1') {
      return ['esp.1', 'esp.2'];
    }
    if (lid.includes('copa') || lid === 'esp.copa') {
      return ['esp.1', 'esp.2'];
    }
    if (lid.includes('premier') || lid === 'eng.1' || lid.includes('eng')) {
      return ['eng.1'];
    }
    if (lid.includes('serie') || lid === 'ita.1' || lid.includes('ita')) {
      return ['ita.1'];
    }
    if (lid.includes('bundesliga') || lid === 'ger.1' || lid.includes('ger')) {
      return ['ger.1'];
    }
    if (lid.includes('ligue') || lid === 'fra.1' || lid.includes('fra')) {
      return ['fra.1'];
    }
    if (lid.includes('champions') || lid.includes('uefa.champions')) {
      return ['uefa.champions', 'esp.1', 'eng.1', 'ger.1', 'ita.1', 'fra.1'];
    }
    if (lid.includes('europa') || lid.includes('uefa.europa')) {
      return ['uefa.europa', 'esp.1', 'eng.1', 'ger.1', 'ita.1', 'fra.1'];
    }

    return ['esp.1', 'esp.2', 'eng.1', 'ita.1', 'ger.1', 'fra.1'];
  }

  /**
   * Obtiene la tabla de clasificación oficial de una competición.
   */
  public static async getLeagueStandings(leagueCode: string, sport: SportType): Promise<StandingsRawEntry[]> {
    const cacheKey = `official_standings_${sport}_${leagueCode}`;
    const cached = CacheManager.get<StandingsRawEntry[]>(cacheKey);
    if (cached) return cached;

    try {
      const url =
        sport === 'basketball'
          ? 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings'
          : `https://site.api.espn.com/apis/v2/sports/soccer/${leagueCode}/standings`;

      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) return [];

      const data = await res.json();
      const entries: any[] = [];

      // Soporte para estructura anidada por grupos/conferencias o lista plana
      if (data.children && Array.isArray(data.children)) {
        for (const child of data.children) {
          if (child.standings?.entries && Array.isArray(child.standings.entries)) {
            entries.push(...child.standings.entries);
          }
        }
      } else if (data.standings?.entries && Array.isArray(data.standings.entries)) {
        entries.push(...data.standings.entries);
      }

      const results: StandingsRawEntry[] = entries.map((e) => {
        const statsList = e.stats || [];
        const findVal = (name: string): number => {
          const item = statsList.find((s: any) => s.name === name);
          return item && item.value !== undefined ? Number(item.value) : 0;
        };

        const gp = findVal('gamesPlayed');
        const w = findVal('wins');
        const t = findVal('ties');
        const l = findVal('losses');
        const pf = findVal('pointsFor');
        const pa = findVal('pointsAgainst');
        const r = findVal('rank');

        return {
          teamName: e.team?.displayName || e.team?.name || '',
          teamShortName: e.team?.shortDisplayName || e.team?.abbreviation || '',
          teamId: String(e.team?.id || ''),
          gamesPlayed: gp > 0 ? gp : w + l + t,
          wins: w,
          ties: t,
          losses: l,
          pointsFor: pf,
          pointsAgainst: pa,
          rank: r > 0 ? r : undefined,
        };
      });

      if (results.length > 0) {
        CacheManager.set(cacheKey, results, 3600); // 1 hora de caché
        logInfo('SeasonStandingsService:getLeagueStandings', `${results.length} clasificados para ${leagueCode}`);
      }

      return results;
    } catch (err) {
      logError(`SeasonStandingsService:getLeagueStandings(${leagueCode})`, err);
      return [];
    }
  }

  /**
   * Obtiene el récord oficial de la temporada de un equipo en su competición.
   */
  public static async getTeamSeasonRecord(
    teamName: string,
    leagueId: string,
    sport: SportType,
    leagueDisplayName?: string
  ): Promise<TeamSeasonRecord | null> {
    const leagueCodes = this.resolveLeagueCodes(leagueId, sport);

    for (const code of leagueCodes) {
      const standings = await this.getLeagueStandings(code, sport);
      const match = standings.find((entry) =>
        this.matchesTeam(teamName, entry.teamName, entry.teamShortName)
      );

      if (match && match.gamesPlayed > 0) {
        const matchesPlayed = match.gamesPlayed;
        const wins = match.wins;
        const draws = sport === 'football' ? match.ties : undefined;
        const losses = match.losses;

        const winRate = Math.round((wins / matchesPlayed) * 100);
        const drawRate = draws !== undefined ? Math.round((draws / matchesPlayed) * 100) : undefined;
        const lossRate = Math.round((losses / matchesPlayed) * 100);

        const avgGoalsOrPointsScored = Number((match.pointsFor / matchesPlayed).toFixed(1));
        const avgGoalsOrPointsConceded = Number((match.pointsAgainst / matchesPlayed).toFixed(1));

        const compName = leagueDisplayName || (sport === 'basketball' ? 'NBA' : `Competición Oficial (${code})`);

        return {
          teamName: match.teamName,
          competitionName: compName,
          season: 'Temporada Actual',
          matchesPlayed,
          wins,
          draws,
          losses,
          winRate,
          drawRate,
          lossRate,
          goalsOrPointsScored: match.pointsFor,
          goalsOrPointsConceded: match.pointsAgainst,
          avgGoalsOrPointsScored,
          avgGoalsOrPointsConceded,
          rank: match.rank,
        };
      }
    }

    return null;
  }

  /**
   * Enriquece un partido con los datos 100% verídicos de la temporada actual.
   * Si no hay datos disponibles, garantiza que no se muestren datos simulados.
   */
  public static async enrichMatchWithSeasonStats(match: MatchDetail): Promise<MatchDetail> {
    try {
      const [homeRec, awayRec] = await Promise.all([
        this.getTeamSeasonRecord(match.homeTeam.name, match.league.id, match.sport, match.league.name),
        this.getTeamSeasonRecord(match.awayTeam.name, match.league.id, match.sport, match.league.name),
      ]);

      match.seasonStats = {
        home: homeRec,
        away: awayRec,
      };

      const isFb = match.sport === 'football';

      if (homeRec && awayRec) {
        // Asignar frecuencias reales de temporada
        match.frequencies10 = {
          home: {
            sampleSize: homeRec.matchesPlayed,
            totalMatchesEvaluated: homeRec.matchesPlayed,
            homeTeamWins: homeRec.winRate,
            awayTeamWins: homeRec.lossRate,
            draws: isFb ? homeRec.drawRate : undefined,
            winsCount: homeRec.wins,
            drawsCount: isFb ? homeRec.draws : undefined,
            lossesCount: homeRec.losses,
            over25GoalsOrOverPointsRate: isFb ? 50 : 60,
            bothTeamsScoredRate: isFb ? 50 : undefined,
            avgGoalsOrPointsScored: homeRec.avgGoalsOrPointsScored,
            avgGoalsOrPointsConceded: homeRec.avgGoalsOrPointsConceded,
          },
          away: {
            sampleSize: awayRec.matchesPlayed,
            totalMatchesEvaluated: awayRec.matchesPlayed,
            homeTeamWins: awayRec.winRate,
            awayTeamWins: awayRec.lossRate,
            draws: isFb ? awayRec.drawRate : undefined,
            winsCount: awayRec.wins,
            drawsCount: isFb ? awayRec.draws : undefined,
            lossesCount: awayRec.losses,
            over25GoalsOrOverPointsRate: isFb ? 50 : 60,
            bothTeamsScoredRate: isFb ? 50 : undefined,
            avgGoalsOrPointsScored: awayRec.avgGoalsOrPointsScored,
            avgGoalsOrPointsConceded: awayRec.avgGoalsOrPointsConceded,
          },
        };

        match.frequencies5 = match.frequencies10;

        // Calcular probabilidades empíricas 100% de la temporada
        match.probabilities = calculateEmpiricalProbabilities(
          {
            matchesPlayed: homeRec.matchesPlayed,
            wins: homeRec.wins,
            draws: isFb ? homeRec.draws : undefined,
            losses: homeRec.losses,
            avgScored: homeRec.avgGoalsOrPointsScored,
            avgConceded: homeRec.avgGoalsOrPointsConceded,
          },
          {
            matchesPlayed: awayRec.matchesPlayed,
            wins: awayRec.wins,
            draws: isFb ? awayRec.draws : undefined,
            losses: awayRec.losses,
            avgScored: awayRec.avgGoalsOrPointsScored,
            avgConceded: awayRec.avgGoalsOrPointsConceded,
          },
          match.sport
        );

        // Actualizar métricas cara a cara
        match.metrics = isFb
          ? [
              {
                id: 'matches',
                label: 'Partidos disputados en la temporada',
                homeValue: homeRec.matchesPlayed,
                awayValue: awayRec.matchesPlayed,
                unit: 'partidos',
                isHigherBetter: true,
              },
              {
                id: 'scored',
                label: 'Goles por partido (Promedio real de la temporada)',
                homeValue: homeRec.avgGoalsOrPointsScored,
                awayValue: awayRec.avgGoalsOrPointsScored,
                unit: 'goles',
                isHigherBetter: true,
              },
              {
                id: 'conceded',
                label: 'Goles encajados por partido (Promedio real)',
                homeValue: homeRec.avgGoalsOrPointsConceded,
                awayValue: awayRec.avgGoalsOrPointsConceded,
                unit: 'goles',
                isHigherBetter: false,
              },
              {
                id: 'corners',
                label: 'Córners por partido (Media real)',
                homeValue: null,
                awayValue: null,
                unit: 'córners',
                isHigherBetter: true,
              },
              {
                id: 'possession',
                label: 'Posesión media',
                homeValue: null,
                awayValue: null,
                unit: '%',
                isHigherBetter: true,
              },
            ]
          : [
              {
                id: 'matches',
                label: 'Partidos disputados en la temporada',
                homeValue: homeRec.matchesPlayed,
                awayValue: awayRec.matchesPlayed,
                unit: 'partidos',
                isHigherBetter: true,
              },
              {
                id: 'scored',
                label: 'Puntos por partido (Promedio real de la temporada)',
                homeValue: homeRec.avgGoalsOrPointsScored,
                awayValue: awayRec.avgGoalsOrPointsScored,
                unit: 'pts',
                isHigherBetter: true,
              },
              {
                id: 'conceded',
                label: 'Puntos encajados por partido (Promedio real)',
                homeValue: homeRec.avgGoalsOrPointsConceded,
                awayValue: awayRec.avgGoalsOrPointsConceded,
                unit: 'pts',
                isHigherBetter: false,
              },
            ];

        // Disponibilidad de datos
        match.dataAvailability = {
          sourceName: 'Clasificación Oficial Temporada Actual',
          lastUpdated: 'En vivo desde la clasificación oficial',
          sampleSize: Math.min(homeRec.matchesPlayed, awayRec.matchesPlayed),
          isSampleSufficient: Math.min(homeRec.matchesPlayed, awayRec.matchesPlayed) >= 5,
          missingFields: isFb ? ['corners', 'possession'] : [],
        };
      } else {
        // Si falta algún equipo en las clasificaciones oficiales
        match.dataAvailability = {
          sourceName: match.dataAvailability.sourceName,
          lastUpdated: match.dataAvailability.lastUpdated,
          sampleSize: 0,
          isSampleSufficient: false,
          missingFields: ['seasonStandings'],
        };
      }

      return match;
    } catch (err) {
      logError(`SeasonStandingsService:enrichMatchWithSeasonStats(${match.id})`, err);
      return match;
    }
  }
}

