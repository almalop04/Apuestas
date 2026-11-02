import React from 'react';

interface CountryFlagProps {
  country?: string;
  leagueName?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente que renderiza banderas visuales reales en formato SVG vectorial de alta definición.
 * Evita el problema de fuentes en Windows donde los emojis de banderas (🇪🇸, 🇬🇧, etc.)
 * se renderizan como letras de texto ('ES', 'GB').
 */
export function CountryFlag({
  country = '',
  leagueName = '',
  width = 26,
  height = 18,
  className = '',
  style,
}: CountryFlagProps) {
  const c = country.toLowerCase().trim();
  const l = leagueName.toLowerCase().trim();

  // Detección de bandera europea (competiciones UEFA, Euroliga, Eurocup, BCL o país 'Europa')
  const isEurope =
    c.includes('europa') ||
    c.includes('europe') ||
    c.includes('uefa') ||
    l.includes('champions') ||
    l.includes('europa league') ||
    l.includes('conference') ||
    l.includes('euroliga') ||
    l.includes('eurocup') ||
    l.includes('bcl');

  const baseStyle: React.CSSProperties = {
    display: 'inline-block',
    verticalAlign: 'middle',
    borderRadius: '3px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    flexShrink: 0,
    ...style,
  };

  // 1. EUROPA (Bandera oficial de la Unión Europea / Competiciones Europeas)
  if (isEurope) {
    return (
      <svg
        viewBox="0 0 810 540"
        width={width}
        height={height}
        className={className}
        style={baseStyle}
        role="img"
        aria-label="Bandera de Europa"
      >
        <rect width="810" height="540" fill="#003399" />
        <g fill="#FFCC00" transform="translate(405, 270)">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <polygon
              key={deg}
              points="0,-24 7.0,-7.8 22.8,-7.4 10.3,2.2 14.8,17.4 0,8.4 -14.8,17.4 -10.3,2.2 -22.8,-7.4 -7.0,-7.8"
              transform={`rotate(${deg}) translate(0, -170)`}
            />
          ))}
        </g>
      </svg>
    );
  }

  // 2. ESPAÑA
  if (c.includes('españa') || c.includes('spain')) {
    return (
      <svg
        viewBox="0 0 750 500"
        width={width}
        height={height}
        className={className}
        style={baseStyle}
        role="img"
        aria-label="Bandera de España"
      >
        {/* Franjas oficiales: Rojo, Amarillo (doble de ancho), Rojo */}
        <rect width="750" height="500" fill="#AA151B" />
        <rect y="125" width="750" height="250" fill="#F1BF00" />
        {/* Escudo simplificado elegante */}
        <g transform="translate(225, 250)">
          {/* Corona */}
          <path d="M -30,-48 L -15,-32 L 0,-52 L 15,-32 L 30,-48 L 22,-20 L -22,-20 Z" fill="#AA151B" stroke="#AA151B" strokeWidth="2" />
          <circle cx="0" cy="-56" r="4" fill="#AA151B" />
          <circle cx="-30" cy="-52" r="3" fill="#AA151B" />
          <circle cx="30" cy="-52" r="3" fill="#AA151B" />
          {/* Escudo central */}
          <path d="M -32,-16 L 32,-16 L 32,24 C 32,48 0,62 0,62 C 0,62 -32,48 -32,24 Z" fill="#AA151B" />
          <path d="M -26,-12 L 26,-12 L 26,22 C 26,42 0,54 0,54 C 0,54 -26,42 -26,22 Z" fill="#F1BF00" />
          <line x1="0" y1="-12" x2="0" y2="52" stroke="#AA151B" strokeWidth="3" />
          <line x1="-26" y1="16" x2="26" y2="16" stroke="#AA151B" strokeWidth="3" />
          {/* Columnas de Hércules */}
          <rect x="-48" y="-24" width="8" height="66" rx="2" fill="#AA151B" />
          <rect x="40" y="-24" width="8" height="66" rx="2" fill="#AA151B" />
          <rect x="-52" y="-30" width="16" height="6" rx="1" fill="#AA151B" />
          <rect x="36" y="-30" width="16" height="6" rx="1" fill="#AA151B" />
        </g>
      </svg>
    );
  }

  // 3. INGLATERRA (Cruz de San Jorge / England)
  if (c.includes('inglaterra') || c.includes('england')) {
    return (
      <svg
        viewBox="0 0 750 500"
        width={width}
        height={height}
        className={className}
        style={baseStyle}
        role="img"
        aria-label="Bandera de Inglaterra"
      >
        <rect width="750" height="500" fill="#FFFFFF" />
        <rect x="325" width="100" height="500" fill="#CE1124" />
        <rect y="200" width="750" height="100" fill="#CE1124" />
      </svg>
    );
  }

  // 4. ITALIA (Tricolor verde, blanco, rojo)
  if (c.includes('italia') || c.includes('italy')) {
    return (
      <svg
        viewBox="0 0 750 500"
        width={width}
        height={height}
        className={className}
        style={baseStyle}
        role="img"
        aria-label="Bandera de Italia"
      >
        <rect width="250" height="500" fill="#008C45" />
        <rect x="250" width="250" height="500" fill="#F4F5F0" />
        <rect x="500" width="250" height="500" fill="#CD212A" />
      </svg>
    );
  }

  // 5. ALEMANIA (Tricolor negro, rojo, oro)
  if (c.includes('alemania') || c.includes('germany')) {
    return (
      <svg
        viewBox="0 0 750 500"
        width={width}
        height={height}
        className={className}
        style={baseStyle}
        role="img"
        aria-label="Bandera de Alemania"
      >
        <rect width="750" height="166.7" fill="#000000" />
        <rect y="166.7" width="750" height="166.7" fill="#DD0000" />
        <rect y="333.4" width="750" height="166.6" fill="#FFCE00" />
      </svg>
    );
  }

  // 6. FRANCIA (Tricolor azul, blanco, rojo)
  if (c.includes('francia') || c.includes('france')) {
    return (
      <svg
        viewBox="0 0 750 500"
        width={width}
        height={height}
        className={className}
        style={baseStyle}
        role="img"
        aria-label="Bandera de Francia"
      >
        <rect width="250" height="500" fill="#002654" />
        <rect x="250" width="250" height="500" fill="#FFFFFF" />
        <rect x="500" width="250" height="500" fill="#ED2939" />
      </svg>
    );
  }

  // 7. ESTADOS UNIDOS (USA / NBA)
  if (c.includes('estados unidos') || c.includes('usa') || c.includes('eeuu')) {
    return (
      <svg
        viewBox="0 0 750 500"
        width={width}
        height={height}
        className={className}
        style={baseStyle}
        role="img"
        aria-label="Bandera de Estados Unidos"
      >
        {/* 13 franjas rojas y blancas */}
        <rect width="750" height="500" fill="#B22234" />
        {[1, 3, 5, 7, 9, 11].map((i) => (
          <rect key={i} y={i * (500 / 13)} width="750" height={500 / 13} fill="#FFFFFF" />
        ))}
        {/* Cantón azul */}
        <rect width="300" height={(500 / 13) * 7} fill="#3C3B6E" />
        {/* Estrellas representativas */}
        <g fill="#FFFFFF" transform="translate(10, 10)">
          {[0, 1, 2, 3, 4].map((row) =>
            [0, 1, 2, 3, 4, 5].map((col) => (
              <circle
                key={`${row}-${col}`}
                cx={col * 48 + (row % 2 === 1 ? 24 : 12)}
                cy={row * 46 + 18}
                r="6"
              />
            ))
          )}
        </g>
      </svg>
    );
  }

  // 8. INTERNACIONAL / MUNDIAL (Globo terráqueo azul FIFA/UN)
  return (
    <svg
      viewBox="0 0 750 500"
      width={width}
      height={height}
      className={className}
      style={baseStyle}
      role="img"
      aria-label="Competición Internacional"
    >
      <rect width="750" height="500" fill="#0072CE" />
      <circle cx="375" cy="250" r="140" fill="none" stroke="#FFFFFF" strokeWidth="12" />
      <ellipse cx="375" cy="250" rx="70" ry="140" fill="none" stroke="#FFFFFF" strokeWidth="10" />
      <line x1="235" y1="250" x2="515" y2="250" stroke="#FFFFFF" strokeWidth="10" />
      <line x1="260" y1="180" x2="490" y2="180" stroke="#FFFFFF" strokeWidth="8" />
      <line x1="260" y1="320" x2="490" y2="320" stroke="#FFFFFF" strokeWidth="8" />
    </svg>
  );
}
