'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { TeamLogo } from '@/components/ui/TeamLogo';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.id as string;

  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const fetchTeam = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/team/${teamId}`);
        if (!res.ok) {
          throw new Error(`Equipo no encontrado (${res.status})`);
        }
        const data = await res.json();
        setTeamData(data.teamData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos del equipo.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  if (loading) {
    return (
      <div className="container">
        <Skeleton width="120px" height="24px" className="mb-4" />
        <Skeleton width="100%" height="140px" borderRadius="var(--radius-lg)" className="mb-4" />
        <Skeleton width="100%" height="260px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="container">
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-secondary)',
            marginBottom: '1.5rem',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Volver atrás</span>
        </button>
        <div style={{ background: 'var(--color-danger-subtle)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--color-danger)" style={{ margin: '0 auto 0.75rem' }} aria-hidden="true" />
          <h2 style={{ fontSize: '1.125rem', color: 'var(--color-danger)', marginBottom: '0.5rem' }}>
            Ficha de equipo no encontrada
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {error || 'No existen datos registrados para este identificador.'}
          </p>
        </div>
      </div>
    );
  }

  const { team, seasonStats, recentMatches } = teamData;

  const matchColumns = [
    { key: 'date', header: 'Fecha' },
    { key: 'opponent', header: 'Rival' },
    {
      key: 'score',
      header: 'Marcador',
      align: 'center' as const,
      render: (row: any) => (
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {row.score}
        </span>
      ),
    },
    {
      key: 'result',
      header: 'Resultado',
      align: 'right' as const,
      render: (row: any) => {
        if (row.result === 'W') return <Badge variant="win">Victoria</Badge>;
        if (row.result === 'L') return <Badge variant="loss">Derrota</Badge>;
        return <Badge variant="draw">Empate</Badge>;
      },
    },
  ];

  return (
    <div className="container">
      {/* Botón Volver */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => router.back()}
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
          <span>Volver a la vista anterior</span>
        </button>
      </div>

      {/* Cabecera del Equipo con Escudo */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <TeamLogo logoUrl={team.logoUrl} teamName={team.name} sport={team.sport} size={64} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                {team.name}
              </h1>
              <span className="brand-badge" style={{ textTransform: 'capitalize' }}>
                {team.sport === 'football' ? 'Fútbol' : 'Baloncesto'}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Abreviatura: <strong style={{ color: 'var(--color-text-primary)' }}>{team.shortName}</strong> • Temporada oficial en curso
            </p>
          </div>
        </div>
      </Card>

      {/* Resumen de Métricas de la Temporada */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {Object.entries(seasonStats).map(([label, val]) => (
          <Card key={label} style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
              {label}
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {String(val)}
            </div>
          </Card>
        ))}
      </div>

      {/* Tabla de Últimos Partidos con desplazamiento horizontal en móvil */}
      <Card>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
          Últimos Partidos Disputados
        </h2>
        <DataTable
          columns={matchColumns}
          data={recentMatches || []}
          caption={`Historial reciente de partidos disputados por ${team.name}`}
        />
      </Card>
    </div>
  );
}
