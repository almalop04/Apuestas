import React from 'react';

interface ComparisonBarProps {
  label: string;
  homeValue?: number | null;
  awayValue?: number | null;
  homeTeamName: string;
  awayTeamName: string;
  unit?: string;
  isHigherBetter?: boolean;
}

export function ComparisonBar({
  label,
  homeValue,
  awayValue,
  homeTeamName,
  awayTeamName,
  unit = '',
}: ComparisonBarProps) {
  const hasData = homeValue != null && awayValue != null && !isNaN(homeValue) && !isNaN(awayValue);

  if (!hasData) {
    return (
      <div className="comparison-row" style={{ opacity: 0.85 }}>
        <div className="comparison-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="comparison-label">{label}</span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Sin datos en la fuente
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-muted)', padding: '0.2rem 0' }}>
          <span>{homeTeamName}: <em>Sin datos</em></span>
          <span>{awayTeamName}: <em>Sin datos</em></span>
        </div>
      </div>
    );
  }

  const sum = Math.max(0.001, homeValue + awayValue);
  const homePercent = Math.round((homeValue / sum) * 100);
  const awayPercent = 100 - homePercent;

  return (
    <div className="comparison-row">
      <div className="comparison-header">
        <span className="comparison-label">{label}</span>
      </div>

      <div className="comparison-values">
        <span style={{ color: 'var(--color-secondary)' }}>
          {homeValue} {unit}
        </span>
        <span style={{ color: 'var(--color-accent)' }}>
          {awayValue} {unit}
        </span>
      </div>

      <div
        className="comparison-track"
        role="progressbar"
        aria-label={`Comparativa ${label}: ${homeTeamName} ${homeValue} vs ${awayTeamName} ${awayValue}`}
        aria-valuenow={homePercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="comparison-fill-home"
          style={{ width: `${homePercent}%` }}
          title={`${homeTeamName}: ${homePercent}%`}
        />
        <div
          className="comparison-fill-away"
          style={{ width: `${awayPercent}%` }}
          title={`${awayTeamName}: ${awayPercent}%`}
        />
      </div>
    </div>
  );
}
