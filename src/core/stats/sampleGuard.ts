/**
 * GUARDIA DE MUESTRA MÍNIMA (INTEGRIDAD DE DATOS)
 * 
 * Principio ético y matemático:
 * En estadística deportiva, un número reducido de partidos (<5) no constituye
 * una muestra representativa y produce proyecciones sesgadas y engañosas.
 * 
 * Si un equipo o jugador cuenta con menos de 5 partidos válidos, este módulo
 * bloquea la estimación probabilística y emite el estado oficial "Sin datos suficientes".
 */

export const MINIMUM_SAMPLE_SIZE = 5;

export interface SampleGuardResult {
  isSufficient: boolean;
  actualSize: number;
  minimumRequired: number;
  badgeText: string;
  badgeType: 'sufficient' | 'warning' | 'insufficient';
  reason?: string;
}

/**
 * Evalúa si una lista de partidos cumple el umbral mínimo representativo.
 */
export function evaluateSampleSize(matchesCount: number): SampleGuardResult {
  if (matchesCount >= 10) {
    return {
      isSufficient: true,
      actualSize: matchesCount,
      minimumRequired: MINIMUM_SAMPLE_SIZE,
      badgeText: `Muestra óptima (${matchesCount} partidos)`,
      badgeType: 'sufficient',
    };
  }

  if (matchesCount >= MINIMUM_SAMPLE_SIZE) {
    return {
      isSufficient: true,
      actualSize: matchesCount,
      minimumRequired: MINIMUM_SAMPLE_SIZE,
      badgeText: `Muestra básica (${matchesCount} partidos)`,
      badgeType: 'warning',
      reason: 'Muestra entre 5 y 9 partidos. La fiabilidad es moderada.',
    };
  }

  return {
    isSufficient: false,
    actualSize: matchesCount,
    minimumRequired: MINIMUM_SAMPLE_SIZE,
    badgeText: `Muestra insuficiente (${matchesCount}/${MINIMUM_SAMPLE_SIZE} partidos)`,
    badgeType: 'insufficient',
    reason: `Se requieren al menos ${MINIMUM_SAMPLE_SIZE} partidos oficiales para calcular probabilidades confiables. No se emitirá estimación probabilística para evitar distorsiones.`,
  };
}
