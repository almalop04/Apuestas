import type { Metadata, Viewport } from 'next';
import './globals.css';
import Link from 'next/link';
import { Activity, BarChart2 } from 'lucide-react';
import { Disclaimer } from '@/components/ui/Disclaimer';

export const metadata: Metadata = {
  title: 'Analítica Deportiva Profesional | ProStats',
  description: 'Plataforma de estimación estadística deportiva para fútbol y baloncesto con separación estricta de frecuencias históricas y probabilidades teóricas.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0B1018',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* Cabecera persistente */}
        <header className="app-header">
          <div className="container header-inner">
            <Link href="/" className="brand-logo" aria-label="Ir al inicio de ProStats">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <BarChart2 size={20} color="var(--color-accent)" aria-hidden="true" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ letterSpacing: '-0.02em', lineHeight: 1.1 }}>PROSTATS</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                  Analítica Profesional
                </span>
              </div>
            </Link>

            <nav aria-label="Navegación principal">
              <span className="brand-badge">Terminal v1.0</span>
            </nav>
          </div>
        </header>

        {/* Contenido principal */}
        <main style={{ minHeight: 'calc(100vh - 120px)', padding: '1.5rem 0' }}>
          {children}
        </main>

        {/* Aviso fijo discreto de estimaciones estadísticas */}
        <Disclaimer />
      </body>
    </html>
  );
}
