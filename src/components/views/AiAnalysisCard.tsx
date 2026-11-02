'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import type { StructuredAnalysisResponse } from '@/core/stats/templateExplainer';
import type { GeminiQuotaStatus } from '@/data/cache/geminiQuotaTracker';

interface AiAnalysisCardProps {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  isFootball: boolean;
}

export function AiAnalysisCard({
  matchId,
  homeTeamName,
  awayTeamName,
  isFootball,
}: AiAnalysisCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'limit_reached' | 'error'>('idle');
  const [analysis, setAnalysis] = useState<StructuredAnalysisResponse | null>(null);
  const [source, setSource] = useState<'gemini' | 'template' | null>(null);
  const [quota, setQuota] = useState<GeminiQuotaStatus | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAnalysis = async (refresh: boolean = false) => {
    try {
      setStatus('loading');
      setErrorMessage(null);

      const url = `/api/match/${matchId}/ai-analysis${refresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo generar el análisis en este momento.');
      }

      setAnalysis(data.data);
      setSource(data.source);
      setQuota(data.quota);
      setFallbackReason(data.fallbackReason || null);

      const now = new Date();
      setGeneratedAt(
        now.toLocaleTimeString('es-ES', {
          timeZone: 'Europe/Madrid',
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        })
      );

      setStatus('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión.');
      setStatus('error');
    }
  };

  return (
    <Card
      style={{
        marginBottom: '1.5rem',
        borderTop: '3px solid #8B5CF6',
        background: 'var(--color-surface)',
        overflow: 'hidden',
      }}
    >
      {/* =========================================================================
          ESTADO 1: REPOSO (IDLE - BOTÓN MANUAL)
          ========================================================================= */}
      {status === 'idle' && (
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(139, 92, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <Sparkles size={18} color="#8B5CF6" aria-hidden="true" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                  Análisis IA y Cuotas Justas
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Generado con Gemini (Plan 100% Gratuito) y basado en estadísticas oficiales de la temporada
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--color-text-secondary)',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Plan Gratuito · Hasta 50 análisis diarios
            </span>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Pulsa el botón para obtener una explicación clara en lenguaje natural de por qué el balance de victorias y goles de ambos clubes otorgan estas probabilidades, qué cuotas tendrían valor teórico y los riesgos no contemplados.
          </p>

          <button
            type="button"
            onClick={() => fetchAnalysis(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '44px',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
              transition: 'opacity 0.2s ease',
            }}
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>Generar análisis del partido</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          ESTADO 2: CARGANDO (SKELETON ANIMADO)
          ========================================================================= */}
      {status === 'loading' && (
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Skeleton width="28px" height="28px" borderRadius="var(--radius-md)" />
            <Skeleton width="240px" height="20px" />
          </div>

          <Skeleton width="100%" height="60px" borderRadius="var(--radius-md)" className="mb-4" />
          <Skeleton width="100%" height="120px" borderRadius="var(--radius-md)" className="mb-4" />
          <Skeleton width="100%" height="40px" borderRadius="var(--radius-sm)" />
        </div>
      )}

      {/* =========================================================================
          ESTADO 3: ÉXITO (RESULTADO DEL ANÁLISIS)
          ========================================================================= */}
      {status === 'success' && analysis && (
        <div>
          {/* Cabecera del Análisis */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#8B5CF6" aria-hidden="true" />
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                Análisis Estadístico del Partido
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Etiqueta de procedencia */}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: source === 'gemini' ? '#A78BFA' : 'var(--color-accent)',
                  background: source === 'gemini' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(45, 212, 167, 0.12)',
                  border: source === 'gemini' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(45, 212, 167, 0.3)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <span>{source === 'gemini' ? '✨ Generado por IA (Gemini)' : '⚙️ Explicación automática (Plantilla)'}</span>
                {generatedAt && <span style={{ opacity: 0.8 }}>· {generatedAt}</span>}
              </span>

              {/* Nivel de confianza dictado por el código */}
              <Badge
                variant={analysis.confianza === 'alta' ? 'win' : analysis.confianza === 'media' ? 'neutral' : 'nodata'}
              >
                Confianza {analysis.confianza.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Aviso de fallback si se utilizó plantilla por límite o error */}
          {fallbackReason && (
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Info size={14} color="var(--color-secondary)" aria-hidden="true" />
              <span>{fallbackReason}</span>
            </div>
          )}

          {/* 1. Resumen */}
          <div
            style={{
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '0.35rem' }}>
              Resumen Cuantitativo
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', lineHeight: 1.5, margin: 0 }}>
              {analysis.resumen}
            </p>
          </div>

          {/* 2. Por qué el modelo estima esto */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              Factores que respaldan la estimación:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {analysis.porQue.map((motivo, idx) => (
                <li key={idx} style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {motivo}
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Tabla de Mercados y Cuotas Justas */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              Evaluación de Mercados y Cuotas
            </h4>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.8125rem',
                  textAlign: 'left',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)' }}>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Mercado / Opción</th>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Prob. Modelo</th>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-secondary)', fontWeight: 600 }}>Cuota Justa</th>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Cuota Real</th>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Lectura</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.mercados.map((m, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                      }}
                    >
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {m.mercado}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {m.probModelo}%
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--color-secondary)' }}>
                        {m.cuotaJusta != null ? m.cuotaJusta.toFixed(2) : 'Sin datos'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontVariantNumeric: 'tabular-nums', color: m.cuotaReal != null ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                        {m.cuotaReal != null ? m.cuotaReal.toFixed(2) : 'Sin datos'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                        {m.lectura}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Riesgos y Limitaciones del Modelo */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldAlert size={15} color="var(--color-warning)" aria-hidden="true" />
              <span>Límites y Riesgos no contemplados en la estadística:</span>
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {analysis.riesgos.map((riesgo, idx) => (
                <li key={idx} style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                  {riesgo}
                </li>
              ))}
            </ul>
          </div>

          {/* 5. Pie con botón de refresco y Aviso legal inmutable */}
          <div
            style={{
              paddingTop: '0.875rem',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => fetchAnalysis(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  minHeight: '44px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} aria-hidden="true" />
                <span>Actualizar análisis</span>
              </button>

              {quota && (
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                  Consumo diario: {quota.consumedToday} / {quota.dailyLimit} análisis
                </span>
              )}
            </div>

            {/* Aviso legal obligatorio */}
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              Estimaciones estadísticas, no resultados seguros ni promesa de rentabilidad.
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ESTADO 4: ERROR
          ========================================================================= */}
      {status === 'error' && (
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', marginBottom: '0.75rem' }}>
            <AlertTriangle size={18} aria-hidden="true" />
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>
              No se pudo completar el análisis
            </h4>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            {errorMessage || 'Ha ocurrido un problema al comunicar con el servidor.'}
          </p>
          <button
            type="button"
            onClick={() => fetchAnalysis(false)}
            style={{
              minHeight: '44px',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            Reintentar análisis
          </button>
        </div>
      )}
    </Card>
  );
}

