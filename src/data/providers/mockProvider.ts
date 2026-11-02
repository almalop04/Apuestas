/**
 * PROVEEDOR DE DATOS SIMULADOS REALISTAS (MOCK PROVIDER)
 * 
 * Permite ejecutar la aplicación al 100% de forma autónoma, sin depender
 * de registrarse en APIs externas ni gastar cuotas durante el desarrollo.
 * 
 * Incluye intencionadamente partidos con datos completos y partidos con 
 * casos límite ("Sin datos suficientes" / "Muestra reducida") para verificar la UX.
 * 
 * Ahora con:
 * - Fecha dinámica del día de hoy calculada en tiempo real.
 * - Escudos oficiales de alta fidelidad para cada club.
 */

import type { SportsDataProvider } from './baseProvider.ts';
import type { MatchDetail, SportType, Team } from '../../core/models.ts';
import { calculateFootballProbabilities } from '../../core/stats/poisson.ts';
import { calculateBasketballProbabilities } from '../../core/stats/basketballModel.ts';

export class MockSportsProvider implements SportsDataProvider {
  readonly providerName = 'Simulador Analítico Oficial (Alta Fidelidad)';

  public async getTodayMatches(sport: SportType, dayOffset: number = 0): Promise<MatchDetail[]> {
    // Simula una breve latencia de red realista (150ms)
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (sport === 'football') {
      return this.getFootballMatches(dayOffset);
    }
    return this.getBasketballMatches(dayOffset);
  }

  public async getMatchDetail(matchId: string): Promise<MatchDetail | null> {
    const all = [...this.getFootballMatches(0), ...this.getBasketballMatches(0)];
    return all.find((m) => m.id === matchId) || null;
  }

  public async getTeamDetail(teamId: string) {
    const allMatches = [...this.getFootballMatches(0), ...this.getBasketballMatches(0)];
    const match = allMatches.find((m) => m.homeTeam.id === teamId || m.awayTeam.id === teamId);
    if (!match) return null;

    const team = match.homeTeam.id === teamId ? match.homeTeam : match.awayTeam;
    const isHome = match.homeTeam.id === teamId;
    const freq = isHome ? match.frequencies10.home : match.frequencies10.away;

    return {
      team,
      recentMatches: [
        { opponent: 'Rival A', score: '2 - 1', result: 'W' as const, date: 'Reciente' },
        { opponent: 'Rival B', score: '1 - 1', result: 'D' as const, date: 'Reciente' },
        { opponent: 'Rival C', score: '3 - 0', result: 'W' as const, date: 'Reciente' },
        { opponent: 'Rival D', score: '0 - 1', result: 'L' as const, date: 'Reciente' },
        { opponent: 'Rival E', score: '2 - 0', result: 'W' as const, date: 'Reciente' },
      ],
      seasonStats: {
        'Partidos evaluados': freq.totalMatchesEvaluated,
        'Victorias (%)': `${freq.homeTeamWins}%`,
        'Media anotada': freq.avgGoalsOrPointsScored,
        'Media encajada': freq.avgGoalsOrPointsConceded,
        'Tasa Over (%)': `${freq.over25GoalsOrOverPointsRate}%`,
      },
    };
  }

  // ============================================================================
  // DATOS SIMULADOS DE FÚTBOL CON ESCUDOS Y FECHA ACTUAL
  // ============================================================================
  private getFootballMatches(dayOffset: number = 0): MatchDetail[] {
    const target = new Date();
    target.setDate(target.getDate() + dayOffset);
    const madridDateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const today = madridDateFormatter.format(target);

    // 1. Real Madrid vs FC Barcelona (El Clásico)
    const probClasico = calculateFootballProbabilities(
      { avgGoalsScoredHome: 2.2, avgGoalsConcededHome: 0.8, avgGoalsScoredAway: 1.8, avgGoalsConcededAway: 1.1, matchesPlayed: 14 },
      { avgGoalsScoredHome: 2.4, avgGoalsConcededHome: 1.0, avgGoalsScoredAway: 1.9, avgGoalsConcededAway: 1.2, matchesPlayed: 14 }
    );

    // 2. Manchester City vs Arsenal (Premier League)
    const probPremier = calculateFootballProbabilities(
      { avgGoalsScoredHome: 2.5, avgGoalsConcededHome: 0.7, avgGoalsScoredAway: 1.6, avgGoalsConcededAway: 0.9, matchesPlayed: 12 },
      { avgGoalsScoredHome: 2.0, avgGoalsConcededHome: 0.8, avgGoalsScoredAway: 1.5, avgGoalsConcededAway: 0.8, matchesPlayed: 12 }
    );

    // 3. Girona vs Leganés
    const probGirona = calculateFootballProbabilities(
      { avgGoalsScoredHome: 1.6, avgGoalsConcededHome: 1.3, avgGoalsScoredAway: 1.1, avgGoalsConcededAway: 1.4, matchesPlayed: 8 },
      { avgGoalsScoredHome: 1.0, avgGoalsConcededHome: 1.2, avgGoalsScoredAway: 0.8, avgGoalsConcededAway: 1.5, matchesPlayed: 8 }
    );

    // 4. Caso Límite: Muestra Insuficiente (<5 partidos)
    const probInsuficiente = {
      homeWinProb: 0,
      drawProb: 0,
      awayWinProb: 0,
      expectedHomeScore: 0,
      expectedAwayScore: 0,
      modelName: 'Bloqueado por Muestra Insuficiente (<5 partidos)',
      confidenceRating: 'insuficiente' as const,
      explanationText: 'Muestra estadística insuficiente (3 partidos disputados). El protocolo ético del sistema desactiva el cálculo probabilístico para evitar emitir estimaciones no representativas.',
    };

    return [
      {
        id: 'fb-1',
        sport: 'football',
        league: { id: 'laliga', name: 'LaLiga EA Sports', country: 'España', season: '2026/2027', round: 'Jornada 11' },
        date: today,
        time: '21:00',
        status: 'scheduled',
        venue: 'Estadio Santiago Bernabéu (Madrid)',
        homeTeam: {
          id: 'rmadrid',
          name: 'Real Madrid',
          shortName: 'RMA',
          sport: 'football',
          logoUrl: 'https://media.api-sports.io/football/teams/541.png',
        },
        awayTeam: {
          id: 'barca',
          name: 'FC Barcelona',
          shortName: 'FCB',
          sport: 'football',
          logoUrl: 'https://media.api-sports.io/football/teams/529.png',
        },
        dataAvailability: {
          sourceName: this.providerName,
          lastUpdated: 'Actualizado hace 8 min',
          sampleSize: 10,
          isSampleSufficient: true,
          missingFields: [],
        },
        frequencies5: {
          home: {
            sampleSize: 5,
            totalMatchesEvaluated: 5,
            homeTeamWins: 80,
            awayTeamWins: 0,
            draws: 20,
            over25GoalsOrOverPointsRate: 60,
            bothTeamsScoredRate: 60,
            avgGoalsOrPointsScored: 2.4,
            avgGoalsOrPointsConceded: 0.8,
          },
          away: {
            sampleSize: 5,
            totalMatchesEvaluated: 5,
            homeTeamWins: 60,
            awayTeamWins: 20,
            draws: 20,
            over25GoalsOrOverPointsRate: 80,
            bothTeamsScoredRate: 80,
            avgGoalsOrPointsScored: 2.6,
            avgGoalsOrPointsConceded: 1.2,
          },
        },
        frequencies10: {
          home: {
            sampleSize: 10,
            totalMatchesEvaluated: 10,
            homeTeamWins: 70,
            awayTeamWins: 10,
            draws: 20,
            over25GoalsOrOverPointsRate: 70,
            bothTeamsScoredRate: 50,
            avgGoalsOrPointsScored: 2.2,
            avgGoalsOrPointsConceded: 0.9,
          },
          away: {
            sampleSize: 10,
            totalMatchesEvaluated: 10,
            homeTeamWins: 70,
            awayTeamWins: 10,
            draws: 20,
            over25GoalsOrOverPointsRate: 80,
            bothTeamsScoredRate: 70,
            avgGoalsOrPointsScored: 2.5,
            avgGoalsOrPointsConceded: 1.1,
          },
        },
        probabilities: probClasico,
        headToHead: [
          { date: '2026-04-21', competition: 'LaLiga', homeScore: 3, awayScore: 2, winner: 'home' },
          { date: '2026-01-14', competition: 'Supercopa', homeScore: 4, awayScore: 1, winner: 'home' },
          { date: '2025-10-28', competition: 'LaLiga', homeScore: 1, awayScore: 2, winner: 'away' },
        ],
        metrics: [
          { id: 'xg', label: 'Goles Esperados (xG)', homeValue: 2.14, awayValue: 1.88, unit: 'xG', isHigherBetter: true },
          { id: 'possession', label: 'Posesión media', homeValue: 56.4, awayValue: 58.2, unit: '%', isHigherBetter: true },
          { id: 'shots_target', label: 'Tiros a puerta / partido', homeValue: 6.8, awayValue: 6.5, unit: '', isHigherBetter: true },
          { id: 'clean_sheets', label: 'Porterías a cero (%)', homeValue: 40, awayValue: 30, unit: '%', isHigherBetter: true },
        ],
      },
      {
        id: 'fb-2',
        sport: 'football',
        league: { id: 'premier', name: 'Premier League', country: 'Inglaterra', season: '2026/2027', round: 'Jornada 10' },
        date: today,
        time: '18:30',
        status: 'scheduled',
        venue: 'Etihad Stadium (Manchester)',
        homeTeam: {
          id: 'mancity',
          name: 'Manchester City',
          shortName: 'MCI',
          sport: 'football',
          logoUrl: 'https://media.api-sports.io/football/teams/50.png',
        },
        awayTeam: {
          id: 'arsenal',
          name: 'Arsenal FC',
          shortName: 'ARS',
          sport: 'football',
          logoUrl: 'https://media.api-sports.io/football/teams/42.png',
        },
        dataAvailability: {
          sourceName: this.providerName,
          lastUpdated: 'Actualizado hace 15 min',
          sampleSize: 10,
          isSampleSufficient: true,
          missingFields: [],
        },
        frequencies5: {
          home: {
            sampleSize: 5,
            totalMatchesEvaluated: 5,
            homeTeamWins: 80,
            awayTeamWins: 0,
            draws: 20,
            over25GoalsOrOverPointsRate: 80,
            bothTeamsScoredRate: 60,
            avgGoalsOrPointsScored: 2.8,
            avgGoalsOrPointsConceded: 0.8,
          },
          away: {
            sampleSize: 5,
            totalMatchesEvaluated: 5,
            homeTeamWins: 60,
            awayTeamWins: 20,
            draws: 20,
            over25GoalsOrOverPointsRate: 40,
            bothTeamsScoredRate: 40,
            avgGoalsOrPointsScored: 1.8,
            avgGoalsOrPointsConceded: 0.6,
          },
        },
        frequencies10: {
          home: {
            sampleSize: 10,
            totalMatchesEvaluated: 10,
            homeTeamWins: 80,
            awayTeamWins: 10,
            draws: 10,
            over25GoalsOrOverPointsRate: 70,
            bothTeamsScoredRate: 60,
            avgGoalsOrPointsScored: 2.6,
            avgGoalsOrPointsConceded: 0.8,
          },
          away: {
            sampleSize: 10,
            totalMatchesEvaluated: 10,
            homeTeamWins: 70,
            awayTeamWins: 10,
            draws: 20,
            over25GoalsOrOverPointsRate: 50,
            bothTeamsScoredRate: 40,
            avgGoalsOrPointsScored: 1.9,
            avgGoalsOrPointsConceded: 0.7,
          },
        },
        probabilities: probPremier,
        headToHead: [
          { date: '2026-03-31', competition: 'Premier League', homeScore: 0, awayScore: 0, winner: 'draw' },
          { date: '2025-10-08', competition: 'Premier League', homeScore: 1, awayScore: 0, winner: 'home' },
        ],
        metrics: [
          { id: 'xg', label: 'Goles Esperados (xG)', homeValue: 2.31, awayValue: 1.62, unit: 'xG', isHigherBetter: true },
          { id: 'possession', label: 'Posesión media', homeValue: 64.2, awayValue: 53.8, unit: '%', isHigherBetter: true },
          { id: 'shots_target', label: 'Tiros a puerta / partido', homeValue: 7.2, awayValue: 5.1, unit: '', isHigherBetter: true },
        ],
      },
      {
        id: 'fb-3',
        sport: 'football',
        league: { id: 'laliga', name: 'LaLiga EA Sports', country: 'España', season: '2026/2027', round: 'Jornada 11' },
        date: today,
        time: '19:00',
        status: 'scheduled',
        venue: 'Estadio Montilivi (Girona)',
        homeTeam: {
          id: 'girona',
          name: 'Girona FC',
          shortName: 'GIR',
          sport: 'football',
          logoUrl: 'https://media.api-sports.io/football/teams/547.png',
        },
        awayTeam: {
          id: 'leganes',
          name: 'CD Leganés',
          shortName: 'LEG',
          sport: 'football',
          logoUrl: 'https://media.api-sports.io/football/teams/537.png',
        },
        dataAvailability: {
          sourceName: this.providerName,
          lastUpdated: 'Actualizado hace 32 min',
          sampleSize: 8,
          isSampleSufficient: true,
          missingFields: [],
        },
        frequencies5: {
          home: {
            sampleSize: 5,
            totalMatchesEvaluated: 5,
            homeTeamWins: 40,
            awayTeamWins: 40,
            draws: 20,
            over25GoalsOrOverPointsRate: 60,
            bothTeamsScoredRate: 60,
            avgGoalsOrPointsScored: 1.4,
            avgGoalsOrPointsConceded: 1.6,
          },
          away: {
            sampleSize: 5,
            totalMatchesEvaluated: 5,
            homeTeamWins: 20,
            awayTeamWins: 40,
            draws: 40,
            over25GoalsOrOverPointsRate: 20,
            bothTeamsScoredRate: 40,
            avgGoalsOrPointsScored: 0.8,
            avgGoalsOrPointsConceded: 1.2,
          },
        },
        frequencies10: {
          home: {
            sampleSize: 10,
            totalMatchesEvaluated: 8,
            homeTeamWins: 50,
            awayTeamWins: 38,
            draws: 12,
            over25GoalsOrOverPointsRate: 50,
            bothTeamsScoredRate: 50,
            avgGoalsOrPointsScored: 1.5,
            avgGoalsOrPointsConceded: 1.4,
          },
          away: {
            sampleSize: 10,
            totalMatchesEvaluated: 8,
            homeTeamWins: 25,
            awayTeamWins: 50,
            draws: 25,
            over25GoalsOrOverPointsRate: 25,
            bothTeamsScoredRate: 38,
            avgGoalsOrPointsScored: 0.9,
            avgGoalsOrPointsConceded: 1.4,
          },
        },
        probabilities: probGirona,
        headToHead: [
          { date: '2026-05-11', competition: 'LaLiga', homeScore: 1, awayScore: 1, winner: 'draw' },
        ],
        metrics: [
          { id: 'xg', label: 'Goles Esperados (xG)', homeValue: 1.42, awayValue: 0.95, unit: 'xG', isHigherBetter: true },
          { id: 'possession', label: 'Posesión media', homeValue: 54.1, awayValue: 42.6, unit: '%', isHigherBetter: true },
        ],
      },
      {
        id: 'fb-4',
        sport: 'football',
        league: { id: 'copa', name: 'Copa del Rey', country: 'España', season: '2026/2027', round: 'Dieciseisavos' },
        date: today,
        time: '20:00',
        status: 'scheduled',
        venue: 'Estadio San Mamés (Bilbao)',
        homeTeam: {
          id: 'athletic',
          name: 'Athletic Club',
          shortName: 'ATH',
          sport: 'football',
          logoUrl: 'https://media.api-sports.io/football/teams/531.png',
        },
        awayTeam: {
          id: 'rival_menor',
          name: 'CD Diocesano',
          shortName: 'DIO',
          sport: 'football',
          logoUrl: 'https://crests.football-data.org/default.svg',
        },
        dataAvailability: {
          sourceName: this.providerName,
          lastUpdated: 'Actualizado hace 50 min',
          sampleSize: 3,
          isSampleSufficient: false,
          missingFields: ['Goles esperados (xG)', 'Posesión histórica', 'Tiros a puerta'],
        },
        frequencies5: {
          home: {
            sampleSize: 5,
            totalMatchesEvaluated: 3,
            homeTeamWins: 67,
            awayTeamWins: 33,
            draws: 0,
            over25GoalsOrOverPointsRate: 67,
            bothTeamsScoredRate: 33,
            avgGoalsOrPointsScored: 1.7,
            avgGoalsOrPointsConceded: 1.0,
          },
          away: {
            sampleSize: 5,
            totalMatchesEvaluated: 3,
            homeTeamWins: 33,
            awayTeamWins: 67,
            draws: 0,
            over25GoalsOrOverPointsRate: 33,
            bothTeamsScoredRate: 33,
            avgGoalsOrPointsScored: 0.7,
            avgGoalsOrPointsConceded: 2.0,
          },
        },
        frequencies10: {
          home: {
            sampleSize: 10,
            totalMatchesEvaluated: 3,
            homeTeamWins: 67,
            awayTeamWins: 33,
            draws: 0,
            over25GoalsOrOverPointsRate: 67,
            bothTeamsScoredRate: 33,
            avgGoalsOrPointsScored: 1.7,
            avgGoalsOrPointsConceded: 1.0,
          },
          away: {
            sampleSize: 10,
            totalMatchesEvaluated: 3,
            homeTeamWins: 33,
            awayTeamWins: 67,
            draws: 0,
            over25GoalsOrOverPointsRate: 33,
            bothTeamsScoredRate: 33,
            avgGoalsOrPointsScored: 0.7,
            avgGoalsOrPointsConceded: 2.0,
          },
        },
        probabilities: probInsuficiente,
        headToHead: [],
        metrics: [],
      },
    ];
  }

  // ============================================================================
  // DATOS SIMULADOS DE BALONCESTO CON ESCUDOS Y FECHA ACTUAL
  // ============================================================================
  private getBasketballMatches(dayOffset: number = 0): MatchDetail[] {
    const target = new Date();
    target.setDate(target.getDate() + dayOffset);
    const nyDateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const today = nyDateFormatter.format(target);

    const probNba1 = calculateBasketballProbabilities(
      { pace: 100.8, offensiveRating: 121.2, defensiveRating: 110.4, matchesPlayed: 14 },
      { pace: 99.4, offensiveRating: 114.5, defensiveRating: 115.8, matchesPlayed: 14 }
    );

    const probEuroleague = calculateBasketballProbabilities(
      { pace: 82.4, offensiveRating: 116.2, defensiveRating: 107.5, matchesPlayed: 10 },
      { pace: 81.6, offensiveRating: 113.8, defensiveRating: 109.2, matchesPlayed: 10 },
      { avgPace: 82.0, avgOffensiveRating: 112.0, homeCourtAdvantagePoints: 3.5 }
    );

    return [
      {
        id: 'bb-1',
        sport: 'basketball',
        league: { id: 'nba', name: 'NBA', country: 'Estados Unidos', season: '2026/2027' },
        date: today,
        time: '01:30',
        status: 'scheduled',
        venue: 'TD Garden (Boston)',
        homeTeam: {
          id: 'celtics',
          name: 'Boston Celtics',
          shortName: 'BOS',
          sport: 'basketball',
          logoUrl: 'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg',
        },
        awayTeam: {
          id: 'lakers',
          name: 'Los Angeles Lakers',
          shortName: 'LAL',
          sport: 'basketball',
          logoUrl: 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg',
        },
        dataAvailability: {
          sourceName: this.providerName,
          lastUpdated: 'Actualizado hace 12 min',
          sampleSize: 10,
          isSampleSufficient: true,
          missingFields: [],
        },
        frequencies5: {
          home: {
            sampleSize: 5,
            totalMatchesEvaluated: 5,
            homeTeamWins: 80,
            awayTeamWins: 20,
            over25GoalsOrOverPointsRate: 80,
            avgGoalsOrPointsScored: 122.4,
            avgGoalsOrPointsConceded: 108.6,
          },
          away: {
            sampleSize: 5,
            totalMatchesEvaluated: 5,
            homeTeamWins: 60,
            awayTeamWins: 40,
            over25GoalsOrOverPointsRate: 60,
            avgGoalsOrPointsScored: 114.2,
            avgGoalsOrPointsConceded: 116.0,
          },
        },
        frequencies10: {
          home: {
            sampleSize: 10,
            totalMatchesEvaluated: 10,
            homeTeamWins: 80,
            awayTeamWins: 20,
            over25GoalsOrOverPointsRate: 70,
            avgGoalsOrPointsScored: 120.5,
            avgGoalsOrPointsConceded: 109.8,
          },
          away: {
            sampleSize: 10,
            totalMatchesEvaluated: 10,
            homeTeamWins: 60,
            awayTeamWins: 40,
            over25GoalsOrOverPointsRate: 70,
            avgGoalsOrPointsScored: 115.1,
            avgGoalsOrPointsConceded: 114.8,
          },
        },
        probabilities: probNba1,
        headToHead: [
          { date: '2026-02-02', competition: 'NBA', homeScore: 126, awayScore: 115, winner: 'home' },
          { date: '2025-12-25', competition: 'NBA', homeScore: 115, awayScore: 120, winner: 'away' },
        ],
        metrics: [
          { id: 'pace', label: 'Ritmo (Posesiones / 48m)', homeValue: 100.8, awayValue: 99.4, unit: 'pos', isHigherBetter: true },
          { id: 'off_rtg', label: 'Eficiencia Ofensiva (Puntos/100 pos)', homeValue: 121.2, awayValue: 114.5, unit: 'pts', isHigherBetter: true },
          { id: 'def_rtg', label: 'Eficiencia Defensiva (Puntos recibidos/100 pos)', homeValue: 110.4, awayValue: 115.8, unit: 'pts', isHigherBetter: false },
          { id: 'three_pct', label: 'Efectividad en triples (%)', homeValue: 38.6, awayValue: 35.2, unit: '%', isHigherBetter: true },
        ],
      },
      {
        id: 'bb-2',
        sport: 'basketball',
        league: { id: 'euroleague', name: 'Turkish Airlines EuroLeague', country: 'Europa', season: '2026/2027' },
        date: today,
        time: '20:45',
        status: 'scheduled',
        venue: 'WiZink Center (Madrid)',
        homeTeam: {
          id: 'rmadrid_b',
          name: 'Real Madrid Baloncesto',
          shortName: 'RMB',
          sport: 'basketball',
          logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/240px-Real_Madrid_CF.svg.png',
        },
        awayTeam: {
          id: 'barca_b',
          name: 'FC Barcelona Basket',
          shortName: 'FCBB',
          sport: 'basketball',
          logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/240px-FC_Barcelona_%28crest%29.svg.png',
        },
        dataAvailability: {
          sourceName: this.providerName,
          lastUpdated: 'Actualizado hace 25 min',
          sampleSize: 10,
          isSampleSufficient: true,
          missingFields: [],
        },
        frequencies5: {
          home: {
            sampleSize: 5,
            totalMatchesEvaluated: 5,
            homeTeamWins: 80,
            awayTeamWins: 20,
            over25GoalsOrOverPointsRate: 60,
            avgGoalsOrPointsScored: 88.4,
            avgGoalsOrPointsConceded: 81.2,
          },
          away: {
            sampleSize: 5,
            totalMatchesEvaluated: 5,
            homeTeamWins: 60,
            awayTeamWins: 40,
            over25GoalsOrOverPointsRate: 40,
            avgGoalsOrPointsScored: 84.6,
            avgGoalsOrPointsConceded: 82.0,
          },
        },
        frequencies10: {
          home: {
            sampleSize: 10,
            totalMatchesEvaluated: 10,
            homeTeamWins: 70,
            awayTeamWins: 30,
            over25GoalsOrOverPointsRate: 50,
            avgGoalsOrPointsScored: 87.2,
            avgGoalsOrPointsConceded: 80.8,
          },
          away: {
            sampleSize: 10,
            totalMatchesEvaluated: 10,
            homeTeamWins: 60,
            awayTeamWins: 40,
            over25GoalsOrOverPointsRate: 50,
            avgGoalsOrPointsScored: 83.9,
            avgGoalsOrPointsConceded: 81.5,
          },
        },
        probabilities: probEuroleague,
        headToHead: [
          { date: '2026-05-18', competition: 'EuroLeague Final Four', homeScore: 89, awayScore: 83, winner: 'home' },
          { date: '2026-01-10', competition: 'Liga ACB', homeScore: 91, awayScore: 86, winner: 'home' },
        ],
        metrics: [
          { id: 'pace', label: 'Ritmo (Posesiones / 40m)', homeValue: 82.4, awayValue: 81.6, unit: 'pos', isHigherBetter: true },
          { id: 'off_rtg', label: 'Eficiencia Ofensiva', homeValue: 116.2, awayValue: 113.8, unit: 'pts', isHigherBetter: true },
          { id: 'rebounds', label: 'Rebotes por partido', homeValue: 37.8, awayValue: 35.1, unit: '', isHigherBetter: true },
        ],
      },
    ];
  }
}
