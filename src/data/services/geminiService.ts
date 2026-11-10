/**
 * SERVICIO CENTRAL DE INTEGRACIÓN CON IA Y CONSENSO DUAL (PLANES 100% GRATUITOS)
 * 
 * Motores de Inteligencia Artificial utilizados:
 * 1. Google Gemini (Google AI Studio - API 100% Gratuita).
 * 2. Meta Llama 3.3 70B (Groq - API 100% Gratuita permanente).
 * 
 * Arquitectura de Consenso:
 * - Cuando ambas claves están disponibles, se ejecutan en paralelo de forma independiente.
 * - La aplicación cruza los pronósticos y solo da máxima prioridad a los mercados en los que
 *   AMBOS modelos han alcanzado un acuerdo unánime.
 * - Si alguna API falla o alcanza su límite, la otra toma el relevo automáticamente (failover).
 * - Si ninguna está disponible, se activa el Explicador Estadístico por Plantillas.
 */

import { GoogleGenAI } from '@google/genai';
import type { MatchDetail } from '../../core/models.ts';
import { analyzeMatchMarkets, type MatchMarketAnalysis } from '../../core/stats/marketCalculator.ts';
import { TemplateExplainer, type StructuredAnalysisResponse } from '../../core/stats/templateExplainer.ts';
import { GeminiQuotaTracker, type GeminiQuotaStatus } from '../cache/geminiQuotaTracker.ts';
import { GeminiValidator } from './geminiValidator.ts';
import { RealOddsService } from './realOddsService.ts';
import { DetailedStatsService } from './detailedStatsService.ts';
import { GroqLlamaService } from './groqLlamaService.ts';
import { CacheManager } from '../cache/cacheManager.ts';
import { logError, logInfo } from '../logger.ts';

export interface AiAnalysisResult {
  success: boolean;
  source: 'consensus' | 'gemini' | 'llama' | 'template';
  data: StructuredAnalysisResponse;
  quota: GeminiQuotaStatus;
  fallbackReason?: string;
  isCached: boolean;
}

export class GeminiService {
  private static readonly SYSTEM_PROMPT = `Eres un analista deportivo estadístico dentro de una web personal. Recibirás en JSON los datos de UN partido: estadísticas de temporada, clasificaciones, mercados y cuotas oficiales de Bet365 y Winamax. Tu trabajo es explicar qué es lo más factible que suceda.
REGLAS ESTRICTAS:
1. PROHIBIDO: NUNCA menciones 'cuota justa' ni uses el término 'cuota justa' (el usuario no quiere saber nada de cuota justa).
2. Usa SOLO los datos del JSON; si falta la cuota, escribe 'Sin datos' y no la supongas.
3. Para cada cuota que cites, indica si es de Bet365 o de Winamax.
4. En el array 'mercados', selecciona ÚNICAMENTE entre 4 y 6 pronósticos que consideres MÁS FACTIBLES de que sucedan (aquellos con mayor probabilidad estimada en ganador, goles, córners, remates de delanteros o tarjetas).
5. Para cada mercado incluye: 'mercado', 'categoria' ('main'|'team_goals'|'corners'|'shots'|'cards'), 'probModelo', 'cuotaReal', 'casaApuesta' ('Bet365' o 'Winamax') y 'lectura'.
6. Nunca digas 'apuesta segura' ni prometas ganancias; menciona imprevistos como bajas o motivación como límites.
7. Español claro y conciso, máximo 280 palabras. Termina siempre con: 'Estimación estadística, no resultado seguro.'`;

  /**
   * Genera o recupera el análisis explicativo para un partido con consenso dual de IAs gratuitas.
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
    const cacheKey = `ai_analysis_${dataFingerprint}`;

    if (!forceRefresh) {
      const cached = CacheManager.get<StructuredAnalysisResponse>(cacheKey);
      if (cached) {
        let source: 'consensus' | 'gemini' | 'llama' | 'template' = 'template';
        if (cached.consensusInfo?.isFullConsensus || (cached.consensusInfo?.modelsAgreed && cached.consensusInfo.modelsAgreed.length > 1)) {
          source = 'consensus';
        } else if (cached.isAiGenerated) {
          source = 'gemini';
        }
        return {
          success: true,
          source,
          data: cached,
          quota,
          isCached: true,
        };
      }
    }

    // 2. Comprobar disponibilidad de los motores de IA gratuitos
    const apiKey = process.env.GEMINI_API_KEY;
    const hasGemini = Boolean(apiKey && GeminiQuotaTracker.canMakeCall());
    const hasLlama = GroqLlamaService.isAvailable();

    if (!hasGemini && !hasLlama) {
      logInfo('GeminiService', 'Ni GEMINI_API_KEY ni GROQ_API_KEY están activas. Usando explicador de respaldo por plantillas.');
      const templateData = TemplateExplainer.generateAnalysis(marketAnalysis, match);
      return {
        success: true,
        source: 'template',
        data: templateData,
        quota,
        fallbackReason: 'Claves de IA no configuradas. Usando explicador estadístico por plantillas.',
        isCached: false,
      };
    }

    // 3. Preparar el JSON estricto y recolectar números válidos para el validador anti-alucinaciones
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
        selecciones: m.items.map((i) => ({
          seleccion: i.selection,
          probabilidadModelo: `${i.probModelo}%`,
          cuotaRealCasas: i.cuotaReal != null ? i.cuotaReal : 'Sin datos',
          casaApuesta: i.casaApuesta || 'Bet365',
        })),
      })),
    };

    // 4. Modo Consenso Dual: Si están activas Gemini y Llama 3.3, consultamos ambas
    if (hasGemini && hasLlama) {
      logInfo('GeminiService', 'Iniciando análisis cruzado de consenso: Google Gemini + Meta Llama 3.3...');
      const [geminiRes, llamaRes] = await Promise.allSettled([
        this.callGemini(apiKey!, payload, allowedNumbers, marketAnalysis.confidence.level),
        GroqLlamaService.analyze(payload, allowedNumbers, marketAnalysis.confidence.level, this.SYSTEM_PROMPT),
      ]);

      const geminiData = geminiRes.status === 'fulfilled' ? geminiRes.value : null;
      const llamaData = llamaRes.status === 'fulfilled' ? llamaRes.value : null;

      if (geminiData && llamaData) {
        GeminiQuotaTracker.recordCall();
        const consensusData = this.mergeConsensus(geminiData, llamaData, marketAnalysis.confidence.level);
        CacheManager.set(cacheKey, consensusData, 86400);
        return {
          success: true,
          source: 'consensus',
          data: consensusData,
          quota: GeminiQuotaTracker.getStatus(),
          isCached: false,
        };
      } else if (geminiData) {
        GeminiQuotaTracker.recordCall();
        CacheManager.set(cacheKey, geminiData, 86400);
        return {
          success: true,
          source: 'gemini',
          data: geminiData,
          quota: GeminiQuotaTracker.getStatus(),
          isCached: false,
        };
      } else if (llamaData) {
        CacheManager.set(cacheKey, llamaData, 86400);
        return {
          success: true,
          source: 'llama',
          data: llamaData,
          quota,
          isCached: false,
        };
      }
    }

    // 5. Modo Motor Individual: Solo Gemini
    if (hasGemini) {
      const geminiData = await this.callGemini(apiKey!, payload, allowedNumbers, marketAnalysis.confidence.level);
      if (geminiData) {
        GeminiQuotaTracker.recordCall();
        CacheManager.set(cacheKey, geminiData, 86400);
        return {
          success: true,
          source: 'gemini',
          data: geminiData,
          quota: GeminiQuotaTracker.getStatus(),
          isCached: false,
        };
      }
    }

    // 6. Modo Motor Individual: Solo Llama 3.3
    if (hasLlama) {
      const llamaData = await GroqLlamaService.analyze(payload, allowedNumbers, marketAnalysis.confidence.level, this.SYSTEM_PROMPT);
      if (llamaData) {
        CacheManager.set(cacheKey, llamaData, 86400);
        return {
          success: true,
          source: 'llama',
          data: llamaData,
          quota,
          isCached: false,
        };
      }
    }

    // 7. Fallback transparente a plantillas si los modelos fallaron
    const templateData = TemplateExplainer.generateAnalysis(marketAnalysis, match);
    return {
      success: true,
      source: 'template',
      data: templateData,
      quota,
      fallbackReason: 'Límite temporal o error en las APIs de IA. Usando explicador estadístico por plantillas.',
      isCached: false,
    };
  }

  /**
   * Ejecuta la consulta al SDK oficial de Google Gemini con reintentos para error 429.
   */
  private static async callGemini(
    apiKey: string,
    payload: any,
    allowedNumbers: number[],
    codeConfidence: 'alta' | 'media' | 'baja'
  ): Promise<StructuredAnalysisResponse | null> {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    let rawResponseText = '';

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `DATOS DEL PARTIDO, ESTADÍSTICAS DETALLADAS (CÓRNERS, REMATES A PUERTA, TARJETAS, GOLES POR EQUIPO) Y CUOTAS DE CASAS (Bet365 / Winamax) EN JSON:\n${JSON.stringify(payload, null, 2)}\n\nGenera el análisis en formato JSON estricto con los campos: resumen, porQue (lista), mercados (lista con mercado, categoria, probModelo, cuotaReal, casaApuesta, lectura), riesgos (lista) y aviso. IMPORTANTE: En el array 'mercados' pon ÚNICAMENTE entre 4 y 6 pronósticos que la IA y las estadísticas consideren MÁS FACTIBLES de que sucedan. Prohibido mencionar 'cuota justa'.`,
          config: {
            systemInstruction: this.SYSTEM_PROMPT,
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });

        rawResponseText = response.text || '';
        if (rawResponseText) break;
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          const waitTime = attempt * 1500;
          logInfo('GeminiService', `Rate limit 429 de Gemini en intento ${attempt}. Esperando ${waitTime}ms...`);
          await new Promise((res) => setTimeout(res, waitTime));
        } else {
          logError('GeminiService:callGemini', err);
          break;
        }
      }
    }

    if (!rawResponseText) return null;

    const validation = GeminiValidator.validate(rawResponseText, allowedNumbers, codeConfidence);
    if (!validation.isValid || !validation.sanitizedData) {
      logInfo('GeminiService:validation', validation.error || 'Respuesta inválida');
      return null;
    }

    return validation.sanitizedData;
  }

  /**
   * Fusiona el análisis de Gemini y Llama 3.3 encontrando el consenso unánime.
   */
  public static mergeConsensus(
    gemini: StructuredAnalysisResponse,
    llama: StructuredAnalysisResponse,
    codeConfidence: 'alta' | 'media' | 'baja'
  ): StructuredAnalysisResponse {
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]/g, '');

    let consensusCount = 0;
    const mergedMarkets: any[] = [];

    // 1. Evaluar mercados de Gemini contra Llama
    for (const gMarket of gemini.mercados) {
      const gNorm = normalize(gMarket.mercado);
      const matchingLlama = llama.mercados.find((lMarket) => {
        const lNorm = normalize(lMarket.mercado);
        return (
          gNorm === lNorm ||
          gNorm.includes(lNorm) ||
          lNorm.includes(gNorm) ||
          (gMarket.categoria === lMarket.categoria && Math.abs(gMarket.probModelo - lMarket.probModelo) <= 12)
        );
      });

      if (matchingLlama) {
        consensusCount++;
        mergedMarkets.push({
          ...gMarket,
          isConsensus: true,
          probModelo: Math.round((gMarket.probModelo + matchingLlama.probModelo) / 2),
          lectura: `[Consenso Gemini + Llama] ${gMarket.lectura}`,
        });
      } else {
        mergedMarkets.push({
          ...gMarket,
          isConsensus: false,
        });
      }
    }

    // 2. Si Llama propone un mercado adicional muy sólido no presente en Gemini, sumarlo hasta máx 6
    for (const lMarket of llama.mercados) {
      if (mergedMarkets.length >= 6) break;
      const lNorm = normalize(lMarket.mercado);
      const alreadyIncluded = mergedMarkets.some((m) => {
        const mNorm = normalize(m.mercado);
        return mNorm === lNorm || mNorm.includes(lNorm) || lNorm.includes(mNorm);
      });

      if (!alreadyIncluded && lMarket.probModelo >= 65) {
        mergedMarkets.push({
          ...lMarket,
          isConsensus: false,
        });
      }
    }

    // Ordenar los mercados con consenso arriba
    mergedMarkets.sort((a, b) => (b.isConsensus ? 1 : 0) - (a.isConsensus ? 1 : 0));

    // 3. Combinar argumentos del porQué eliminando duplicados
    const porQueCombined = [
      ...gemini.porQue,
      ...llama.porQue.filter((p) => !gemini.porQue.some((gp) => normalize(gp) === normalize(p))),
    ].slice(0, 5);

    // 4. Combinar riesgos identificados
    const riesgosCombined = [
      ...gemini.riesgos,
      ...llama.riesgos.filter((r) => !gemini.riesgos.some((gr) => normalize(gr) === normalize(r))),
    ].slice(0, 4);

    const isFullConsensus = consensusCount >= 1;
    const consensusPrefix = isFullConsensus
      ? '🤝 Consenso confirmado entre Google Gemini y Meta Llama 3.3: '
      : '🤖 Análisis cruzado de doble IA (Gemini + Llama 3.3): ';

    const cleanResumen = gemini.resumen.startsWith('🤝') || gemini.resumen.startsWith('🤖')
      ? gemini.resumen
      : `${consensusPrefix}${gemini.resumen}`;

    const textoCompleto = `${cleanResumen} ${porQueCombined.join(' ')}. Estimación estadística, no resultado seguro.`;

    return {
      resumen: cleanResumen,
      porQue: porQueCombined,
      mercados: mergedMarkets,
      riesgos: riesgosCombined,
      confianza: codeConfidence,
      aviso: 'Estimación estadística, no resultado seguro.',
      textoCompleto,
      isAiGenerated: true,
      consensusInfo: {
        modelsAgreed: ['Google Gemini', 'Meta Llama 3.3'],
        isFullConsensus,
        agreementCount: consensusCount,
      },
    };
  }
}
