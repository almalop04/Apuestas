import React from 'react';
import { TrendingUp, Cpu, AlertTriangle } from 'lucide-react';
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
  competitionName?: string;
  sourceName?: string;
  lastUpdated?: string;
}

export function ProbabilityVsFrequency({
  frequencies,
  probabilities,
  homeTeamName,
  awayTeamName,
  isFootball,
  isSampleSufficient,
  competitionName = 'Competición Oficial',
  sourceName = 'Clasificación Oficial Temporada Actual',
  lastUpdated = 'En tiempo real',
}: ProbabilityVsFrequencyProps) {
  const homeSampleSize = frequencies.home.totalMatchesEvaluated || frequencies.home.sampleSize || 0;
  const awaySampleSize = frequencies.away.totalMatchesEvaluated || frequencies.away.sampleSize || 0;

  const hasData = homeSampleSize > 0 || awaySampleSize > 0;

  const homeWins = frequencies.home.winsCount ?? Math.round((frequencies.home.homeTeamWins / 100) * homeSampleSize);
  const homeDraws = frequencies.home.drawsCount ?? Math.round(((frequencies.home.draws || 0) / 100) * homeSampleSize);
  const homeLosses = frequencies.home.lossesCount ?? Math.max(0, homeSampleSize - homeWins - (isFootball ? homeDraws : 0));

  const awayWins = frequencies.away.winsCount ?? Math.round((frequencies.away.homeTeamWins / 100) * awaySampleSize);
  const awayDraws = frequencies.away.drawsCount ?? Math.round(((frequencies.away.draws || 0) / 100) * awaySampleSize);
  const awayLosses = frequencies.away.lossesCount ?? Math.max(0, awaySampleSize - awayWins - (isFootball ? awayDraws : 0));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
      {/* =========================================================================
          BLOQUE 1: RENDIMIENTO EN LA TEMPORADA ACTUAL (VERDE ESMERALDA #2DD4A7)
          ========================================================================= */}
      <Card style={{ borderTop: '3px solid var(--color-accent)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} color="var(--color-accent)" aria-hidden="true" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Rendimiento en la Temporada Actual
              </h3>
            </div>
            <Badge variant="win">{competitionName} · Temporada Actual</Badge>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Registro oficial y verídico de lo <strong>ocurrido en la competición actual</strong> por cada equipo en la temporada presente.
          </p>

          {hasData ? (
            <>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-surface-subtle)',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                Partidos disputados en la temporada: <strong>{homeSampleSize}</strong> de {homeTeamName} · <strong>{awaySampleSize}</strong> de {awayTeamName}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Tarjeta Equipo Local */}
                <div
                  style={{
                    background: 'rgba(91, 140, 255, 0.05)',
                    border: '1px solid rgba(91, 140, 255, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>
                    {homeTeamName} (Local)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Victorias:</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                        Ganó {homeWins} de {homeSampleSize} ({frequencies.home.homeTeamWins}%)
                      </span>
                    </div>
                    {isFootball && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Empates:</span>
                        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          Empató {homeDraws} de {homeSampleSize} ({frequencies.home.draws}%)
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Derrotas:</span>
                      <span style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}>
                        Perdió {homeLosses} de {homeSampleSize} ({frequencies.home.awayTeamWins}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem', borderTop: '1px dashed var(--color-border-subtle)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Media {isFootball ? 'goles por partido' : 'puntos por partido'}:</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {frequencies.home.avgGoalsOrPointsScored} anotados / {frequencies.home.avgGoalsOrPointsConceded} recibidos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta Equipo Visitante */}
                <div
                  style={{
                    background: 'rgba(45, 212, 167, 0.05)',
                    border: '1px solid rgba(45, 212, 167, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
                    {awayTeamName} (Visitante)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Victorias:</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                        Ganó {awayWins} de {awaySampleSize} ({frequencies.away.homeTeamWins}%)
                      </span>
                    </div>
                    {isFootball && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Empates:</span>
                        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          Empató {awayDraws} de {awaySampleSize} ({frequencies.away.draws}%)
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Derrotas:</span>
                      <span style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}>
                        Perdió {awayLosses} de {awaySampleSize} ({frequencies.away.awayTeamWins}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem', borderTop: '1px dashed var(--color-border-subtle)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Media {isFootball ? 'goles por partido' : 'puntos por partido'}:</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {frequencies.away.avgGoalsOrPointsScored} anotados / {frequencies.away.avgGoalsOrPointsConceded} recibidos
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                padding: '1.5rem 1rem',
                textAlign: 'center',
                background: 'var(--color-surface-subtle)',
                border: '1px dashed var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Sin datos de clasificación oficial disponibles en la fuente para esta competición.
              </p>
            </div>
          )}
        </div>

        {/* Pie de Bloque: Fuente y Actualización */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.6rem',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            flexWrap: 'wrap',
            gap: '0.35rem',
          }}
        >
          <span>Fuente: {sourceName}</span>
          <span>Actualizado: {lastUpdated}</span>
        </div>
      </Card>

      {/* =========================================================================
          BLOQUE 2: PROBABILIDAD ESTIMADA POR RENDIMIENTO (AZUL ANALÍTICO #5B8CFF)
          ========================================================================= */}
      <Card style={{ borderTop: isSampleSufficient ? '3px solid var(--color-secondary)' : '3px solid var(--color-warning)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={16} color={isSampleSufficient ? 'var(--color-secondary)' : 'var(--color-warning)'} aria-hidden="true" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Probabilidad por Rendimiento Real (Temporada)
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
                Cálculo empírico directo basado en el balance de victorias, empates y derrotas de ambos clubes en sus partidos oficiales de la temporada actual.
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                    {homeTeamName} (1)
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                    {probabilities.homeWinProb}%
                  </div>
                </div>

                {isFootball && (
                  <div style={{ background: 'var(--color-surface-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Empate (X)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {probabilities.drawProb}%
                    </div>
                  </div>
                )}

                <div style={{ background: 'var(--color-surface-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                    {awayTeamName} (2)
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                    {probabilities.awayWinProb}%
                  </div>
                </div>
              </div>

              {/* Marcador proyectado con denominación oficial correcta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '0.85rem', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Promedio de anotación verificado ({isFootball ? 'Goles/partido en temporada' : 'Puntos/partido en temporada'}):
                </span>
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
                Este encuentro no cuenta con datos de clasificación oficial en la temporada actual. Para proteger la honestidad de la herramienta, no se generan probabilidades inventadas.
              </p>
            </div>
          )}
        </div>

        {/* Pie de Bloque: Fuente y Actualización */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.6rem',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            flexWrap: 'wrap',
            gap: '0.35rem',
          }}
        >
          <span>Fuente: {probabilities.modelName}</span>
          <span>Actualizado: {lastUpdated}</span>
        </div>
      </Card>
    </div>
  );
}
