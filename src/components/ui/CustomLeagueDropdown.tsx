'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Trophy, Check } from 'lucide-react';
import { CountryFlag } from './CountryFlag';

export interface LeagueItem {
  id: string;
  name: string;
  country: string;
  round?: string;
  count: number;
}

export interface CountryGroupItem {
  countryName: string;
  countryCode: string;
  leagues: LeagueItem[];
}

interface CustomLeagueDropdownProps {
  label: string;
  icon?: React.ReactNode;
  isActiveSport: boolean;
  onActivateSport: () => void;
  groups: CountryGroupItem[];
  selectedLeagueId: string;
  onSelectLeague: (leagueId: string) => void;
  totalSportMatches: number;
}

export function CustomLeagueDropdown({
  label,
  icon,
  isActiveSport,
  onActivateSport,
  groups,
  selectedLeagueId,
  onSelectLeague,
  totalSportMatches,
}: CustomLeagueDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Encontrar la liga actualmente seleccionada
  let currentLeague: LeagueItem | null = null;
  for (const g of groups) {
    const found = g.leagues.find((l) => l.id === selectedLeagueId);
    if (found) {
      currentLeague = found;
      break;
    }
  }

  const isAllSelected = selectedLeagueId === 'all';

  const handleToggle = () => {
    if (!isActiveSport) {
      onActivateSport();
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (id: string) => {
    if (!isActiveSport) {
      onActivateSport();
    }
    onSelectLeague(id);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        width: '100%',
        marginBottom: '1rem',
      }}
    >
      {/* Botón Principal del Desplegable (Trigger) */}
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.65rem',
          padding: '0.75rem 0.9rem',
          background: isActiveSport ? 'var(--color-surface)' : 'rgba(17, 26, 39, 0.4)',
          border: isActiveSport ? '1px solid var(--color-secondary)' : '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          boxShadow: isOpen ? '0 0 0 2px var(--color-secondary-subtle)' : 'none',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          if (!isActiveSport) e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
        }}
        onMouseLeave={(e) => {
          if (!isActiveSport) e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, overflow: 'hidden' }}>
          {/* Icono del deporte o bandera de la liga seleccionada */}
          {isAllSelected || !currentLeague ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 26,
                height: 19,
                color: isActiveSport ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                flexShrink: 0,
              }}
            >
              {icon || <Trophy size={16} />}
            </div>
          ) : (
            <CountryFlag
              country={currentLeague.country}
              leagueName={currentLeague.name}
              width={26}
              height={18}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: isActiveSport ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isAllSelected || !currentLeague ? `Todas las ligas (${label})` : currentLeague.name}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.1,
              }}
            >
              {isAllSelected || !currentLeague
                ? `${totalSportMatches} ${totalSportMatches === 1 ? 'partido hoy' : 'partidos hoy'}`
                : `${currentLeague.country} • ${currentLeague.count} ${currentLeague.count === 1 ? 'partido hoy' : 'partidos hoy'}`}
            </span>
          </div>
        </div>

        <ChevronDown
          size={16}
          color="var(--color-text-muted)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition-fast)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      </button>

      {/* Menú Desplegable Flotante Elegante */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            minWidth: '270px',
            maxHeight: '380px',
            overflowY: 'auto',
            background: '#0D1420',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75)',
            zIndex: 100,
            padding: '0.4rem',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Opción 1: Todas las ligas de este deporte */}
          <button
            type="button"
            role="option"
            aria-selected={isAllSelected}
            onClick={() => handleSelect('all')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              padding: '0.6rem 0.75rem',
              background: isAllSelected ? 'var(--color-secondary-subtle)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: isAllSelected ? 'var(--color-secondary)' : 'var(--color-text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '0.35rem',
              textAlign: 'left',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              if (!isAllSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              if (!isAllSelected) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }} aria-hidden="true">
                🏆
              </span>
              <span>Todas las ligas ({label})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: totalSportMatches > 0 ? 'rgba(91, 140, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                  color: totalSportMatches > 0 ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                }}
              >
                {totalSportMatches}
              </span>
              {isAllSelected && <Check size={14} color="var(--color-secondary)" />}
            </div>
          </button>

          <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '0.25rem 0 0.5rem' }} />

          {/* Grupos organizados por País (las ligas del mismo país seguidas una debajo de la otra) */}
          {groups.map((group) => (
            <div key={group.countryName} style={{ marginBottom: '0.65rem' }}>
              {/* Encabezado del País / Región */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
              >
                <CountryFlag country={group.countryName} width={16} height={11} />
                <span>{group.countryName}</span>
              </div>

              {/* Ligas de ese país */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.leagues.map((league) => {
                  const isSelected = selectedLeagueId === league.id;
                  const hasMatches = league.count > 0;

                  return (
                    <button
                      key={league.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(league.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        padding: '0.5rem 0.65rem',
                        background: isSelected ? 'var(--color-secondary-subtle)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: isSelected ? 'var(--color-secondary)' : 'var(--color-text-primary)',
                        fontSize: '0.8125rem',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Bandera primero, luego nombre */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                        <CountryFlag
                          country={league.country}
                          leagueName={league.name}
                          width={20}
                          height={14}
                        />
                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {league.name}
                        </span>
                      </div>

                      {/* Contador de partidos del día */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-full)',
                            background: hasMatches ? 'rgba(91, 140, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: hasMatches ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                          }}
                        >
                          {hasMatches ? `${league.count} hoy` : '0'}
                        </span>
                        {isSelected && <Check size={14} color="var(--color-secondary)" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
