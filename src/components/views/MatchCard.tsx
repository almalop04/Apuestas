import React from 'react';
import Link from 'next/link';
import { ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import type { MatchDetail } from '@/core/models';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DataAvailabilityChip } from '../ui/DataAvailabilityChip';
import { TeamLogo } from '../ui/TeamLogo';
import { CountryFlag } from '../ui/CountryFlag';

interface MatchCardProps {
  match: MatchDetail;
}

export function MatchCard({ match }: MatchCardProps) {
  const freq = match.frequencies10;
  const isFootball = match.sport === 'football';
  const isSampleOk = match.dataAvailability.isSampleSufficient;

  return (
    <Card clickable className="match-card" style={{ marginBottom: '1rem' }}>
      {/* Cabecera de la tarjeta: Liga, Hora y Chip de Disponibilidad */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <CountryFlag
            country={match.league.country}
            leagueName={match.league.name}
            width={18}
            height={12}
          />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            {match.league.name}
          </span>
          {match.league.round && (
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--color-secondary)',
                background: 'var(--color-secondary-subtle)',
                border: '1px solid rgba(91, 140, 255, 0.25)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {match.league.round}
            </span>
          )}
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>•</span>
          {match.time.toLowerCase().includes('madrugada') ? (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#F59E0B',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
              title="Partido de madrugada (horario peninsular español)"
            >
              <span>🌙</span> {match.time}
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={12} aria-hidden="true" />
              {match.time}
            </span>
          )}
        </div>

        <DataAvailabilityChip availability={match.dataAvailability} />
      </div>

      {/* Cuerpo principal: Equipos con Escudos y Marcador/Estado */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Equipo Local con Escudo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
          <TeamLogo logoUrl={match.homeTeam.logoUrl} teamName={match.homeTeam.name} sport={match.sport} size={38} />
          <div>
            <Link
              href={`/team/${match.homeTeam.id}`}
              style={{
                fontSize: '1.0625rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                display: 'inline-block',
                lineHeight: 1.2,
              }}
              onClick={(e) => e.stopPropagation()}
              title="Ver ficha del equipo local"
            >
              {match.homeTeam.name}
            </Link>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Local
            </div>
          </div>
        </div>

        {/* Marcador o VS */}
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              padding: '0.25rem 0.65rem',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            VS
          </span>
        </div>

        {/* Equipo Visitante con Escudo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', textAlign: 'right' }}>
          <div>
            <Link
              href={`/team/${match.awayTeam.id}`}
              style={{
                fontSize: '1.0625rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                display: 'inline-block',
                lineHeight: 1.2,
              }}
              onClick={(e) => e.stopPropagation()}
              title="Ver ficha del equipo visitante"
            >
              {match.awayTeam.name}
            </Link>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Visitante
            </div>
          </div>
          <TeamLogo logoUrl={match.awayTeam.logoUrl} teamName={match.awayTeam.name} sport={match.sport} size={38} />
        </div>
      </div>

      {/* Separación Estricta: Frecuencia Histórica (Verde) vs Probabilidad Estimada (Azul) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.75rem',
          background: 'var(--color-surface-subtle)',
          padding: '0.875rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        {/* 1. Frecuencia Histórica (Verde esmeralda #2DD4A7) */}
        <div>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginBottom: '0.35rem',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)' }} />
            Rendimiento en la Temporada Actual
          </div>
          {freq.home.totalMatchesEvaluated > 0 || freq.away.totalMatchesEvaluated > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', gap: '0.5rem' }}>
              <span>{match.homeTeam.shortName || 'Local'}: <strong style={{ color: 'var(--color-accent)' }}>{freq.home.homeTeamWins}% vics</strong></span>
              <span>{match.awayTeam.shortName || 'Visitante'}: <strong style={{ color: 'var(--color-accent)' }}>{freq.away.homeTeamWins}% vics</strong></span>
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Sin datos oficiales de clasificación
            </div>
          )}
        </div>

        {/* 2. Probabilidad Estimada (Azul analítico #5B8CFF) */}
        <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '0.75rem' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginBottom: '0.35rem',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-secondary)' }} />
            Probabilidad por Rendimiento Real
          </div>
          {isSampleOk ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              <span>1: <strong style={{ color: 'var(--color-secondary)' }}>{match.probabilities.homeWinProb}%</strong></span>
              {isFootball && <span>X: <strong style={{ color: 'var(--color-secondary)' }}>{match.probabilities.drawProb}%</strong></span>}
              <span>2: <strong style={{ color: 'var(--color-secondary)' }}>{match.probabilities.awayWinProb}%</strong></span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-warning)', fontSize: '0.75rem', fontWeight: 600 }}>
              <AlertCircle size={13} aria-hidden="true" />
              <span>Sin datos suficientes para estimar</span>
            </div>
          )}
        </div>
      </div>

      {/* Pie de tarjeta con enlace a detalle y verificación en Flashscore */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.875rem' }}>
        {match.externalUrl ? (
          <a
            href={match.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-subtle)',
            }}
            title="Ver ficha oficial en Flashscore.es"
          >
            <span>🔗 Flashscore.es</span>
          </a>
        ) : <div />}

        <Link
          href={`/match/${match.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-secondary)',
          }}
        >
          <span>Ver análisis detallado y H2H</span>
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
