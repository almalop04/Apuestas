'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateNavigatorProps {
  dayOffset: number;
  onChangeDayOffset: (newOffset: number) => void;
}

export function DateNavigator({ dayOffset, onChangeDayOffset }: DateNavigatorProps) {
  // Calcular la fecha local en España correspondiente al dayOffset
  const dateObj = new Date();
  dateObj.setDate(dateObj.getDate() + dayOffset);

  const dayOfWeek = dateObj.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'Europe/Madrid' });
  const dayOfWeekCapitalized = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
  const formattedDate = dateObj.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Madrid',
  });

  let relativeBadge = '';
  if (dayOffset === 0) relativeBadge = 'Hoy';
  else if (dayOffset === -1) relativeBadge = 'Ayer';
  else if (dayOffset === 1) relativeBadge = 'Mañana';
  else if (dayOffset > 1) relativeBadge = `+${dayOffset} días`;
  else relativeBadge = `Hace ${Math.abs(dayOffset)} días`;

  return (
    <div
      style={{
        marginTop: '0.5rem',
        padding: '0.85rem',
        background: 'rgba(17, 26, 39, 0.55)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Calendar size={13} color="var(--color-secondary)" />
          Fecha de Partidos
        </span>

        {dayOffset !== 0 && (
          <button
            type="button"
            onClick={() => onChangeDayOffset(0)}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 6px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--color-secondary)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Ir a Hoy
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.35rem',
        }}
      >
        {/* Flecha Atrás (Día anterior) */}
        <button
          type="button"
          onClick={() => onChangeDayOffset(dayOffset - 1)}
          aria-label="Ver día anterior"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-secondary)';
            e.currentTarget.style.color = 'var(--color-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Día actual centrado */}
        <div style={{ textAlign: 'center', flex: 1, padding: '0 0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              {formattedDate}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                background: dayOffset === 0 ? 'rgba(45, 212, 167, 0.15)' : 'rgba(91, 140, 255, 0.15)',
                color: dayOffset === 0 ? 'var(--color-success)' : 'var(--color-secondary)',
              }}
            >
              {relativeBadge}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-text-muted)',
              display: 'block',
              lineHeight: 1.1,
            }}
          >
            {dayOfWeekCapitalized}
          </span>
        </div>

        {/* Flecha Adelante (Día siguiente) */}
        <button
          type="button"
          onClick={() => onChangeDayOffset(dayOffset + 1)}
          aria-label="Ver día siguiente"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-secondary)';
            e.currentTarget.style.color = 'var(--color-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
