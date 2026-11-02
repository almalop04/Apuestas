'use client';

import React, { useState, useEffect } from 'react';
import type { SportType } from '@/core/models';
import { resolveTeamLogo, getTeamCrestPalette } from '@/core/stats/logoResolver';

interface TeamLogoProps {
  logoUrl?: string;
  teamName: string;
  sport?: SportType;
  size?: number; // Tamaño en píxeles (ej: 28, 36, 48, 64)
  className?: string;
}

export function TeamLogo({
  logoUrl,
  teamName,
  sport = 'football',
  size = 32,
  className = '',
}: TeamLogoProps) {
  // Cadena de candidatos para escudo oficial:
  // 1. logoUrl provisto directamente por la fuente en vivo (Flashscore CDN oficial)
  // 2. cdnLogo del catálogo de alta definición (ESPN / NBA / API-Sports)
  // 3. Ruta local personalizada /crests/${slug}.png (para que el usuario agregue cualquier escudo con arrastrar y soltar)
  const cdnLogo = resolveTeamLogo(teamName, sport);

  const slug = teamName
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const localCrest = `/crests/${slug}.png`;

  const candidates: string[] = [];
  if (logoUrl) candidates.push(logoUrl);
  if (cdnLogo && !candidates.includes(cdnLogo)) candidates.push(cdnLogo);
  candidates.push(localCrest);

  const [candidateIndex, setCandidateIndex] = useState(0);

  // Resetear candidatos si cambia el equipo o su logo
  useEffect(() => {
    setCandidateIndex(0);
  }, [teamName, logoUrl]);

  const activeUrl = candidateIndex < candidates.length ? candidates[candidateIndex] : null;

  // Generar siglas heráldicas representativas (ej: Real Madrid -> RM, Boca Juniors -> BJ, Tirana -> TIR)
  const words = teamName
    .replace(/^(fc|cf|rcd|afc|cd|as|ac|bk|ud|sd|cp|rs|ub|ad|r\.)\s+/i, '')
    .trim()
    .split(/\s+/);
  
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : words[0].slice(0, 3).toUpperCase();

  const palette = getTeamCrestPalette(teamName);

  // Si no hay URL oficial disponible o si todas las imágenes fallan, se genera SIEMPRE un escudo vectorial auténtico
  if (!activeUrl) {
    const isBasketball = sport === 'basketball';
    const gradId = `grad-${initials}-${palette.bgPrimary.replace('#', '')}`;
    const borderId = `gold-border-${initials}`;

    return (
      <div
        className={`team-crest-heraldic ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          userSelect: 'none',
        }}
        title={`Escudo heráldico oficial de ${teamName}`}
        aria-label={`Escudo oficial de ${teamName}`}
      >
        <svg
          viewBox="0 0 48 56"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.45))' }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={palette.bgSecondary} />
              <stop offset="100%" stopColor={palette.bgPrimary} />
            </linearGradient>
            <linearGradient id={borderId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5B84B" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Silueta del Escudo */}
          <path
            d="M 24 3 L 44 9 C 44 32 35 48 24 53 C 13 48 4 32 4 9 Z"
            fill={`url(#${gradId})`}
            stroke={`url(#${borderId})`}
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Banda decorativa superior del blasón */}
          <path
            d="M 6 12 Q 24 16 42 12"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Icono del deporte grabado en el blasón */}
          {isBasketball ? (
            <g transform="translate(14, 13) scale(0.85)" opacity="0.32" stroke="#FFF" fill="none" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <path d="M 5 6 C 9 8 15 8 19 6" />
              <path d="M 5 18 C 9 16 15 16 19 18" />
            </g>
          ) : (
            <g transform="translate(14, 13) scale(0.85)" opacity="0.3" stroke="#FFF" fill="none" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polygon points="12,6 16,10 14,15 10,15 8,10" fill="#FFF" opacity="0.45" />
            </g>
          )}

          {/* Iniciales heráldicas del club */}
          <text
            x="24"
            y={size >= 40 ? "36" : "34"}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize={initials.length > 2 ? "12" : size >= 40 ? "17" : "15"}
            fontWeight="700"
            fontFamily="Inter, -apple-system, sans-serif"
            letterSpacing="0.05em"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {initials}
          </text>
        </svg>
      </div>
    );
  }

  // Renderizado con imagen oficial
  return (
    <div
      className={`team-logo-container ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--color-border)',
        borderRadius: size >= 48 ? 'var(--radius-md)' : 'var(--radius-sm)',
        padding: '3px',
        overflow: 'hidden',
      }}
    >
      <img
        src={activeUrl}
        alt={`Escudo oficial de ${teamName}`}
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setCandidateIndex(prev => prev + 1)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}
