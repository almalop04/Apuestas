/**
 * VALIDADOR ESTRICTO DE RESPUESTAS DE GEMINI
 * 
 * Reglas de integridad:
 * 1. El JSON debe respetar exactamente el esquema requerido.
 * 2. La confianza la fija siempre el código, nunca la IA.
 * 3. Todo número citado en el texto debe coincidir con los datos provistos
 *    (filtro anti-alucinaciones). Si hay números inventados, se invalida.
 * 4. Debe finalizar con la advertencia obligatoria.
 */

import type { StructuredAnalysisResponse } from '../../core/stats/templateExplainer.ts';

export interface ValidationResult {
  isValid: boolean;
  sanitizedData?: StructuredAnalysisResponse;
  error?: string;
}

export class GeminiValidator {
  private static readonly REQUIRED_DISCLAIMER = 'Estimación estadística, no resultado seguro.';

  /**
   * Extrae el contenido JSON limpiando posibles bloques Markdown ```json ... ```
   */
  public static cleanJsonString(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith('```')) {
      return trimmed
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }
    return trimmed;
  }

  /**
   * Valida la estructura y los números del JSON devuelto por Gemini.
   */
  public static validate(
    rawText: string,
    allowedNumbers: number[],
    codeConfidence: 'alta' | 'media' | 'baja'
  ): ValidationResult {
    try {
      const cleanJson = this.cleanJsonString(rawText);
      const parsed = JSON.parse(cleanJson);

      // 1. Validar campos obligatorios
      if (!parsed.resumen || typeof parsed.resumen !== 'string') {
        return { isValid: false, error: 'Falta el campo resumen o no es texto válido' };
      }

      if (!Array.isArray(parsed.porQue) || parsed.porQue.length === 0) {
        return { isValid: false, error: 'Falta la lista porQue o está vacía' };
      }

      if (!Array.isArray(parsed.mercados) || parsed.mercados.length === 0) {
        return { isValid: false, error: 'Falta la lista mercados o está vacía' };
      }

      if (!Array.isArray(parsed.riesgos) || parsed.riesgos.length === 0) {
        return { isValid: false, error: 'Falta la lista riesgos o está vacía' };
      }

      // 2. Comprobar que los números citados en el resumen y porQué no sean inventados
      const textToScan = `${parsed.resumen} ${parsed.porQue.join(' ')}`;
      const foundNumbers = this.extractNumbers(textToScan);

      // Números base que siempre son legítimos en el contexto (ventanas, redondeos estándar, líneas de gol/córners/tarjetas, nombre de Bet365, etc.)
      const standardAllowed = new Set([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4.5, 5, 7.5, 8.5, 9.5, 10, 100, 105.5, 215.5, 250, 365]);
      for (const num of allowedNumbers) {
        standardAllowed.add(num);
        standardAllowed.add(Math.round(num));
      }

      for (const n of foundNumbers) {
        const isAllowed =
          standardAllowed.has(n) ||
          Array.from(standardAllowed).some((allowed) => Math.abs(allowed - n) <= 0.15);

        if (!isAllowed) {
          return {
            isValid: false,
            error: `Alucinación numérica detectada: El número ${n} no existe en los datos oficiales enviados.`,
          };
        }
      }

      // 3. Normalizar aviso y fijar confianza desde el código (inviolable)
      const sanitizedMercados = parsed.mercados.map((m: any) => {
        let cat: any = m.categoria;
        if (!cat) {
          const lower = String(m.mercado || '').toLowerCase();
          if (lower.includes('córner') || lower.includes('corner')) cat = 'corners';
          else if (lower.includes('remate') || lower.includes('tiro')) cat = 'shots';
          else if (lower.includes('tarjeta')) cat = 'cards';
          else if (lower.includes('goles -') || lower.includes('goles por equipo') || lower.includes('puntos individuales')) cat = 'team_goals';
          else cat = 'main';
        }

        let casa: 'Bet365' | 'Winamax' = 'Bet365';
        const rawCasa = String(m.casaApuesta || m.casa || '').toLowerCase();
        if (rawCasa.includes('winamax') || cat === 'shots' || cat === 'team_goals') {
          casa = 'Winamax';
        } else {
          casa = 'Bet365';
        }

        return {
          mercado: String(m.mercado || 'Mercado'),
          categoria: cat,
          probModelo: Number(m.probModelo) || 0,
          cuotaReal: m.cuotaReal != null && !isNaN(Number(m.cuotaReal)) ? Number(m.cuotaReal) : null,
          casaApuesta: casa,
          lectura: String(m.lectura || 'Sin lectura detallada.'),
        };
      });

      let textoCompleto = `${parsed.resumen} ${parsed.porQue.join(' ')}`;
      if (!textoCompleto.endsWith(this.REQUIRED_DISCLAIMER)) {
        textoCompleto = `${textoCompleto.replace(/\.?\s*$/, '')}. ${this.REQUIRED_DISCLAIMER}`;
      }

      const sanitizedData: StructuredAnalysisResponse = {
        resumen: String(parsed.resumen),
        porQue: parsed.porQue.map((p: any) => String(p)),
        mercados: sanitizedMercados,
        riesgos: parsed.riesgos.map((r: any) => String(r)),
        confianza: codeConfidence, // Regla estricta: dictada por el código
        aviso: this.REQUIRED_DISCLAIMER,
        textoCompleto,
        isAiGenerated: true as any,
      };

      return { isValid: true, sanitizedData };
    } catch (err) {
      return {
        isValid: false,
        error: `Error al parsear el JSON de Gemini: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Extrae todos los números flotantes o enteros de un texto.
   */
  private static extractNumbers(text: string): number[] {
    const matches = text.match(/\b\d+(?:\.\d+)?\b/g);
    if (!matches) return [];
    return matches.map((m) => parseFloat(m)).filter((n) => !isNaN(n));
  }
}

