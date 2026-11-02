/**
 * SERVICIO CENTRAL DE INTEGRACIÓN CON GOOGLE GEMINI (PLAN GRATUITO)
 * 
 * Reglas de seguridad y diseño:
 * 1. Solo se ejecuta en el servidor (Next.js API route).
 * 2. Utiliza el SDK oficial @google/genai.
 * 3. Nunca envía datos personales ni texto libre; solo el JSON estadístico.
 * 4. Botón manual y caché para respetar el límite gratuito.
 * 5. Reintentos ante 429 con backoff y fallback automático al explicador por plantillas.
 */

import { GoogleGenAI } from '@google/genai';
import type { MatchDetail } from '../../core/models.ts';
import { analyzeMatchMarkets, type MatchMarketAnalysis } from '../../core/stats/marketCalculator.ts';
import { TemplateExplainer, type StructuredAnalysisResponse } from '../../core/stats/templateExplainer.ts';
import { GeminiQuotaTracker, type GeminiQuotaStatus } from '../cache/geminiQuotaTracker.ts';
import { GeminiValidator } from './geminiValidator.ts';
import { RealOddsService } from './realOddsService.ts';
import { DetailedStatsService } from './detailedStatsService.ts';
import { CacheManager } from '../cache/cacheManager.ts';
import { logError, logInfo } from '../logger.ts';

export interface AiAnalysisResult {
  success: boolean;
  source: 'gemini' | 'template';
  data: StructuredAnalysisResponse;
  quota: GeminiQuotaStatus;
  fallbackReason?: string;
  isCached: boolean;
}

export class GeminiService {
  private static readonly SYSTEM_PROMPT = `Eres un analista deportivo estadístico dentro de una web personal. Recibirás en JSON los datos de UN partido: estadísticas de temporada, clasificaciones, mercados principales (1X2, Over/Under 2.5), córners, remates a puerta (totales y jugadores clave), goles por equipo y tarjetas, junto con cuotas reales de Bet365 / Winamax si existen. Tu trabajo es explicar y valorar, no inventar. REGLAS: usa SOLO los datos del JSON; si falta algo, escribe 'Sin datos' y no lo supongas; no uses conocimiento propio sobre plantillas o lesiones; no cambies ni recalcules los números; para cada mercado evalúa cuota justa vs cuota real y destaca opciones con valor estadístico positivo (tanto en ganador/goles como en córners, remates a puerta de delanteros o tarjetas); nunca digas 'apuesta segura' ni prometas ganancias; menciona lo que el modelo no considera como límite; en el array 'mercados' incluye las selecciones analizadas con los campos 'mercado', 'categoria' ('main'|'team_goals'|'corners'|'shots'|'cards'), 'probModelo', 'cuotaJusta', 'cuotaReal' y 'lectura'; español claro y sencillo, máximo 300 palabras. Termina siempre con: 'Estimación estadística, no resultado seguro.'`;

  /**
   * Genera o recupera el análisis explicativo para un partido.
   */
  public static async analyzeMatch(
    match: MatchDetail,
    forceRefresh: boolean = false
  ): Promise<AiAnalysisResult> {
    // Obtener cuotas reales oficiales de casas de apuestas (Bet365 / Winamax)
    const realOdds = await RealOddsService.getMatchRealOdds(match);
    const marketAnalysis = analyzeMatchMarkets(match, realOdds || undefined);
    const quota = GeminiQuotaTracker.getStatus();

    // 1. Clave de caché que depende del contenido de los datos (no regenerar si no cambian)
    const dataFingerprint = `${match.id}_${match.probabilities.homeWinProb}_${match.probabilities.awayWinProb}_${realOdds?.oneXTwo?.home || 'no_odds'}_${match.date}`;
    const cacheKey = `gemini_analysis_${dataFingerprint}`;

    if (!forceRefresh) {
      const cached = CacheManager.get<StructuredAnalysisResponse>(cacheKey);
      if (cached) {
        return {
          success: true,
          source: cached.isAiGenerated ? 'gemini' : 'template',
          data: cached,
          quota,
          isCached: true,
        };
      }
    }

    // 2. Comprobar disponibilidad de API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logInfo('GeminiService', 'No se ha detectado GEMINI_API_KEY. Usando explicador por plantillas.');
      const templateData = TemplateExplainer.generateAnalysis(marketAnalysis, match);
      return {
        success: true,
        source: 'template',
        data: templateData,
        quota,
        fallbackReason: 'Clave GEMINI_API_KEY no configurada en .env.local.',
        isCached: false,
      };
    }

    // 3. Comprobar cuota diaria gratuita
    if (!GeminiQuotaTracker.canMakeCall()) {
      logInfo('GeminiService', 'Límite diario de Gemini alcanzado. Usando explicador por plantillas.');
      const templateData = TemplateExplainer.generateAnalysis(marketAnalysis, match);
      return {
        success: true,
        source: 'template',
        data: templateData,
        quota,
        fallbackReason: `Se ha alcanzado el límite diario gratuito (${quota.dailyLimit} análisis/día).`,
        isCached: false,
      };
    }

    // 4. Preparar el JSON estricto para Gemini y recolectar números válidos para el validador
    const freqHome = match.frequencies10?.home || match.frequencies5.home;
    const freqAway = match.frequencies10?.away || match.frequencies5.away;

    const allowedNumbers: number[] = [
      match.probabilities.homeWinProb,
      match.probabilities.awayWinProb,
      match.probabilities.drawProb || 0,
      match.probabilities.expectedHomeScore,
      match.probabilities.expectedAwayScore,
      freqHome.homeTeamWins,
      freqHome.awayTeamWins,
      freqHome.draws || 0,
      freqHome.totalMatchesEvaluated || 0,
      freqHome.winsCount || 0,
      freqHome.drawsCount || 0,
      freqHome.lossesCount || 0,
      freqHome.avgGoalsOrPointsScored,
      freqHome.avgGoalsOrPointsConceded,
      freqAway.homeTeamWins,
      freqAway.awayTeamWins,
      freqAway.draws || 0,
      freqAway.totalMatchesEvaluated || 0,
      freqAway.winsCount || 0,
      freqAway.drawsCount || 0,
      freqAway.lossesCount || 0,
      freqAway.avgGoalsOrPointsScored,
      freqAway.avgGoalsOrPointsConceded,
      freqHome.over25GoalsOrOverPointsRate,
      freqAway.over25GoalsOrOverPointsRate,
    ];

    let detailedStats = null;
    if (match.sport === 'football') {
      detailedStats = DetailedStatsService.getDetailedStats(match);
      allowedNumbers.push(
        detailedStats.corners.homeAvg,
        detailedStats.corners.awayAvg,
        detailedStats.corners.totalExpected,
        detailedStats.corners.probOver85,
        detailedStats.corners.probOver95,
        detailedStats.shotsOnTarget.homeAvg,
        detailedStats.shotsOnTarget.awayAvg,
        detailedStats.shotsOnTarget.totalExpected,
        detailedStats.shotsOnTarget.probOver75,
        detailedStats.shotsOnTarget.probOver85,
        detailedStats.cards.homeAvgYellow,
        detailedStats.cards.awayAvgYellow,
        detailedStats.cards.totalExpectedYellow,
        detailedStats.cards.probOver35Cards,
        detailedStats.cards.probOver45Cards,
        detailedStats.teamGoals.home.avgScored,
        detailedStats.teamGoals.away.avgScored,
        detailedStats.teamGoals.home.probOver05,
        detailedStats.teamGoals.home.probOver15,
        detailedStats.teamGoals.away.probOver05,
        detailedStats.teamGoals.away.probOver15
      );

      for (const player of detailedStats.shotsOnTarget.keyPlayers) {
        allowedNumbers.push(player.avgShotsOnTarget, player.probOver05Shots, player.probOver15Shots);
      }
    }

    for (const m of marketAnalysis.markets) {
      if (m.margenCasa != null) allowedNumbers.push(m.margenCasa);
      for (const item of m.items) {
        if (item.cuotaJusta != null) allowedNumbers.push(item.cuotaJusta);
        if (item.cuotaReal != null) allowedNumbers.push(item.cuotaReal);
        if (item.probImplicita != null) allowedNumbers.push(item.probImplicita);
        if (item.diferenciaCuota != null) allowedNumbers.push(item.diferenciaCuota);
      }
    }

    const payload = {
      partido: {
        deporte: match.sport,
        competicion: match.league.name,
        local: match.homeTeam.name,
        visitante: match.awayTeam.name,
        fecha: match.date,
        horario: match.time,
      },
      casasApuestasReferencia: realOdds ? 'Bet365 / Winamax' : 'Sin datos de cuotas de casas',
      estadisticasAvanzadasMercados: detailedStats
        ? {
            corners: {
              mediaEsperadaPartido: detailedStats.corners.totalExpected,
              probabilidadMas85: `${detailedStats.corners.probOver85}%`,
              probabilidadMas95: `${detailedStats.corners.probOver95}%`,
            },
            rematesAPuerta: {
              mediaEsperadaPartido: detailedStats.shotsOnTarget.totalExpected,
              probabilidadMas75: `${detailedStats.shotsOnTarget.probOver75}%`,
              delanterosClave: detailedStats.shotsOnTarget.keyPlayers.map((p) => ({
                jugador: p.name,
                equipo: p.teamName,
                mediaTirosPuerta: p.avgShotsOnTarget,
                probabilidadAlMenosUnTiro: `${p.probOver05Shots}%`,
              })),
            },
            tarjetas: {
              mediaEsperadaPartido: detailedStats.cards.totalExpectedYellow,
              probabilidadMas35: `${detailedStats.cards.probOver35Cards}%`,
              probabilidadMas45: `${detailedStats.cards.probOver45Cards}%`,
            },
          }
        : null,
      rendimientoTemporadaCompeticion: {
        competicion: match.league.name,
        local: {
          partidosJugados: freqHome.totalMatchesEvaluated,
          victoriasPct: freqHome.homeTeamWins,
          empatesPct: freqHome.draws,
          derrotasPct: freqHome.awayTeamWins,
          mediaAnotada: freqHome.avgGoalsOrPointsScored,
          mediaRecibida: freqHome.avgGoalsOrPointsConceded,
        },
        visitante: {
          partidosJugados: freqAway.totalMatchesEvaluated,
          victoriasPct: freqAway.homeTeamWins,
          empatesPct: freqAway.draws,
          derrotasPct: freqAway.awayTeamWins,
          mediaAnotada: freqAway.avgGoalsOrPointsScored,
          mediaRecibida: freqAway.avgGoalsOrPointsConceded,
        },
      },
      rendimientoProbabilidad: {
        probabilidadVictoriaLocal: match.probabilities.homeWinProb,
        probabilidadEmpate: match.probabilities.drawProb,
        probabilidadVictoriaVisitante: match.probabilities.awayWinProb,
        promedioAnotadoLocal: match.probabilities.expectedHomeScore,
        promedioAnotadoVisitante: match.probabilities.expectedAwayScore,
        confianzaCodigo: marketAnalysis.confidence.level,
      },
      mercadosYCuotasCasas: marketAnalysis.markets.map((m) => ({
        nombre: m.marketName,
        margenCasa: m.margenCasa != null ? `${m.margenCasa}%` : 'Sin datos',
        selecciones: m.items.map((i) => ({
          seleccion: i.selection,
          probabilidadModelo: `${i.probModelo}%`,
          cuotaJusta: i.cuotaJusta != null ? i.cuotaJusta : 'Sin datos',
          cuotaRealCasas: i.cuotaReal != null ? i.cuotaReal : 'Sin datos',
          probabilidadImplicitaCasa: i.probImplicita != null ? `${i.probImplicita}%` : 'Sin datos',
          diferenciaValor: i.diferenciaCuota != null ? i.diferenciaCuota : 'Sin datos',
        })),
      })),
    };

    // 5. Llamada a Gemini con reintentos y backoff exponencial para error 429
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    let rawResponseText = '';
    let lastError: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `DATOS DEL PARTIDO, ESTADÍSTICAS DETALLADAS (CÓRNERS, REMATES A PUERTA, TARJETAS, GOLES POR EQUIPO) Y CUOTAS DE CASAS (Bet365 / Winamax) EN JSON:\n${JSON.stringify(payload, null, 2)}\n\nGenera el análisis en formato JSON estricto con los campos: resumen, porQue (lista), mercados (lista con mercado, categoria, probModelo, cuotaJusta, cuotaReal, lectura), riesgos (lista) y aviso. Analiza cómo comparan las cuotas frente a las cuotas justas en 1X2, córners, tiros a puerta de delanteros y tarjetas.`,
          config: {
            systemInstruction: this.SYSTEM_PROMPT,
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });

        rawResponseText = response.text || '';
        if (rawResponseText) break;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err);

        // Si es 429 (límite de velocidad por segundo), esperar y reintentar una vez
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          const waitTime = attempt * 1500;
          logInfo('GeminiService', `Rate limit 429 en intento ${attempt}. Esperando ${waitTime}ms...`);
          await new Promise((res) => setTimeout(res, waitTime));
        } else {
          // Errores de región, clave inválida o bloqueo: salir de inmediato al fallback
          break;
        }
      }
    }

    // 6. Si no hubo respuesta válida de Gemini, fallback transparente a plantillas
    if (!rawResponseText) {
      logError('GeminiService:generateContent', lastError);
      const fallbackReason = String(lastError?.message || 'Error de comunicación con el servicio de IA');
      const templateData = TemplateExplainer.generateAnalysis(marketAnalysis, match);
      return {
        success: true,
        source: 'template',
        data: templateData,
        quota,
        fallbackReason: fallbackReason.includes('API_KEY_INVALID')
          ? 'Clave de API no válida o expirada. Usando explicador de respaldo.'
          : fallbackReason.includes('User location is not supported')
            ? 'Región no soportada temporalmente por la API de Google. Usando explicador de respaldo.'
            : 'Límite temporal o error en la API de Google. Usando explicador de respaldo.',
        isCached: false,
      };
    }

    // 7. Validación obligatoria anti-alucinaciones
    const validation = GeminiValidator.validate(
      rawResponseText,
      allowedNumbers,
      marketAnalysis.confidence.level
    );

    if (!validation.isValid || !validation.sanitizedData) {
      logInfo(
        'GeminiService:validator',
        `Respuesta descartada por validación: ${validation.error}. Usando explicador por plantillas.`
      );
      const templateData = TemplateExplainer.generateAnalysis(marketAnalysis, match);
      return {
        success: true,
        source: 'template',
        data: templateData,
        quota,
        fallbackReason: `Filtro de integridad: ${validation.error || 'Respuesta no válida'}.`,
        isCached: false,
      };
    }

    // 8. Éxito: registrar llamada en la cuota diaria y guardar en caché
    const updatedQuota = GeminiQuotaTracker.recordCall();
    CacheManager.set(cacheKey, validation.sanitizedData, 86400); // 24 horas de caché

    return {
      success: true,
      source: 'gemini',
      data: validation.sanitizedData,
      quota: updatedQuota,
      isCached: false,
    };
  }
}

