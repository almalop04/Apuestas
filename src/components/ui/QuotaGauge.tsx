import React from 'react';
import { Gauge, ShieldAlert } from 'lucide-react';
import type { ApiQuotaStatus } from '@/core/models';

interface QuotaGaugeProps {
  quota: ApiQuotaStatus;
  className?: string;
}

export function QuotaGauge({ quota, className = '' }: QuotaGaugeProps) {
  const isHigh = quota.percentageUsed >= 80;
  const isBlocked = quota.isBlockedDueToLimit;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.35rem 0.75rem',
        background: isBlocked ? 'var(--color-danger-subtle)' : 'var(--color-surface-subtle)',
        border: `1px solid ${isBlocked ? 'var(--color-danger)' : isHigh ? 'var(--color-warning)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        color: isBlocked ? 'var(--color-danger)' : isHigh ? 'var(--color-warning)' : 'var(--color-text-secondary)',
      }}
      className={className}
      title={`Consumo de API: ${quota.consumedToday} de ${quota.dailyLimit} peticiones. Límite seguro para no incurrir en costes.`}
    >
      {isBlocked ? (
        <ShieldAlert size={14} color="var(--color-danger)" aria-hidden="true" />
      ) : (
        <Gauge size={14} color="var(--color-secondary)" aria-hidden="true" />
      )}
      <span>
        API:{' '}
        <strong style={{ color: 'var(--color-text-primary)' }}>
          {quota.consumedToday}/{quota.dailyLimit}
        </strong>
      </span>
      {isBlocked && (
        <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
          • Bloqueo de seguridad activo
        </span>
      )}
    </div>
  );
}
