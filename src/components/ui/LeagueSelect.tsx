import React from 'react';
import { Trophy, ChevronDown } from 'lucide-react';

export interface LeagueOption {
  id: string;
  name: string;
  country: string;
  round?: string;
  count: number;
}

interface LeagueSelectProps {
  leagues: LeagueOption[];
  selectedLeague: string;
  onSelect: (leagueId: string) => void;
  totalMatches: number;
}

export function LeagueSelect({
  leagues,
  selectedLeague,
  onSelect,
  totalMatches,
}: LeagueSelectProps) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '0.75rem',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--color-secondary)',
        }}
        aria-hidden="true"
      >
        <Trophy size={15} />
      </div>

      <select
        id="league-filter-select"
        value={selectedLeague}
        onChange={(e) => onSelect(e.target.value)}
        aria-label="Filtrar partidos por liga y jornada"
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          background: 'var(--color-surface-subtle)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-text-primary)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          padding: '0.45rem 2.25rem 0.45rem 2.25rem',
          minHeight: '38px',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          fontVariantNumeric: 'tabular-nums',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-secondary)';
          e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-secondary-subtle)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <option value="all" style={{ background: '#111A27', color: '#E6EDF5' }}>
          🏆 Todas las ligas ({totalMatches} {totalMatches === 1 ? 'partido' : 'partidos'})
        </option>
        {leagues.map((l) => {
          const roundText = l.round ? ` • ${l.round}` : '';
          const countText = l.count > 0 ? ` (${l.count})` : ' (0 hoy)';
          return (
            <option
              key={l.id}
              value={l.id}
              style={{ background: '#111A27', color: '#E6EDF5' }}
            >
              {l.name} [{l.country}]{roundText}{countText}
            </option>
          );
        })}
      </select>

      <div
        style={{
          position: 'absolute',
          right: '0.75rem',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--color-text-secondary)',
        }}
        aria-hidden="true"
      >
        <ChevronDown size={14} />
      </div>
    </div>
  );
}
