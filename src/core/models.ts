/**
 * MODELOS DE DATOS INTERNOS ESTANDARIZADOS
 * 
 * Principio de arquitectura: Todos los proveedores de datos (APIs de fútbol, 
 * baloncesto o datos locales) deben mapear sus respuestas a estos tipos.
 * Esto garantiza que la interfaz de usuario nunca dependa de un proveedor específico.
 */

export type SportType = 'football' | 'basketball';

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  sport: SportType;
}

export interface PlayerStats {
  minutesPlayed?: number;
  points?: number; // Baloncesto
  rebounds?: number; // Baloncesto
  assists?: number;
  goals?: number; // Fútbol
  shotsOnTarget?: number; // Fútbol
  cards?: { yellow: number; red: number };
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  position: string;
  jerseyNumber?: number;
  statsLast5: PlayerStats[];
  isInjured?: boolean;
}

export interface MatchScore {
  home: number;
  away: number;
  periodScores?: {
    firstHalf?: { home: number; away: number };
    secondHalf?: { home: number; away: number };
    quarters?: Array<{ home: number; away: number }>; // Para baloncesto (Q1, Q2, Q3, Q4)
  };
}

export interface DataAvailability {
  sourceName: string;        // p. ej. "API-Football (v3)" o "Simulador Oficial"
  lastUpdated: string;       // Formato ISO o texto amigable
  sampleSize: number;        // Cuántos partidos reales respaldan los cálculos (ej. 10)
  isSampleSufficient: boolean; // Si es >= 5 es true, si es < 5 es false
  missingFields: string[];   // Lista de métricas que no están disponibles
}

export interface TeamSeasonRecord {
  teamName: string;
  competitionName: string;
  season: string;
  matchesPlayed: number;
  wins: number;
  draws?: number;
  losses: number;
  winRate: number;
  drawRate?: number;
  lossRate: number;
  goalsOrPointsScored: number;
  goalsOrPointsConceded: number;
  avgGoalsOrPointsScored: number;
  avgGoalsOrPointsConceded: number;
  over25GoalsOrPointsRate?: number;
  rank?: number;
}

export interface HistoricalFrequencies {
  sampleSize: number;
  totalMatchesEvaluated: number;
  homeTeamWins: number;
  awayTeamWins: number;
  draws?: number; // Solo fútbol
  winsCount?: number;
  drawsCount?: number;
  lossesCount?: number;

  // Frecuencias específicas
  over25GoalsOrOverPointsRate: number; // Porcentaje (0 - 100)
  bothTeamsScoredRate?: number;        // Porcentaje (solo fútbol)
  avgGoalsOrPointsScored: number;
  avgGoalsOrPointsConceded: number;
}

export interface EstimatedProbabilities {
  homeWinProb: number;       // Porcentaje (0 - 100)
  drawProb?: number;          // Porcentaje (0 - 100, opcional en fútbol)
  awayWinProb: number;       // Porcentaje (0 - 100)

  expectedHomeScore: number; // Goles esperados (modelo) o puntos esperados
  expectedAwayScore: number;

  modelName: string;         // p. ej. "Poisson Bivariado con Ajuste Local"
  confidenceRating: 'alta' | 'media' | 'baja' | 'insuficiente';
  explanationText: string;   // Explicación en lenguaje llano del cálculo
}

export interface ComparisonMetric {
  id: string;
  label: string;
  homeValue?: number | null;
  awayValue?: number | null;
  unit?: string;
  isHigherBetter?: boolean;
}

export interface MatchDetail {
  id: string;
  sport: SportType;
  league: {
    id: string;
    name: string;
    country: string;
    season: string;
    round?: string; // p. ej. "Jornada 11", "Fase de Liga (J3)"
  };
  date: string;              // Fecha (YYYY-MM-DD)
  time: string;              // Hora (HH:mm)
  status: MatchStatus;
  kickoffTimestamp?: number; // Timestamp Unix en milisegundos del inicio del encuentro
  venue?: string;
  externalUrl?: string;      // Enlace oficial de verificación (p. ej. Flashscore.es)
  homeTeam: Team;
  awayTeam: Team;
  score?: MatchScore;

  // Transparencia y calidad de datos
  dataAvailability: DataAvailability;

  // Capa estadística
  frequencies5: {
    home: HistoricalFrequencies;
    away: HistoricalFrequencies;
  };
  frequencies10: {
    home: HistoricalFrequencies;
    away: HistoricalFrequencies;
  };

  // Estimación probabilística (separada visualmente)
  probabilities: EstimatedProbabilities;

  // Comparativa frente a frente (H2H)
  headToHead: Array<{
    date: string;
    competition: string;
    homeScore: number;
    awayScore: number;
    winner: 'home' | 'away' | 'draw';
  }>;

  // Métricas avanzadas para barras comparativas
  metrics: ComparisonMetric[];

  // Rendimiento verídico en la temporada y competición actual
  seasonStats?: {
    home: TeamSeasonRecord | null;
    away: TeamSeasonRecord | null;
  };
}

export interface ApiQuotaStatus {
  dailyLimit: number;
  consumedToday: number;
  remainingToday: number;
  percentageUsed: number;
  isBlockedDueToLimit: boolean;
  lastResetTime: string;
}
