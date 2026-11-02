import React from 'react';
import { Database, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { DataAvailability } from '@/core/models';

interface DataAvailabilityChipProps {
  availability: DataAvailability;
  className?: string;
}

export function DataAvailabilityChip({ availability, className = '' }: DataAvailabilityChipProps) {
  const { sourceName, lastUpdated, sampleSize, isSampleSufficient, missingFields } = availability;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: 'var(--color-surface-subtle)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-full)',
        padding: '0.25rem 0.75rem',
        fontSize: '0.75rem',
        color: 'var(--color-text-secondary)',
      }}
      className={className}
      title={`Fuente: ${sourceName}. ${isSampleSufficient ? 'Muestra válida' : 'Muestra insuficiente'}`}
    >
      {/* Fuente */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
        <Database size={12} color="var(--color-text-muted)" aria-hidden="true" />
        <strong style={{ color: 'var(--color-text-primary)' }}>{sourceName}</strong>
      </span>

      <span style={{ color: 'var(--color-border)' }}>|</span>

      {/* Actualización */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
        <Clock size={12} color="var(--color-text-muted)" aria-hidden="true" />
        <span>{lastUpdated}</span>
      </span>

      <span style={{ color: 'var(--color-border)' }}>|</span>

      {/* Estado de suficiencia de muestra */}
      {isSampleSufficient ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'var(--color-accent)',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={12} aria-hidden="true" />
          <span>Muestra: {sampleSize} p.</span>
        </span>
      ) : (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'var(--color-warning)',
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={12} aria-hidden="true" />
          <span>Sin datos suficientes ({sampleSize}/5)</span>
        </span>
      )}
    </div>
  );
}
