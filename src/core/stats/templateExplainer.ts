/**
 * EXPLICADOR ESTADÍSTICO POR PLANTILLAS (RESPALDO SIN IA)
 * 
 * Genera explicaciones basadas en reglas y números reales sin depender
 * de ningún modelo de lenguaje externo. Actúa como salvaguarda ante
 * fallos de red, errores 429 de cuota o límites del plan gratuito de Gemini.
 * 
 * Regla de oro: Todo número proviene del módulo matemático.
 * Termina siempre con: "Estimación estadística, no resultado seguro."
 */

import type { MatchMarketAnalysis, MarketEvaluation, MarketCategory } from './marketCalculator.ts';
import type { MatchDetail } from '../models.ts';

export interface AnalysisMarketItem {
  mercado: string;
  categoria?: MarketCategory;
  probModelo: number;
  cuotaJusta?: number | null;
  cuotaReal: number | null;
  casaApuesta?: 'Bet365' | 'Winamax';
  lectura: string;
  isConsensus?: boolean;
}

export interface StructuredAnalysisResponse {
  resumen: string;
  porQue: string[];
  mercados: AnalysisMarketItem[];
  riesgos: string[];
  confianza: 'alta' | 'media' | 'baja';
  aviso: string;
  textoCompleto: string;
  isAiGenerated: boolean;
  consensusInfo?: {
    modelsAgreed: string[];
    isFullConsensus: boolean;
    agreementCount?: number;
  };
}

export class TemplateExplainer {
  public static readonly DISCLAIMER = 'Estimación estadística, no resultado seguro.';

  /**
   * Genera el análisis estructurado completo por plantillas.
   */
  public static generateAnalysis(
    analysis: MatchMarketAnalysis,
    matchDetail: MatchDetail
  ): StructuredAnalysisResponse {
    const isFb = analysis.sport === 'football';
    const primaryMarket = analysis.markets[0]; // 1X2 o Ganador Baloncesto
    const favItem = [...primaryMarket.items].sort((a, b) => b.probModelo - a.probModelo)[0];
    const favCasa = favItem.casaApuesta || 'Bet365';

    // 1. Resumen (sin mención de cuota justa)
    const resumen = `${analysis.homeTeamName} se enfrenta a ${analysis.awayTeamName}. El análisis basado en el rendimiento de la temporada actual sitúa como opción más factible "${favItem.selection}" con un ${favItem.probModelo}% de probabilidad estimada${favItem.cuotaReal ? `, a cuota ${favItem.cuotaReal} en ${favCasa}` : ''}.`;

    // 2. Por qué (Razones cuantitativas respaldadas)
    const porQue: string[] = [];
    const homeFreq = matchDetail.frequencies10.home;
    const awayFreq = matchDetail.frequencies10.away;

    porQue.push(
      `${analysis.homeTeamName} presenta una media de ${homeFreq.avgGoalsOrPointsScored} ${isFb ? 'goles anotados' : 'puntos anotados'} y ${homeFreq.avgGoalsOrPointsConceded} recibidos por partido en la temporada.`
    );
    porQue.push(
      `${analysis.awayTeamName} registra ${awayFreq.avgGoalsOrPointsScored} ${isFb ? 'goles a favor' : 'puntos a favor'} y ${awayFreq.avgGoalsOrPointsConceded} en contra por partido en la temporada.`
    );
    porQue.push(
      `El promedio de anotación verificado de ambos clubes es de ${matchDetail.probabilities.expectedHomeScore} goles del local y ${matchDetail.probabilities.expectedAwayScore} del visitante.`
    );
    if (isFb) {
      porQue.push(
        `En mercados específicos (córners, remates a puerta de delanteros y tarjetas), las frecuencias empíricas proyectan líneas dinámicas ajustadas a la media liguera sin datos inventados.`
      );
    }

    // 3. Selección exclusiva de los pronósticos más factibles según los datos (4 a 6 selecciones top)
    const candidateItems: AnalysisMarketItem[] = [];

    // Para cada mercado, tomamos únicamente su selección con mayor probabilidad empírica
    for (const market of analysis.markets) {
      if (!market.items || market.items.length === 0) continue;
      // Ordenar selecciones de este mercado por probabilidad descendente
      const sortedItems = [...market.items].sort((a, b) => b.probModelo - a.probModelo);
      const bestItem = sortedItems[0];

      // Filtrar: si es 1X2 o Ganador, siempre tomamos el favorito; en otros mercados, solo si es una opción factible (prob >= 48%)
      if (
        market.marketId === '1x2' ||
        market.marketId === 'winner_basket' ||
        bestItem.probModelo >= 48
      ) {
        const casa = bestItem.casaApuesta || 'Bet365';
        let lectura = `Opción más factible (${bestItem.probModelo}% de probabilidad estimada).`;

        if (bestItem.cuotaReal != null) {
          lectura += ` Cuota oficial en ${casa}: ${bestItem.cuotaReal}.`;
        } else {
          lectura += ' Cuota pendiente de publicación en las casas de apuestas.';
        }

        candidateItems.push({
          mercado: bestItem.selection,
          categoria: market.category,
          probModelo: bestItem.probModelo,
          cuotaReal: bestItem.cuotaReal,
          casaApuesta: casa,
          lectura,
        });
      }
    }

    // Ordenar para que encabecen las opciones con mayor probabilidad y tomar las 5-6 más factibles
    const mercados = candidateItems
      .sort((a, b) => b.probModelo - a.probModelo)
      .slice(0, 6);

    // 4. Riesgos y factores no contemplados en la estadística
    const riesgos = [
      'Las estadísticas históricas no evalúan lesiones de última hora ni ausencias en el once titular.',
      'No se consideran factores motivacionales, fatiga por acumulación de calendario ni condiciones climáticas.',
      `Nivel de confianza ${analysis.confidence.level.toUpperCase()}: ${analysis.confidence.reason}`,
    ];

    // 5. Redacción fluida en prosa (máximo 250 palabras)
    const parrafos: string[] = [];
    parrafos.push(resumen);

    if (analysis.hasAnyRealOdds) {
      parrafos.push(
        `En las casas de apuestas oficiales: ${primaryMarket.items
          .filter((i) => i.cuotaReal != null)
          .map((i) => `${i.selection}: cuota ${i.cuotaReal} en ${i.casaApuesta || 'Bet365'}`)
          .join('; ')}.`
      );
    } else {
      parrafos.push(
        'Actualmente las casas de apuestas no han abierto cuotas para este encuentro específico.'
      );
    }

    parrafos.push(
      `Limitaciones: Las cifras dependen del historial previo y no incorporan imprevistos como alineaciones o sanciones. ${TemplateExplainer.DISCLAIMER}`
    );

    const textoCompleto = parrafos.join(' ');

    return {
      resumen,
      porQue,
      mercados,
      riesgos,
      confianza: analysis.confidence.level,
      aviso: TemplateExplainer.DISCLAIMER,
      textoCompleto,
      isAiGenerated: false,
    };
  }
}

