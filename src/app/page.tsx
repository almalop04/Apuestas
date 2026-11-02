'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, AlertCircle, CircleDot, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import type { MatchDetail, SportType, ApiQuotaStatus } from '@/core/models';
import { MatchCardSkeleton } from '@/components/ui/Skeleton';
import { MatchCard } from '@/components/views/MatchCard';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { CustomLeagueDropdown, type CountryGroupItem } from '@/components/ui/CustomLeagueDropdown';
import { DateNavigator } from '@/components/ui/DateNavigator';
import { filterBettableMatches } from '@/core/utils/matchFilter';

interface LeagueGroup {
  leagueId: string;
  leagueName: string;
  country: string;
  round?: string;
  matches: MatchDetail[];
}

function getCountryBadge(country: string): { code: string; flag: string } {
  const c = country.toLowerCase().trim();
  if (c.includes('españa') || c.includes('spain')) return { code: 'ES', flag: '🇪🇸' };
  if (c.includes('inglaterra') || c.includes('england')) return { code: 'EN', flag: '🇬🇧' };
  if (c.includes('italia') || c.includes('italy')) return { code: 'IT', flag: '🇮🇹' };
  if (c.includes('alemania') || c.includes('germany')) return { code: 'DE', flag: '🇩🇪' };
  if (c.includes('francia') || c.includes('france')) return { code: 'FR', flag: '🇫🇷' };
  if (c.includes('estados unidos') || c.includes('usa')) return { code: 'USA', flag: '🇺🇸' };
  if (c.includes('europa') || c.includes('europe')) return { code: 'UEFA', flag: '🇪🇺' };
  return { code: 'INT', flag: '🌍' };
}

function getCountryFlag(country: string): string {
  return getCountryBadge(country).flag;
}

export default function DashboardPage() {
  const [sport, setSport] = useState<SportType>('football');
  const [dataMode, setDataMode] = useState<'live' | 'mock'>('live');
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [quota, setQuota] = useState<ApiQuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(() => Date.now());

  // Actualización periódica en vivo cada 10s: elimina partidos de la pantalla en cuanto llega su hora de inicio
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Filtrado reactivo: excluye inmediatamente partidos ya comenzados o finalizados para apuestas pre-partido
  const bettableMatches = useMemo(() => {
    return filterBettableMatches(matches, currentTimeMs);
  }, [matches, currentTimeMs]);

  const toggleGroup = (leagueId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [leagueId]: !prev[leagueId],
    }));
  };

  const fetchMatches = async (selectedSport: SportType, selectedMode: 'live' | 'mock', offset: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/matches?sport=${selectedSport}&mode=${selectedMode}&dayOffset=${offset}`);
      if (!res.ok) {
        throw new Error(`Error en el servidor al cargar partidos (${res.status})`);
      }
      const data = await res.json();
      setMatches(data.matches || []);
      setQuota(data.quota || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al conectar con los datos.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Sincronizar selección de deporte con los parámetros de la URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSport = params.get('sport');
      if (urlSport === 'basketball' || urlSport === 'football') {
        setSport(urlSport);
      }
    }
  }, []);

  useEffect(() => {
    setSelectedLeague('all');
    fetchMatches(sport, dataMode, dayOffset);
  }, [sport, dataMode, dayOffset]);

  const handleSportChange = (newSport: SportType) => {
    setSport(newSport);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('sport', newSport);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMatches(sport, dataMode, dayOffset);
  };

  // Cálculo de fechas dinámicas en tiempo real
  const targetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const fullDateString = useMemo(() => {
    const formatted = targetDate.toLocaleDateString('es-ES', {
      timeZone: 'Europe/Madrid',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [targetDate]);

  const dynamicTitle = useMemo(() => {
    const weekday = targetDate.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'Europe/Madrid' });
    if (dayOffset === 0) return 'Partidos del día de hoy';
    if (dayOffset === 1) return 'Partidos de mañana';
    if (dayOffset === -1) return 'Resultados y partidos de ayer';
    if (dayOffset > 1) return `Partidos del ${weekday}`;
    return `Resultados del ${weekday}`;
  }, [dayOffset, targetDate]);

  const getDayTabLabel = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dayNum = d.getDate();
    const monthShort = d.toLocaleDateString('es-ES', { month: 'short', timeZone: 'Europe/Madrid' }).replace('.', '');
    if (offset === 0) return `Hoy (${dayNum} ${monthShort})`;
    if (offset === 1) return `Mañana (${dayNum} ${monthShort})`;
    if (offset === -1) return `Ayer (${dayNum} ${monthShort})`;
    return `${dayNum} ${monthShort}`;
  };

  // Grupos de Fútbol organizados por país/ámbito con conteos en tiempo real
  const footballCountryGroups: CountryGroupItem[] = useMemo(() => {
    const counts: Record<string, number> = {};
    if (sport === 'football') {
      for (const m of bettableMatches) {
        let lid = m.league.id;
        if (lid === 'laliga') lid = 'esp.1';
        else if (lid === 'premier') lid = 'eng.1';
        else if (lid === 'copa') lid = 'esp.copa';
        counts[lid] = (counts[lid] || 0) + 1;
      }
    }

    return [
      {
        countryName: 'España',
        countryCode: 'ES',
        leagues: [
          { id: 'esp.1', name: 'LaLiga EA Sports', country: 'España', round: 'Jornada 11', count: counts['esp.1'] || 0 },
          { id: 'esp.2', name: 'LaLiga Hypermotion', country: 'España', round: 'Segunda División', count: counts['esp.2'] || 0 },
          { id: 'esp.copa', name: 'Copa del Rey', country: 'España', round: 'Ronda de Copa', count: counts['esp.copa'] || 0 },
          { id: 'esp.supercopa', name: 'Supercopa de España', country: 'España', round: 'Supercopa', count: counts['esp.supercopa'] || 0 },
        ],
      },
      {
        countryName: 'Inglaterra',
        countryCode: 'EN',
        leagues: [
          { id: 'eng.1', name: 'Premier League', country: 'Inglaterra', round: 'Jornada 10', count: counts['eng.1'] || 0 },
          { id: 'eng.fa', name: 'FA Cup', country: 'Inglaterra', round: 'Ronda de Copa', count: counts['eng.fa'] || 0 },
          { id: 'eng.efl', name: 'EFL Cup', country: 'Inglaterra', round: 'Octavos de Final', count: counts['eng.efl'] || 0 },
          { id: 'eng.shield', name: 'Community Shield', country: 'Inglaterra', round: 'Final', count: counts['eng.shield'] || 0 },
        ],
      },
      {
        countryName: 'Italia',
        countryCode: 'IT',
        leagues: [
          { id: 'ita.1', name: 'Serie A', country: 'Italia', round: 'Jornada 10', count: counts['ita.1'] || 0 },
          { id: 'ita.coppa', name: 'Coppa Italia', country: 'Italia', round: 'Ronda de Copa', count: counts['ita.coppa'] || 0 },
          { id: 'ita.supercoppa', name: 'Supercoppa Italiana', country: 'Italia', round: 'Supercoppa', count: counts['ita.supercoppa'] || 0 },
        ],
      },
      {
        countryName: 'Alemania',
        countryCode: 'DE',
        leagues: [
          { id: 'ger.1', name: 'Bundesliga', country: 'Alemania', round: 'Jornada 9', count: counts['ger.1'] || 0 },
          { id: 'ger.pokal', name: 'DFB-Pokal', country: 'Alemania', round: 'Ronda de Copa', count: counts['ger.pokal'] || 0 },
          { id: 'ger.supercup', name: 'DFL-Supercup', country: 'Alemania', round: 'Supercup', count: counts['ger.supercup'] || 0 },
        ],
      },
      {
        countryName: 'Francia',
        countryCode: 'FR',
        leagues: [
          { id: 'fra.1', name: 'Ligue 1', country: 'Francia', round: 'Jornada 10', count: counts['fra.1'] || 0 },
          { id: 'fra.coupe', name: 'Coupe de France', country: 'Francia', round: 'Ronda de Copa', count: counts['fra.coupe'] || 0 },
          { id: 'fra.trophee', name: 'Trophée des Champions', country: 'Francia', round: 'Supercopa', count: counts['fra.trophee'] || 0 },
        ],
      },
      {
        countryName: 'Competiciones Europeas (UEFA)',
        countryCode: 'UEFA',
        leagues: [
          { id: 'uefa.champions', name: 'UEFA Champions League', country: 'Europa', round: 'Fase de Liga (J3)', count: counts['uefa.champions'] || 0 },
          { id: 'uefa.europa', name: 'UEFA Europa League', country: 'Europa', round: 'Fase de Liga (J3)', count: counts['uefa.europa'] || 0 },
          { id: 'uefa.conference', name: 'UEFA Conference League', country: 'Europa', round: 'Fase de Liga (J2)', count: counts['uefa.conference'] || 0 },
          { id: 'uefa.supercup', name: 'Supercopa de Europa', country: 'Europa', round: 'Final', count: counts['uefa.supercup'] || 0 },
        ],
      },
      {
        countryName: 'Selecciones / Internacional',
        countryCode: 'INT',
        leagues: [
          { id: 'intl.nations', name: 'UEFA Nations League', country: 'Internacional', round: 'Fase de Grupos', count: counts['intl.nations'] || 0 },
          { id: 'intl.euro', name: 'Clasificación Eurocopa', country: 'Internacional', round: 'Fase de Clasificación', count: counts['intl.euro'] || 0 },
          { id: 'intl.worldcup', name: 'Clasificación Mundial FIFA', country: 'Internacional', round: 'Fase de Clasificación', count: counts['intl.worldcup'] || 0 },
          { id: 'intl.copaamerica', name: 'Copa América', country: 'Internacional', round: 'Fase de Grupos', count: counts['intl.copaamerica'] || 0 },
          { id: 'intl.friendlies', name: 'Amistosos Internacionales', country: 'Internacional', round: 'Ventana FIFA', count: counts['intl.friendlies'] || 0 },
        ],
      },
    ];
  }, [bettableMatches, sport]);

  // Grupos de Baloncesto organizados por país/ámbito con conteos en tiempo real
  const basketballCountryGroups: CountryGroupItem[] = useMemo(() => {
    const counts: Record<string, number> = {};
    if (sport === 'basketball') {
      for (const m of bettableMatches) {
        counts[m.league.id] = (counts[m.league.id] || 0) + 1;
      }
    }

    return [
      {
        countryName: 'Estados Unidos',
        countryCode: 'USA',
        leagues: [
          { id: 'nba', name: 'NBA', country: 'Estados Unidos', round: 'Temporada Regular', count: counts['nba'] || 0 },
        ],
      },
      {
        countryName: 'Competiciones Europeas',
        countryCode: 'UEFA',
        leagues: [
          { id: 'euroleague', name: 'Euroliga', country: 'Europa', round: 'Fase Regular', count: counts['euroleague'] || 0 },
          { id: 'eurocup', name: 'Eurocup', country: 'Europa', round: 'Fase de Grupos', count: counts['eurocup'] || 0 },
          { id: 'bcl', name: 'Basketball Champions League (BCL)', country: 'Europa', round: 'Fase de Grupos', count: counts['bcl'] || 0 },
        ],
      },
      {
        countryName: 'España',
        countryCode: 'ES',
        leagues: [
          { id: 'acb', name: 'Liga Endesa ACB', country: 'España', round: 'Jornada 5', count: counts['acb'] || 0 },
          { id: 'acb.copa', name: 'Copa del Rey ACB', country: 'España', round: 'Copa del Rey', count: counts['acb.copa'] || 0 },
          { id: 'acb.supercopa', name: 'Supercopa Endesa', country: 'España', round: 'Supercopa', count: counts['acb.supercopa'] || 0 },
        ],
      },
    ];
  }, [bettableMatches, sport]);

  // Filtrar los partidos según la liga seleccionada
  const filteredMatches = useMemo(() => {
    if (selectedLeague === 'all') {
      return bettableMatches;
    }
    return bettableMatches.filter((m) => {
      if (m.league.id === selectedLeague) return true;
      if (sport === 'football') {
        if (selectedLeague === 'esp.1' && (m.league.id === 'laliga' || m.league.id === 'esp.1')) return true;
        if (selectedLeague === 'esp.2' && (m.league.id === 'hypermotion' || m.league.id === 'esp.2')) return true;
        if (selectedLeague === 'eng.1' && (m.league.id === 'premier' || m.league.id === 'eng.1')) return true;
        if (selectedLeague === 'esp.copa' && (m.league.id === 'copa' || m.league.id === 'esp.copa')) return true;
      }
      return false;
    });
  }, [bettableMatches, sport, selectedLeague]);

  const activeLeagueInfo = useMemo(() => {
    if (selectedLeague === 'all') return null;
    const allGroups = sport === 'football' ? footballCountryGroups : basketballCountryGroups;
    for (const g of allGroups) {
      const found = g.leagues.find((l) => l.id === selectedLeague);
      if (found) return found;
    }
    return null;
  }, [sport, selectedLeague, footballCountryGroups, basketballCountryGroups]);

  // Agrupar los partidos filtrados por competición / liga
  const groupedMatches: LeagueGroup[] = useMemo(() => {
    const groupsMap = new Map<string, LeagueGroup>();

    for (const match of filteredMatches) {
      const lid = match.league.id;
      if (!groupsMap.has(lid)) {
        groupsMap.set(lid, {
          leagueId: lid,
          leagueName: match.league.name,
          country: match.league.country,
          round: match.league.round,
          matches: [],
        });
      }
      groupsMap.get(lid)!.matches.push(match);
    }

    return Array.from(groupsMap.values());
  }, [filteredMatches]);

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="dashboard-layout">
        {/* PANEL LATERAL IZQUIERDO */}
        <aside
          className="dashboard-sidebar"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Cabecera del Panel Lateral */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.85rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-secondary)',
                  display: 'block',
                }}
              >
                Panel de Control
              </span>
              <h2
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  margin: '2px 0 0 0',
                }}
              >
                Competiciones
              </h2>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              aria-label="Actualizar datos en vivo"
              title="Actualizar datos"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? 'animate-spin' : ''}
                style={{
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                }}
              />
            </button>
          </div>

          {/* 1. SECCIÓN FÚTBOL: Menú desplegable con todas las ligas */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.45rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: sport === 'football' ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>⚽</span> Fútbol
              </span>
              {sport === 'football' && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: 'var(--color-accent)',
                    background: 'var(--color-accent-subtle)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  Activo
                </span>
              )}
            </div>

            <CustomLeagueDropdown
              label="Fútbol"
              icon={<span>⚽</span>}
              isActiveSport={sport === 'football'}
              onActivateSport={() => handleSportChange('football')}
              groups={footballCountryGroups}
              selectedLeagueId={sport === 'football' ? selectedLeague : 'all'}
              onSelectLeague={(id) => {
                if (sport !== 'football') handleSportChange('football');
                setSelectedLeague(id);
              }}
              totalSportMatches={sport === 'football' ? bettableMatches.length : 0}
            />
          </div>

          {/* 2. SECCIÓN BALONCESTO: Menú desplegable con todas las ligas */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.45rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: sport === 'basketball' ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>🏀</span> Baloncesto
              </span>
              {sport === 'basketball' && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: 'var(--color-accent)',
                    background: 'var(--color-accent-subtle)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  Activo
                </span>
              )}
            </div>

            <CustomLeagueDropdown
              label="Baloncesto"
              icon={<span>🏀</span>}
              isActiveSport={sport === 'basketball'}
              onActivateSport={() => handleSportChange('basketball')}
              groups={basketballCountryGroups}
              selectedLeagueId={sport === 'basketball' ? selectedLeague : 'all'}
              onSelectLeague={(id) => {
                if (sport !== 'basketball') handleSportChange('basketball');
                setSelectedLeague(id);
              }}
              totalSportMatches={sport === 'basketball' ? bettableMatches.length : 0}
            />
          </div>

          <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '1rem 0' }} />

          {/* 3. DÍA EN EL QUE ESTAMOS HOY CON FLECHA ATRÁS Y ADELANTE */}
          <DateNavigator
            dayOffset={dayOffset}
            onChangeDayOffset={(newOffset) => setDayOffset(newOffset)}
          />
        </aside>

        {/* CONTENIDO PRINCIPAL (DERECHA) */}
        <main className="dashboard-main">

          {/* Banner Informativo cuando se filtra por una liga específica */}
          {selectedLeague !== 'all' && activeLeagueInfo && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.875rem 1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Trophy size={20} color="var(--color-secondary)" aria-hidden="true" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {activeLeagueInfo.name}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      ({activeLeagueInfo.country})
                    </span>
                    {activeLeagueInfo.round && (
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
                        {activeLeagueInfo.round}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Mostrando únicamente los encuentros oficiales programados para esta jornada ({filteredMatches.length} partidos)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeague('all')}
                style={{
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  padding: '0.4rem 0.8rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                  e.currentTarget.style.borderColor = 'var(--color-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                ✕ Ver todas las ligas
              </button>
            </div>
          )}

          {/* Título de la sección y metadatos con Fecha Dinámica */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {dynamicTitle}
                </h1>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: dayOffset === 0 ? 'var(--color-primary)' : 'var(--color-secondary)',
                    background: dayOffset === 0 ? 'var(--color-primary-subtle)' : 'var(--color-secondary-subtle)',
                    border: `1px solid ${dayOffset === 0 ? 'rgba(45, 212, 167, 0.25)' : 'rgba(91, 140, 255, 0.25)'}`,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {fullDateString}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {sport === 'football'
                  ? selectedLeague === 'all'
                    ? 'Fútbol Oficial (5 Grandes Ligas, Copas y UEFA) • Actualizado automáticamente cada día'
                    : `${activeLeagueInfo?.name || 'Competición'} • ${activeLeagueInfo?.round || 'Jornada oficial'}`
                  : selectedLeague === 'all'
                    ? 'Baloncesto Oficial (NBA, Euroliga, Liga Endesa ACB, Eurocup y BCL) • Actualizado automáticamente cada día'
                    : `${activeLeagueInfo?.name || 'Competición'} • ${activeLeagueInfo?.round || 'Jornada oficial'}`}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '4px' }}>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {filteredMatches.length} {filteredMatches.length === 1 ? 'partido para apostar' : 'partidos para apostar'}
              </span>
              {matches.length > bettableMatches.length && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border-subtle)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  title="Los partidos que ya han comenzado o finalizado se retiran de la pantalla porque ya no se pueden realizar apuestas pre-partido."
                >
                  🔒 {matches.length - bettableMatches.length} ya comenzados (retirados)
                </span>
              )}
            </div>
          </div>

          {/* ESTADO 1: CARGANDO (ESQUELETOS DE CARGA) */}
          {loading && (
            <div role="status" aria-label="Cargando partidos de hoy">
              <MatchCardSkeleton />
              <MatchCardSkeleton />
              <MatchCardSkeleton />
            </div>
          )}

          {/* ESTADO 2: ERROR CON MENSAJE ACCIONABLE */}
          {!loading && error && (
            <div
              role="alert"
              style={{
                background: 'var(--color-danger-subtle)',
                border: '1px solid var(--color-danger)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                textAlign: 'center',
              }}
            >
              <AlertCircle size={32} color="var(--color-danger)" style={{ margin: '0 auto 0.75rem' }} aria-hidden="true" />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-danger)', marginBottom: '0.5rem' }}>
                No se pudieron cargar los datos
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 1.25rem' }}>
                {error}
              </p>
              <button
                type="button"
                onClick={() => fetchMatches(sport, dataMode)}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-primary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Reintentar carga
              </button>
            </div>
          )}

          {/* ESTADO 3: VACÍO GLOBAL (SIN PARTIDOS EN LA JORNADA GENERAL) */}
          {!loading && !error && matches.length === 0 && (
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem 1.5rem',
                textAlign: 'center',
              }}
            >
              <CircleDot size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 0.75rem' }} aria-hidden="true" />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Sin partidos programados para esta fecha
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                No hay encuentros agendados en el calendario oficial para {sport === 'football' ? 'fútbol' : 'baloncesto'}.
              </p>
            </div>
          )}

          {/* ESTADO 3B: TODOS LOS PARTIDOS YA HAN COMENZADO O FINALIZADO */}
          {!loading && !error && matches.length > 0 && bettableMatches.length === 0 && (
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem 1.5rem',
                textAlign: 'center',
              }}
            >
              <CircleDot size={32} color="var(--color-warning)" style={{ margin: '0 auto 0.75rem' }} aria-hidden="true" />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Todos los partidos de hoy ya han comenzado
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
                Los {matches.length} partidos programados para hoy ya están en juego o han concluido. Como las casas de apuestas (Bet365 / Winamax) cierran las apuestas pre-partido una vez comienza el encuentro, se han retirado de la pantalla.
              </p>
              <button
                type="button"
                onClick={() => setDayOffset((prev) => prev + 1)}
                style={{
                  padding: '0.6rem 1.4rem',
                  background: 'var(--color-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: '#0D1117',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>📅 Ver partidos de mañana</span>
              </button>
            </div>
          )}

          {/* ESTADO 4: VACÍO POR FILTRO DE LIGA (LA LIGA SELECCIONADA YA COMENZÓ O NO JUEGA HOY) */}
          {!loading && !error && bettableMatches.length > 0 && filteredMatches.length === 0 && (
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem 1.5rem',
                textAlign: 'center',
              }}
            >
              <Trophy size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 0.75rem' }} aria-hidden="true" />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Sin partidos pendientes para {activeLeagueInfo?.name}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
                Los encuentros de esta competición para hoy ya han comenzado o no hay partidos pendientes programados.
              </p>
              <button
                type="button"
                onClick={() => setSelectedLeague('all')}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-secondary)',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Ver todas las ligas disponibles
              </button>
            </div>
          )}

          {/* ESTADO 5: ÉXITO (LISTADO DE PARTIDOS AGRUPADOS POR COMPETICIÓN / LIGA) */}
          {!loading && !error && groupedMatches.length > 0 && (
            <div className="matches-by-league" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {groupedMatches.map((group) => {
                const isCollapsed = Boolean(collapsedGroups[group.leagueId]);
                return (
                  <section
                    key={group.leagueId}
                    aria-label={`Competición: ${group.leagueName}`}
                    style={{
                      background: 'rgba(17, 26, 39, 0.45)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.25rem',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {/* Cabecera Principal de la Competición / Liga */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleGroup(group.leagueId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleGroup(group.leagueId);
                        }
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        padding: '0.85rem 1.15rem',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border-subtle)',
                        borderLeft: '4px solid var(--color-secondary)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: isCollapsed ? '0' : '1.1rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <CountryFlag
                          country={group.country}
                          leagueName={group.leagueName}
                          width={28}
                          height={19}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                            {group.leagueName}
                          </h2>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                            ({group.country})
                          </span>
                          {group.round && (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                color: 'var(--color-secondary)',
                                background: 'var(--color-secondary-subtle)',
                                border: '1px solid rgba(91, 140, 255, 0.25)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              {group.round}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--color-text-secondary)',
                            background: 'var(--color-surface-subtle)',
                            border: '1px solid var(--color-border)',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {group.matches.length} {group.matches.length === 1 ? 'partido' : 'partidos'}
                        </span>
                        {isCollapsed ? (
                          <ChevronDown size={18} color="var(--color-text-muted)" aria-hidden="true" />
                        ) : (
                          <ChevronUp size={18} color="var(--color-text-muted)" aria-hidden="true" />
                        )}
                      </div>
                    </div>

                    {/* Listado de partidos que pertenecen a esta competición */}
                    {!isCollapsed && (
                      <div className="matches-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {group.matches.map((m) => (
                          <MatchCard key={m.id} match={m} />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
