import React from 'react';
import { HelpCircle, AlertTriangle, TrendingUp, Cpu } from 'lucide-react';
import type { HistoricalFrequencies, EstimatedProbabilities } from '@/core/models';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface ProbabilityVsFrequencyProps {
  frequencies: {
    home: HistoricalFrequencies;
    away: HistoricalFrequencies;
  };
  probabilities: EstimatedProbabilities;
  homeTeamName: string;
  awayTeamName: string;
  isFootball: boolean;
  isSampleSufficient: boolean;
  windowSize: 5 | 10;
}

export function ProbabilityVsFrequency({
  frequencies,
  probabilities,
  homeTeamName,
  awayTeamName,
  isFootball,
  isSampleSufficient,
  windowSize,
}: ProbabilityVsFrequencyProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
      {/* =========================================================================
          BLOQUE 1: FRECUENCIA HISTÓRICA (VERDE ESMERALDA #2DD4A7)
          ========================================================================= */}
      <Card style={{ borderTop: '3px solid var(--color-accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="var(--color-accent)" aria-hidden="true" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Frecuencia Histórica
            </h3>
          </div>
          <Badge variant="win">Últimos {windowSize} partidos</Badge>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
          Lo que <strong>ocurrió realmente</strong> en los últimos {windowSize} partidos disputados. Es un registro empírico del pasado.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Victorias recientes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Victorias {homeTeamName}:</span>
            <span style={{ fontWeight: 600, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
              {frequencies.home.homeTeamWins}%
            </span>
          </div>

          {isFootball && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Tasa de empates:</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {frequencies.home.draws}%
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Victorias {awayTeamName}:</span>
            <span style={{ fontWeight: 600, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
              {frequencies.away.homeTeamWins}%
            </span>
          </div>

          {/* Tasa Over / Línea de puntos */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              {isFootball ? 'Más de 2.5 goles:' : 'Más de 215.5 puntos:'}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {frequencies.home.over25GoalsOrOverPointsRate}%
            </span>
          </div>

          {/* Promedio de goles / puntos */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Media anotada / recibida:
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {frequencies.home.avgGoalsOrPointsScored} / {frequencies.home.avgGoalsOrPointsConceded}
            </span>
          </div>
        </div>
      </Card>

      {/* =========================================================================
          BLOQUE 2: PROBABILIDAD ESTIMADA (AZUL ANALÍTICO #5B8CFF)
          ========================================================================= */}
      <Card style={{ borderTop: isSampleSufficient ? '3px solid var(--color-secondary)' : '3px solid var(--color-warning)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={16} color={isSampleSufficient ? 'var(--color-secondary)' : 'var(--color-warning)'} aria-hidden="true" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Probabilidad Estimada
            </h3>
          </div>
          {isSampleSufficient ? (
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-secondary-subtle)',
                color: 'var(--color-secondary)',
                border: '1px solid rgba(91, 140, 255, 0.3)',
              }}
            >
              {probabilities.modelName}
            </span>
          ) : (
            <Badge variant="nodata">Sin estimación</Badge>
          )}
        </div>

        {isSampleSufficient ? (
          <>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
              Cálculo teórico aislando el potencial de ataque del local contra la defensa rival.
            </p>

            {/* Cifras grandes de probabilidad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isFootball ? '1fr 1fr 1fr' : '1fr 1fr',
                gap: '0.5rem',
                textAlign: 'center',
                marginBottom: '1rem',
              }}
            >
              <div style={{ background: 'var(--color-surface-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Victoria 1</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                  {probabilities.homeWinProb}%
                </div>
              </div>

              {isFootball && (
                <div style={{ background: 'var(--color-surface-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Empate X</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {probabilities.drawProb}%
                  </div>
                </div>
              )}

              <div style={{ background: 'var(--color-surface-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Victoria 2</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                  {probabilities.awayWinProb}%
                </div>
              </div>
            </div>

            {/* Marcador proyectado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '0.85rem', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Marcador esperado (xG/pts):</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {probabilities.expectedHomeScore} - {probabilities.expectedAwayScore}
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
              {probabilities.explanationText}
            </div>
          </>
        ) : (
          <div
            style={{
              padding: '1.5rem 1rem',
              textAlign: 'center',
              background: 'var(--color-warning-subtle)',
              border: '1px dashed var(--color-warning)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <AlertTriangle size={28} color="var(--color-warning)" style={{ margin: '0 auto 0.75rem' }} aria-hidden="true" />
            <h4 style={{ color: 'var(--color-warning)', fontSize: '0.9375rem', marginBottom: '0.35rem', fontWeight: 600 }}>
              Sin datos suficientes para proyectar
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Este equipo no alcanza el umbral de seguridad de 5 partidos en la competición actual. Para proteger la honestidad de la herramienta, no se generan probabilidades inventadas.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
