import React from 'react';

interface ComparisonBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
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
