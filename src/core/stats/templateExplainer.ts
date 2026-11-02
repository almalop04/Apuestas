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
  cuotaJusta: number | null;
  cuotaReal: number | null;
  lectura: string;
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

    // 1. Resumen
    const resumen = `${analysis.homeTeamName} se enfrenta a ${analysis.awayTeamName}. El análisis basado en el rendimiento verificado de la temporada actual otorga la mayor probabilidad a la opción "${favItem.selection}" con un ${favItem.probModelo}%, equivalente a una cuota justa teórica de ${favItem.cuotaJusta ?? 'Sin datos'}.`;

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

    // 3. Mercados desglosados (Principales, Goles x Equipo, Córners, Remates, Tarjetas)
    const mercados: AnalysisMarketItem[] = [];

    for (const market of analysis.markets) {
      for (const item of market.items) {
        let lectura = `Probabilidad del ${item.probModelo}%, cuota justa ${item.cuotaJusta ?? 'Sin datos'}.`;

        if (item.cuotaReal != null) {
          if (item.cuotaJusta != null && item.cuotaReal > item.cuotaJusta) {
            lectura += ` La cuota real ofrecida (${item.cuotaReal}) supera la justa (${item.cuotaJusta}), reflejando un valor estadístico favorable según los partidos jugados.`;
          } else if (item.cuotaJusta != null && item.cuotaReal < item.cuotaJusta) {
            lectura += ` La cuota real (${item.cuotaReal}) está por debajo de la cuota justa (${item.cuotaJusta}), reduciendo el atractivo del pago.`;
          } else {
            lectura += ` La cuota de mercado (${item.cuotaReal}) se alinea con el rendimiento histórico.`;
          }
        } else {
          lectura += ' Cuota de casa no disponible (Sin datos oficiales).';
        }

        mercados.push({
          mercado: item.selection,
          categoria: market.category,
          probModelo: item.probModelo,
          cuotaJusta: item.cuotaJusta,
          cuotaReal: item.cuotaReal,
          lectura,
        });
      }
    }

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
        `Al comparar con el mercado, ${primaryMarket.items
          .filter((i) => i.cuotaReal != null)
          .map((i) => `${i.selection}: cuota justa ${i.cuotaJusta} vs cuota real ${i.cuotaReal}`)
          .join('; ')}.`
      );
    } else {
      parrafos.push(
        'Actualmente no se dispone de cuotas reales oficiales para este encuentro; la evaluación se fundamenta exclusivamente en la cuota justa teórica.'
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

