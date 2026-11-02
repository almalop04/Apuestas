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
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'main' | 'corners' | 'shots' | 'cards'>('all');

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
                  Análisis IA de Pronósticos y Cuotas Oficiales
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Generado con Gemini y estadísticas verificadas · Cuotas oficiales de Bet365 y Winamax
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
            Pulsa el botón para obtener una explicación clara de por qué el balance de la temporada otorga estas probabilidades y cuáles son las opciones más factibles según las cuotas de Bet365 y Winamax.
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

          {/* 3. Tabla de Mercados y Cuotas Justas vs Casas de Apuestas */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>🎯 Pronósticos Más Factibles según la IA</span>
                </h4>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                  Selección exclusiva de las opciones con mayor probabilidad de cumplirse (1X2, goles, córners, remates y tarjetas)
                </span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                Referencias oficiales de Bet365 / Winamax
              </span>
            </div>

            {/* Pestañas de Filtrado por Categoría */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {[
                { id: 'all', label: '🌟 Todos los Factibles', count: analysis.mercados.length },
                {
                  id: 'main',
                  label: '⚽ 1X2 y Goles',
                  count: analysis.mercados.filter((m) => m.categoria === 'main' || m.categoria === 'team_goals' || !m.categoria).length,
                },
                {
                  id: 'corners',
                  label: '🚩 Córners',
                  count: analysis.mercados.filter((m) => m.categoria === 'corners').length,
                },
                {
                  id: 'shots',
                  label: '🎯 Remates Delanteros',
                  count: analysis.mercados.filter((m) => m.categoria === 'shots').length,
                },
                {
                  id: 'cards',
                  label: '🟨 Tarjetas',
                  count: analysis.mercados.filter((m) => m.categoria === 'cards').length,
                },
              ]
                .filter((tab) => tab.count > 0 || tab.id === 'all')
                .map((tab) => {
                  const isActive = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedCategory(tab.id as any)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#fff' : 'var(--color-text-secondary)',
                        background: isActive ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                        border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <span>{tab.label}</span>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          opacity: isActive ? 0.9 : 0.6,
                          background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                          padding: '1px 5px',
                          borderRadius: '8px',
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
            </div>

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
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Pronóstico Factible</th>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Categoría</th>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Prob. Modelo</th>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Cuota Oficial</th>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Lectura y Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.mercados
                    .filter((m) => {
                      if (selectedCategory === 'all') return true;
                      if (selectedCategory === 'main') return m.categoria === 'main' || m.categoria === 'team_goals' || !m.categoria;
                      return m.categoria === selectedCategory;
                    })
                    .map((m, idx) => {
                      const catBadge =
                        m.categoria === 'corners'
                          ? { label: 'Córners', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)' }
                          : m.categoria === 'shots'
                          ? { label: 'Remates', color: '#F472B6', bg: 'rgba(244, 114, 182, 0.12)' }
                          : m.categoria === 'cards'
                          ? { label: 'Tarjetas', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.12)' }
                          : m.categoria === 'team_goals'
                          ? { label: 'Gol Equipo', color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)' }
                          : { label: 'Principal', color: 'var(--color-text-muted)', bg: 'var(--color-surface-subtle)' };

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid var(--color-border-subtle)',
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                          }}
                        >
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span>{m.mercado}</span>
                              {m.probModelo >= 65 ? (
                                <span
                                  style={{
                                    fontSize: '0.625rem',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    background: 'rgba(45, 212, 167, 0.15)',
                                    color: 'var(--color-accent)',
                                    fontWeight: 600,
                                    border: '1px solid rgba(45, 212, 167, 0.3)',
                                  }}
                                >
                                  ⭐ Muy Factible
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '0.625rem',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    background: 'rgba(56, 189, 248, 0.15)',
                                    color: '#38BDF8',
                                    fontWeight: 600,
                                    border: '1px solid rgba(56, 189, 248, 0.3)',
                                  }}
                                >
                                  ✓ Factible
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem' }}>
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                color: catBadge.color,
                                background: catBadge.bg,
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {catBadge.label}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                            {m.probModelo}%
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', fontVariantNumeric: 'tabular-nums' }}>
                            {m.cuotaReal != null ? (
                              m.casaApuesta === 'Winamax' ? (
                                <span
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#EF4444',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title="Cuota oficial de Winamax"
                                >
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
                                  Winamax: {m.cuotaReal.toFixed(2)}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10B981',
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title="Cuota oficial de Bet365"
                                >
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                                  Bet365: {m.cuotaReal.toFixed(2)}
                                </span>
                              )
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)' }}>Sin cuota disponible</span>
                            )}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                            {m.lectura}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Leyenda de Casas de Apuestas */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                marginTop: '0.75rem',
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                padding: '0.5rem 0.75rem',
                background: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                <strong style={{ color: '#10B981' }}>Verde:</strong> Cuota de Bet365
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></span>
                <strong style={{ color: '#EF4444' }}>Rojo:</strong> Cuota de Winamax
              </span>
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

