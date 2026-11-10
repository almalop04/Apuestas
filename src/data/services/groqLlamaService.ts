/**
 * SERVICIO DE INTEGRACIÓN CON META LLAMA 3.3 (VÍA GROQ - API 100% GRATUITA)
 * 
 * Ventajas:
 * 1. Plan gratuito permanente (sin tarjeta de crédito ni cobro).
 * 2. Ejecuta Llama 3.3 70B Versatile a máxima velocidad (en milisegundos).
 * 3. Proporciona una segunda opinión independiente para el sistema de Consenso Dual.
 */

import type { StructuredAnalysisResponse } from '../../core/stats/templateExplainer.ts';
import { GeminiValidator } from './geminiValidator.ts';
import { logError, logInfo } from '../logger.ts';

export class GroqLlamaService {
  private static readonly GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly DEFAULT_MODEL = 'llama-3.3-70b-versatile';

  public static isAvailable(): boolean {
    return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '');
  }

  /**
   * Ejecuta el análisis del partido con Llama 3.3 70B vía Groq.
   */
  public static async analyze(
    payload: any,
    allowedNumbers: number[],
    codeConfidence: 'alta' | 'media' | 'baja',
    systemPrompt: string
  ): Promise<StructuredAnalysisResponse | null> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;

    const model = process.env.GROQ_MODEL || this.DEFAULT_MODEL;

    try {
      logInfo('GroqLlamaService', `Consultando modelo ${model} vía Groq API...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000); // 18 segundos de timeout

      const response = await fetch(this.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: `DATOS DEL PARTIDO, ESTADÍSTICAS DETALLADAS (CÓRNERS, REMATES A PUERTA, TARJETAS, GOLES POR EQUIPO) Y CUOTAS DE CASAS (Bet365 / Winamax) EN JSON:\n${JSON.stringify(payload, null, 2)}\n\nGenera el análisis en formato JSON estricto con los campos: resumen, porQue (lista), mercados (lista con mercado, categoria, probModelo, cuotaReal, casaApuesta, lectura), riesgos (lista) y aviso. IMPORTANTE: En el array 'mercados' pon ÚNICAMENTE entre 4 y 6 pronósticos que la IA y las estadísticas consideren MÁS FACTIBLES de que sucedan. Prohibido mencionar 'cuota justa'.`,
            },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logError('GroqLlamaService:apiError', new Error(`HTTP ${response.status}: ${errorText}`));
        return null;
      }

      const jsonResponse = await response.json();
      const content = jsonResponse.choices?.[0]?.message?.content;
      if (!content) {
        logError('GroqLlamaService:emptyResponse', new Error('Respuesta vacía de Groq'));
        return null;
      }

      // Validar integridad anti-alucinaciones de Llama 3.3
      const validation = GeminiValidator.validate(content, allowedNumbers, codeConfidence);
      if (!validation.isValid || !validation.sanitizedData) {
        logInfo('GroqLlamaService:validationFailed', validation.error || 'Respuesta no válida');
        return null;
      }

      return validation.sanitizedData;
    } catch (err) {
      logError('GroqLlamaService:analyze', err);
      return null;
    }
  }
}
