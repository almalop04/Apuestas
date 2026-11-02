'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';
import type { MatchDetail } from '@/core/models';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { DataAvailabilityChip } from '@/components/ui/DataAvailabilityChip';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { ComparisonBar } from '@/components/ui/ComparisonBar';
import { ProbabilityVsFrequency } from '@/components/views/ProbabilityVsFrequency';
import { Skeleton } from '@/components/ui/Skeleton';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { AiAnalysisCard } from '@/components/views/AiAnalysisCard';

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/match/${matchId}`);
        if (!res.ok) {
          throw new Error(`No se pudo encontrar el partido solicitado (${res.status})`);
        }
        const data = await res.json();
        setMatch(data.match);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la ficha del encuentro.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [matchId]);

  if (loading) {
    return (
      <div className="container">
        <Skeleton width="120px" height="24px" className="mb-4" />
        <Skeleton width="100%" height="160px" borderRadius="var(--radius-lg)" className="mb-4" />
        <Skeleton width="100%" height="320px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="container">
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-secondary)', marginBottom: '1.5rem', fontWeight: 500 }}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Volver al Dashboard</span>
        </Link>
        <div style={{ background: 'var(--color-danger-subtle)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--color-danger)" style={{ margin: '0 auto 0.75rem' }} aria-hidden="true" />
          <h2 style={{ fontSize: '1.125rem', color: 'var(--color-danger)', marginBottom: '0.5rem' }}>
            Partido no disponible
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {error || 'El encuentro no existe o ha sido desprogramado.'}
          </p>
        </div>
      </div>
    );
  }

  const isFootball = match.sport === 'football';
  const frequencies = match.frequencies10;

  // Columnas para la tabla H2H
  const h2hColumns = [
    { key: 'date', header: 'Fecha', render: (row: any) => row.date },
    { key: 'competition', header: 'Competición' },
    {
      key: 'score',
      header: 'Marcador',
      align: 'center' as const,
      render: (row: any) => (
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {row.homeScore} - {row.awayScore}
        </span>
      ),
    },
    {
      key: 'result',
      header: 'Resultado',
      align: 'right' as const,
      render: (row: any) => {
        if (row.winner === 'home') return <Badge variant="win">Victoria Local</Badge>;
        if (row.winner === 'away') return <Badge variant="loss">Victoria Visitante</Badge>;
        return <Badge variant="draw">Empate</Badge>;
      },
    },
  ];

  return (
    <div className="container">
      {/* Botón de volver (Máximo 2 clics) */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '0.4rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-surface)',
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Volver al Dashboard de Partidos</span>
        </Link>
      </div>

      {/* Cabecera del Partido */}
      <Card style={{ marginBottom: '1.5rem', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <CountryFlag country={match.league.country} leagueName={match.league.name} width={22} height={15} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
              {match.league.name}
            </span>
            {match.league.round && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-secondary)',
                  background: 'var(--color-secondary-subtle)',
                  border: '1px solid rgba(91, 140, 255, 0.25)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {match.league.round}
              </span>
            )}
            <span style={{ color: 'var(--color-text-muted)' }}>•</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={13} aria-hidden="true" />
              {match.date}
            </span>
            {match.time.toLowerCase().includes('madrugada') ? (
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#F59E0B',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <span>🌙</span> {match.time}
              </span>
            ) : (
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={13} aria-hidden="true" />
                {match.time}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {match.externalUrl && (
              <a
                href={match.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-subtle)',
                  fontWeight: 500,
                }}
                title="Abrir partido en Flashscore.es"
              >
                <span>🔗 Ver en Flashscore.es</span>
              </a>
            )}
            <DataAvailabilityChip availability={match.dataAvailability} />
          </div>
        </div>

        {/* Nombres de los equipos y enlaces a sus fichas con escudos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderTop: '1px solid var(--color-border-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
          {/* Local con Escudo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
            <TeamLogo logoUrl={match.homeTeam.logoUrl} teamName={match.homeTeam.name} sport={match.sport} size={52} />
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                <Link href={`/team/${match.homeTeam.id}`} style={{ color: 'var(--color-text-primary)' }} title="Ver ficha completa del equipo local">
                  {match.homeTeam.name}
                </Link>
              </h1>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-secondary)', fontWeight: 500 }}>
                Equipo Local
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 600, padding: '0.4rem 0.85rem', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)' }}>
              VS
            </span>
          </div>

          {/* Visitante con Escudo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', textAlign: 'right' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                <Link href={`/team/${match.awayTeam.id}`} style={{ color: 'var(--color-text-primary)' }} title="Ver ficha completa del equipo visitante">
                  {match.awayTeam.name}
                </Link>
              </h2>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-accent)', fontWeight: 500 }}>
                Equipo Visitante
              </span>
            </div>
            <TeamLogo logoUrl={match.awayTeam.logoUrl} teamName={match.awayTeam.name} sport={match.sport} size={52} />
          </div>
        </div>

        {match.venue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
            <MapPin size={13} aria-hidden="true" />
            <span>{match.venue}</span>
          </div>
        )}
      </Card>

      {/* Título de la sección de análisis oficial de la temporada */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Rendimiento en la Temporada y Análisis Probabilístico
        </h2>
      </div>

      {/* Bloque: Rendimiento Oficial de la Temporada vs Probabilidad */}
      <ProbabilityVsFrequency
        frequencies={frequencies}
        probabilities={match.probabilities}
        homeTeamName={match.homeTeam.name}
        awayTeamName={match.awayTeam.name}
        isFootball={isFootball}
        isSampleSufficient={match.dataAvailability.isSampleSufficient}
        competitionName={match.league.name}
        sourceName={match.dataAvailability.sourceName}
        lastUpdated={match.dataAvailability.lastUpdated}
      />

      {/* Tarjeta de Análisis IA y Cuotas Justas (Gemini Free Tier) */}
      <AiAnalysisCard
        matchId={match.id}
        homeTeamName={match.homeTeam.name}
        awayTeamName={match.awayTeam.name}
        isFootball={isFootball}
      />

      {/* Barras Comparativas de Métricas Avanzadas */}
      {match.metrics && match.metrics.length > 0 && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
            Métricas Cara a Cara ({match.homeTeam.shortName} vs {match.awayTeam.shortName})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {match.metrics.map((metric) => (
              <ComparisonBar
                key={metric.id}
                label={metric.label}
                homeValue={metric.homeValue}
                awayValue={metric.awayValue}
                homeTeamName={match.homeTeam.name}
                awayTeamName={match.awayTeam.name}
                unit={metric.unit}
                isHigherBetter={metric.isHigherBetter}
              />
            ))}
          </div>
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
            <span>Fuente: {match.dataAvailability.sourceName}</span>
            <span>Actualizado: {match.dataAvailability.lastUpdated}</span>
          </div>
        </Card>
      )}

      {/* Historial Cara a Cara (Head to Head) */}
      {(() => {
        const realH2H = (match.headToHead || []).filter(
          (row) =>
            row.date &&
            row.date !== '' &&
            !row.date.toLowerCase().includes('temporada pasada') &&
            !row.date.toLowerCase().includes('jornada anterior') &&
            !row.date.toLowerCase().includes('temporada anterior')
        );

        return (
          <Card style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Historial Directo (Cara a Cara)
              </h3>
              {realH2H.length === 0 && (
                <Badge variant="nodata">Sin datos previos</Badge>
              )}
            </div>

            {realH2H.length > 0 ? (
              <DataTable
                columns={h2hColumns}
                data={realH2H}
                caption="Encuentros previos directos entre ambos equipos"
                emptyMessage="Sin datos de enfrentamientos directos previos registrados con fecha oficial."
              />
            ) : (
              <div
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--color-border)',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.8125rem',
                }}
              >
                Sin datos de enfrentamientos directos previos registrados con fecha oficial entre ambos equipos en esta competición.
              </div>
            )}

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
              <span>Fuente: {match.dataAvailability.sourceName}</span>
              <span>Actualizado: {match.dataAvailability.lastUpdated}</span>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
