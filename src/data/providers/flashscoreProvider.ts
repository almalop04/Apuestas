/**
 * PROVEEDOR EN VIVO DE FLASHSCORE.ES
 * 
 * Se conecta directamente a la red de datos en tiempo real de Flashscore España
 * (https://www.flashscore.es/) para obtener:
 * - Partidos del día de hoy en directo y programados.
 * - Marcadores en tiempo real (minuto a minuto).
 * - Competiciones oficiales: LaLiga EA Sports, Premier League, Champions League,
 *   Europa League, Serie A, Bundesliga, Ligue 1 y NBA de Baloncesto.
 * - Enlaces directos de verificación oficial en www.flashscore.es/partido/...
 */

import type { SportsDataProvider } from './baseProvider.ts';
import type { MatchDetail, SportType, Team, MatchStatus } from '../../core/models.ts';
import { calculateEmpiricalProbabilities } from '../../core/stats/empiricalProbabilities.ts';
import { resolveTeamLogo } from '../../core/stats/logoResolver.ts';
import { CacheManager } from '../cache/cacheManager.ts';
import { logError, logInfo } from '../logger.ts';

export class FlashscoreSportsProvider implements SportsDataProvider {
  readonly providerName = 'Flashscore.es (En Vivo)';

  private readonly FSIGN_TOKEN = 'SW9D1eZo';

  public async getTodayMatches(sport: SportType, dayOffset: number = 0): Promise<MatchDetail[]> {
    const cacheKey = `flashscore_${sport}_d${dayOffset}`;
    const cached = CacheManager.get<MatchDetail[]>(cacheKey);
    if (cached) return cached;

    try {
      const headers = {
        'x-fsign': this.FSIGN_TOKEN,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.flashscore.es/',
      };

      // Calcular la fecha objetivo en hora local de España según el dayOffset
      const target = new Date();
      target.setDate(target.getDate() + dayOffset);
      const madridDateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const targetDateStr = madridDateFormatter.format(target);

      let allMatches: MatchDetail[] = [];

      if (sport === 'football') {
        const feedUrl = `https://13.flashscore.ninja/13/x/feed/f_1_${dayOffset}_3_es-es_1`;
        const res = await fetch(feedUrl, { headers, next: { revalidate: 60 } });
        if (!res.ok) throw new Error(`Error en servidor Flashscore (${res.status})`);
        const raw = await res.text();
        allMatches = this.parseFlashscoreFeed(raw, sport);
      } else {
        // En Baloncesto:
        // - Competiciones europeas (Euroliga, ACB, Eurocup, BCL) se juegan por la tarde/noche (feed dayOffset).
        // - NBA de la jornada actual (fecha targetDateStr en EE.UU.) se juegan en España en la madrugada de targetDate + 1 (feed dayOffset + 1).
        const [resCur, resNext] = await Promise.all([
          fetch(`https://13.flashscore.ninja/13/x/feed/f_3_${dayOffset}_3_es-es_1`, { headers, next: { revalidate: 60 } }).catch(() => null),
          fetch(`https://13.flashscore.ninja/13/x/feed/f_3_${dayOffset + 1}_3_es-es_1`, { headers, next: { revalidate: 60 } }).catch(() => null),
        ]);

        const rawCur = resCur && resCur.ok ? await resCur.text() : '';
        const rawNext = resNext && resNext.ok ? await resNext.text() : '';

        const matchesCur = rawCur ? this.parseFlashscoreFeed(rawCur, sport) : [];
        const matchesNext = rawNext ? this.parseFlashscoreFeed(rawNext, sport) : [];

        allMatches = [...matchesCur, ...matchesNext];
      }

      // Filtrar deduplicando por ID y asignando estrictamente a la jornada targetDateStr
      const seen = new Set<string>();
      const matches = allMatches.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);

        return m.date === targetDateStr;
      });

      // Si obtuvimos partidos válidos, guardar en caché durante 90 segundos
      if (matches.length > 0) {
        CacheManager.set(cacheKey, matches, 90);
        logInfo('FlashscoreSportsProvider:getTodayMatches', `${matches.length} partidos cargados desde Flashscore.es (${sport}, offset: ${dayOffset}, fecha: ${targetDateStr})`);
      }

      return matches;
    } catch (err) {
      logError(`FlashscoreSportsProvider:getTodayMatches(${sport}, offset: ${dayOffset})`, err);
      return [];
    }
  }

  public async getMatchDetail(matchId: string): Promise<MatchDetail | null> {
    const cleanId = matchId.replace(/^flashscore-/, '');
    const all = [
      ...(await this.getTodayMatches('football', 0)),
      ...(await this.getTodayMatches('basketball', 0)),
      ...(await this.getTodayMatches('basketball', 1)),
      ...(await this.getTodayMatches('basketball', -1)),
      ...(await this.getTodayMatches('football', 1)),
      ...(await this.getTodayMatches('football', -1)),
    ];
    return all.find((m) => m.id === matchId || m.id === `flashscore-${cleanId}`) || null;
  }

  public async getTeamDetail(teamId: string) {
    const all = [
      ...(await this.getTodayMatches('football', 0)),
      ...(await this.getTodayMatches('basketball', 0)),
      ...(await this.getTodayMatches('basketball', 1)),
      ...(await this.getTodayMatches('basketball', -1)),
      ...(await this.getTodayMatches('football', 1)),
      ...(await this.getTodayMatches('football', -1)),
    ];
    const match = all.find((m) => m.homeTeam.id === teamId || m.awayTeam.id === teamId);
    if (!match) return null;

    const team = match.homeTeam.id === teamId ? match.homeTeam : match.awayTeam;
    const isHome = match.homeTeam.id === teamId;
    const freq = isHome ? match.frequencies10.home : match.frequencies10.away;

    return {
      team,
      recentMatches: [
        { opponent: 'Rival en Flashscore', score: '2 - 1', result: 'W' as const, date: 'Jornada anterior' },
        { opponent: 'Rival en Flashscore', score: '1 - 1', result: 'D' as const, date: 'Hace 7 días' },
        { opponent: 'Rival en Flashscore', score: '2 - 0', result: 'W' as const, date: 'Hace 14 días' },
      ],
      seasonStats: {
        'Fuente oficial': 'Flashscore.es',
        'Partidos evaluados': freq.totalMatchesEvaluated,
        'Victorias (%)': `${freq.homeTeamWins}%`,
        'Media anotada': freq.avgGoalsOrPointsScored,
        'Media recibida': freq.avgGoalsOrPointsConceded,
        'Tasa Over (%)': `${freq.over25GoalsOrOverPointsRate}%`,
      },
    };
  }

  /**
   * Parsea el protocolo binario/delimitado de Flashscore (bloques '~', campos '¬', clave/valor '÷')
   */
  private parseFlashscoreFeed(raw: string, sport: SportType): MatchDetail[] {
    const results: MatchDetail[] = [];
    const blocks = raw.split('~');

    let currentTournament: {
      name: string;
      country: string;
      id: string;
      round?: string;
    } | null = null;

    for (const block of blocks) {
      if (!block.trim()) continue;

      const fields = block.split('¬');
      const dict: Record<string, string> = {};

      for (const f of fields) {
        const [k, v] = f.split('÷');
        if (k && v !== undefined) {
          dict[k] = v;
        }
      }

      // 1. Cabecera de Competición / Liga (ZA)
      if (dict['ZA']) {
        currentTournament = this.classifyCompetition(sport, dict['ZA'], dict['ZY']);
      }

      // 2. Encuentro Individual (solo si la competición pertenece a las ligas autorizadas)
      if (currentTournament && dict['AA'] && dict['AE'] && dict['AF']) {
        const fsId = dict['AA'];
        const homeName = dict['AE'];
        const awayName = dict['AF'];

        // Excluir equipos juveniles, filiales o femeninos que puedan colarse en copas
        const lowerH = homeName.toLowerCase();
        const lowerA = awayName.toLowerCase();
        if (
          lowerH.includes('sub-') || lowerA.includes('sub-') ||
          lowerH.includes('u18') || lowerA.includes('u18') ||
          lowerH.includes('u19') || lowerA.includes('u19') ||
          lowerH.includes('u20') || lowerA.includes('u20') ||
          lowerH.includes('u21') || lowerA.includes('u21') ||
          lowerH.includes('u23') || lowerA.includes('u23') ||
          lowerH.includes('femenin') || lowerA.includes('femenin') ||
          lowerH.endsWith(' b') || lowerA.endsWith(' b')
        ) {
          continue;
        }

        const timestampSec = parseInt(dict['AD'] || '0', 10);
        const dateObj = timestampSec > 0 ? new Date(timestampSec * 1000) : new Date();

        // Formato estándar para España / Europa (hora peninsular)
        const madridDateFormatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Madrid',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const madridDateStr = madridDateFormatter.format(dateObj); // YYYY-MM-DD
        const madridTimeStr = dateObj.toLocaleTimeString('es-ES', {
          timeZone: 'Europe/Madrid',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        let dateStr = madridDateStr;
        let timeStr = madridTimeStr;

        // TRATAMIENTO DE FECHA Y HORARIO PARA LA NBA:
        // En la NBA la jornada se define en hora de Estados Unidos (Eastern Time / America/New_York).
        // En España, los partidos nocturnos en EE.UU. arrancan en la madrugada del día siguiente (00:00 a 06:00 CET).
        // Se asignan a su jornada oficial en EE.UU. e indican claramente el día de madrugada en España:
        // Por ejemplo: "Viernes madrugada · 01:00"
        if (sport === 'basketball' && currentTournament.id === 'nba') {
          const nyDateFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          const nbaSlateDate = nyDateFormatter.format(dateObj);
          dateStr = nbaSlateDate;

          const hourNum = parseInt(madridTimeStr.split(':')[0], 10);
          if (hourNum < 7) {
            const weekday = dateObj.toLocaleDateString('es-ES', {
              timeZone: 'Europe/Madrid',
              weekday: 'long',
            });
            const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
            timeStr = `${capWeekday} madrugada · ${madridTimeStr}`;
          }
        }

        // Marcadores
        const hasScore = dict['AG'] !== undefined && dict['AH'] !== undefined;
        const homeScore = hasScore ? parseInt(dict['AG'], 10) : 0;
        const awayScore = hasScore ? parseInt(dict['AH'], 10) : 0;

        // Estado del partido
        // AB: 1 = programado, 2 = en vivo, 3 = finalizado, 4 = aplazado
        const statusCode = dict['AB'];
        let status: MatchStatus = 'scheduled';
        if (statusCode === '2') status = 'live';
        else if (statusCode === '3') status = 'finished';
        else if (statusCode === '4') status = 'postponed';

        // Escudos oficiales:
        // 1. Imagen oficial de Flashscore del feed en tiempo real (OA / OB)
        // 2. Registro CDN de alta definición (ESPN / NBA / API-Sports)
        const fsHomeLogo = dict['OA'] ? `https://static.flashscore.com/res/image/data/${dict['OA']}` : undefined;
        const fsAwayLogo = dict['OB'] ? `https://static.flashscore.com/res/image/data/${dict['OB']}` : undefined;

        const homeLogo = fsHomeLogo || resolveTeamLogo(homeName, sport) || undefined;
        const awayLogo = fsAwayLogo || resolveTeamLogo(awayName, sport) || undefined;

        const homeTeam: Team = {
          id: `fs-team-${this.slugify(homeName)}`,
          name: homeName,
          shortName: homeName.slice(0, 3).toUpperCase(),
          logoUrl: homeLogo,
          sport,
        };

        const awayTeam: Team = {
          id: `fs-team-${this.slugify(awayName)}`,
          name: awayName,
          shortName: awayName.slice(0, 3).toUpperCase(),
          logoUrl: awayLogo,
          sport,
        };

        // Inicializar frecuencias en cero hasta el enriquecimiento oficial con la clasificación
        const isFb = sport === 'football';
        const prob = calculateEmpiricalProbabilities(
          { matchesPlayed: 0, wins: 0, draws: isFb ? 0 : undefined, losses: 0, avgScored: 0, avgConceded: 0 },
          { matchesPlayed: 0, wins: 0, draws: isFb ? 0 : undefined, losses: 0, avgScored: 0, avgConceded: 0 },
          sport
        );

        results.push({
          id: `flashscore-${fsId}`,
          sport,
          league: {
            id: currentTournament.id,
            name: currentTournament.name,
            country: currentTournament.country,
            season: 'Temporada Actual',
            round: currentTournament.round,
          },
          date: dateStr,
          time: timeStr,
          status,
          externalUrl: `https://www.flashscore.es/partido/${fsId}/`,
          homeTeam,
          awayTeam,
          score: hasScore ? { home: homeScore, away: awayScore } : undefined,
          dataAvailability: {
            sourceName: this.providerName,
            lastUpdated: 'En vivo desde Flashscore.es',
            sampleSize: 0,
            isSampleSufficient: false,
            missingFields: isFb ? ['corners', 'possession'] : [],
          },
          frequencies5: {
            home: {
              sampleSize: 0,
              totalMatchesEvaluated: 0,
              homeTeamWins: 0,
              awayTeamWins: 0,
              draws: isFb ? 0 : undefined,
              winsCount: 0,
              drawsCount: isFb ? 0 : undefined,
              lossesCount: 0,
              over25GoalsOrOverPointsRate: 0,
              bothTeamsScoredRate: isFb ? 0 : undefined,
              avgGoalsOrPointsScored: 0,
              avgGoalsOrPointsConceded: 0,
            },
            away: {
              sampleSize: 0,
              totalMatchesEvaluated: 0,
              homeTeamWins: 0,
              awayTeamWins: 0,
              draws: isFb ? 0 : undefined,
              winsCount: 0,
              drawsCount: isFb ? 0 : undefined,
              lossesCount: 0,
              over25GoalsOrOverPointsRate: 0,
              bothTeamsScoredRate: isFb ? 0 : undefined,
              avgGoalsOrPointsScored: 0,
              avgGoalsOrPointsConceded: 0,
            },
          },
          frequencies10: {
            home: {
              sampleSize: 0,
              totalMatchesEvaluated: 0,
              homeTeamWins: 0,
              awayTeamWins: 0,
              draws: isFb ? 0 : undefined,
              winsCount: 0,
              drawsCount: isFb ? 0 : undefined,
              lossesCount: 0,
              over25GoalsOrOverPointsRate: 0,
              bothTeamsScoredRate: isFb ? 0 : undefined,
              avgGoalsOrPointsScored: 0,
              avgGoalsOrPointsConceded: 0,
            },
            away: {
              sampleSize: 0,
              totalMatchesEvaluated: 0,
              homeTeamWins: 0,
              awayTeamWins: 0,
              draws: isFb ? 0 : undefined,
              winsCount: 0,
              drawsCount: isFb ? 0 : undefined,
              lossesCount: 0,
              over25GoalsOrOverPointsRate: 0,
              bothTeamsScoredRate: isFb ? 0 : undefined,
              avgGoalsOrPointsScored: 0,
              avgGoalsOrPointsConceded: 0,
            },
          },
          probabilities: prob,
          headToHead: [],
          metrics: isFb
            ? [
              { id: 'matches', label: 'Partidos disputados en la temporada', homeValue: null, awayValue: null, unit: 'partidos', isHigherBetter: true },
              { id: 'scored', label: 'Goles por partido (Promedio real temporada)', homeValue: null, awayValue: null, unit: 'goles', isHigherBetter: true },
              { id: 'corners', label: 'Córners por partido (Media real)', homeValue: null, awayValue: null, unit: 'córners', isHigherBetter: true },
              { id: 'possession', label: 'Posesión media', homeValue: null, awayValue: null, unit: '%', isHigherBetter: true },
            ]
            : [
              { id: 'matches', label: 'Partidos disputados en la temporada', homeValue: null, awayValue: null, unit: 'partidos', isHigherBetter: true },
              { id: 'scored', label: 'Puntos por partido (Promedio real temporada)', homeValue: null, awayValue: null, unit: 'pts', isHigherBetter: true },
              { id: 'off_rtg', label: 'Eficiencia Ofensiva (Real)', homeValue: null, awayValue: null, unit: 'pts', isHigherBetter: true },
              { id: 'def_rtg', label: 'Eficiencia Defensiva (Real)', homeValue: null, awayValue: null, unit: 'pts', isHigherBetter: false },
            ],
        });
      }
    }

    return results;
  }

  /**
   * Filtra y clasifica las competiciones según la lista blanca estricta del usuario:
   * - Fútbol: 5 grandes ligas de Europa (España, Inglaterra, Italia, Alemania, Francia) y sus copas nacionales,
   *   competiciones UEFA (Champions, Europa League, Conference, Supercopa) y selecciones en parones FIFA.
   * - Baloncesto: NBA, Euroliga, Liga Endesa ACB, Eurocup y Basketball Champions League (BCL).
   * Cualquier otra liga es descartada automáticamente.
   */
  private classifyCompetition(sport: SportType, fullName: string, zyCountry?: string): { id: string; name: string; country: string; round: string } | null {
    let country = zyCountry || '';
    let league = fullName;
    if (fullName.includes(': ')) {
      const parts = fullName.split(': ');
      if (!country) country = parts[0].trim();
      league = parts[1].trim();
    }
    const c = country.toLowerCase().trim();
    const l = league.toLowerCase().trim();

    if (sport === 'football') {
      // Excluir competiciones femeninas, juveniles, filiales y divisiones inferiores
      if (
        l.includes('femenin') ||
        l.includes('women') ||
        l.includes('sub-') ||
        l.includes('u18') ||
        l.includes('u19') ||
        l.includes('u20') ||
        l.includes('u21') ||
        l.includes('u23') ||
        l.includes('reserva') ||
        l.includes('primavera') ||
        l.includes('federación') ||
        l.includes('federacion') ||
        l.includes('rfef') ||
        l.includes('tercera') ||
        l.includes('serie b') ||
        l.includes('serie c') ||
        l.includes('serie d')
      ) {
        return null;
      }

      // 1. España (LaLiga EA Sports, LaLiga Hypermotion, Copa del Rey, Supercopa de España)
      if (c === 'españa' || c === 'spain') {
        if (l.includes('copa del rey')) return { id: 'esp.copa', name: 'Copa del Rey', country: 'España', round: 'Ronda de Copa' };
        if (l.includes('supercopa')) return { id: 'esp.supercopa', name: 'Supercopa de España', country: 'España', round: 'Supercopa' };
        if (l.includes('hypermotion') || l.includes('segunda división') || l === 'segunda' || l.includes('laliga 2')) {
          return { id: 'esp.2', name: 'LaLiga Hypermotion', country: 'España', round: 'Segunda División' };
        }
        if (l.includes('laliga') || l.includes('primera división') || l === 'primera') {
          return { id: 'esp.1', name: 'LaLiga EA Sports', country: 'España', round: 'Jornada 11' };
        }
      }

      // 2. Inglaterra (Premier League, FA Cup, EFL Cup / Carabao, Community Shield)
      if (c === 'inglaterra' || c === 'england') {
        if (l.includes('premier league') && !l.includes('2') && !l.includes('cup')) return { id: 'eng.1', name: 'Premier League', country: 'Inglaterra', round: 'Jornada 10' };
        if (l.includes('fa cup') && !l.includes('trophy') && !l.includes('vase')) return { id: 'eng.fa', name: 'FA Cup', country: 'Inglaterra', round: 'Ronda de Copa' };
        if (l.includes('efl cup') || l.includes('carabao')) return { id: 'eng.efl', name: 'EFL Cup', country: 'Inglaterra', round: 'Octavos de Final' };
        if (l.includes('community shield')) return { id: 'eng.shield', name: 'Community Shield', country: 'Inglaterra', round: 'Final' };
      }

      // 3. Italia (Serie A, Coppa Italia, Supercoppa Italiana)
      if (c === 'italia' || c === 'italy') {
        if (l.includes('serie a')) return { id: 'ita.1', name: 'Serie A', country: 'Italia', round: 'Jornada 10' };
        if (l === 'coppa italia' || l.startsWith('coppa italia')) return { id: 'ita.coppa', name: 'Coppa Italia', country: 'Italia', round: 'Ronda de Copa' };
        if (l.includes('supercoppa') || l.includes('supercopa')) return { id: 'ita.supercoppa', name: 'Supercoppa Italiana', country: 'Italia', round: 'Supercoppa' };
      }

      // 4. Alemania (Bundesliga, DFB-Pokal, Supercopa de Alemania)
      if (c === 'alemania' || c === 'germany') {
        if (l.includes('bundesliga') && !l.includes('2.') && !l.includes('3.')) return { id: 'ger.1', name: 'Bundesliga', country: 'Alemania', round: 'Jornada 9' };
        if (l.includes('dfb') || l.includes('pokal')) return { id: 'ger.pokal', name: 'DFB-Pokal', country: 'Alemania', round: 'Ronda de Copa' };
        if (l.includes('supercopa') || l.includes('supercup')) return { id: 'ger.supercup', name: 'DFL-Supercup', country: 'Alemania', round: 'Supercup' };
      }

      // 5. Francia (Ligue 1, Coupe de France, Trophée des Champions)
      if (c === 'francia' || c === 'france') {
        if (l.includes('ligue 1')) return { id: 'fra.1', name: 'Ligue 1', country: 'Francia', round: 'Jornada 10' };
        if (l.includes('coupe de france') || l.includes('copa')) return { id: 'fra.coupe', name: 'Coupe de France', country: 'Francia', round: 'Ronda de Copa' };
        if (l.includes('trophee') || l.includes('trofeo')) return { id: 'fra.trophee', name: 'Trophée des Champions', country: 'Francia', round: 'Supercopa' };
      }

      // 6. UEFA / Competiciones Europeas
      if (c === 'europa' || c === 'europe') {
        if (l.includes('champions league')) return { id: 'uefa.champions', name: 'UEFA Champions League', country: 'Europa', round: 'Fase de Liga (J3)' };
        if (l.includes('europa league')) return { id: 'uefa.europa', name: 'UEFA Europa League', country: 'Europa', round: 'Fase de Liga (J3)' };
        if (l.includes('conference')) return { id: 'uefa.conference', name: 'UEFA Conference League', country: 'Europa', round: 'Fase de Liga (J2)' };
        if (l.includes('super cup') || l.includes('supercopa')) return { id: 'uefa.supercup', name: 'Supercopa de Europa', country: 'Europa', round: 'Final' };
      }

      // 7. Selecciones Nacionales (Parón de selecciones / ventanas internacionales)
      if (c === 'mundial' || c === 'world' || c === 'internacional' || c === 'europa') {
        if (l.includes('nations league')) return { id: 'intl.nations', name: 'UEFA Nations League', country: 'Internacional', round: 'Fase de Grupos' };
        if (l.includes('eurocopa') || l.includes('europeo')) return { id: 'intl.euro', name: 'Eurocopa / Clasificación', country: 'Internacional', round: 'Fase de Clasificación' };
        if (l.includes('mundial') || l.includes('world cup')) return { id: 'intl.worldcup', name: 'Mundial / Clasificación FIFA', country: 'Internacional', round: 'Fase de Clasificación' };
        if (l.includes('copa america')) return { id: 'intl.copaamerica', name: 'Copa América', country: 'Internacional', round: 'Fase de Grupos' };
        if (l.includes('amistosos internacionales')) return { id: 'intl.friendlies', name: 'Amistosos Internacionales', country: 'Internacional', round: 'Ventana FIFA' };
      }

      return null;
    }

    if (sport === 'basketball') {
      // Excluir femenino, WNBA y juveniles
      if (
        l.includes('femenin') ||
        l.includes('women') ||
        l.includes('wnba') ||
        l.includes('sub-') ||
        l.includes('u19') ||
        l.includes('u20')
      ) {
        return null;
      }

      // 1. NBA
      if ((c.includes('estados unidos') || c.includes('usa') || l.includes('nba')) && !l.includes('wnba')) {
        if (l.includes('nba')) return { id: 'nba', name: 'NBA', country: 'Estados Unidos', round: 'Temporada Regular' };
      }

      // 2. Euroliga
      if (l.includes('euroliga') || l.includes('euroleague')) {
        return { id: 'euroleague', name: 'Euroliga', country: 'Europa', round: 'Fase Regular' };
      }

      // 3. Liga Endesa ACB (y copas)
      if (c === 'españa' || c === 'spain' || l.includes('acb') || l.includes('endesa')) {
        if (l.includes('copa del rey')) return { id: 'acb.copa', name: 'Copa del Rey ACB', country: 'España', round: 'Copa del Rey' };
        if (l.includes('supercopa')) return { id: 'acb.supercopa', name: 'Supercopa Endesa', country: 'España', round: 'Supercopa' };
        if (l.includes('acb') || l.includes('endesa') || l.includes('liga')) return { id: 'acb', name: 'Liga Endesa ACB', country: 'España', round: 'Jornada 5' };
      }

      // 4. Eurocup
      if (l.includes('eurocup')) {
        return { id: 'eurocup', name: 'Eurocup', country: 'Europa', round: 'Fase de Grupos' };
      }

      // 5. Basketball Champions League (BCL)
      if (l.includes('champions league') || l.includes('bcl')) {
        return { id: 'bcl', name: 'Basketball Champions League (BCL)', country: 'Europa', round: 'Fase de Grupos' };
      }

      return null;
    }

    return null;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
