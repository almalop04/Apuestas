import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
        Página no encontrada
      </h2>
      <p style={{ margin: '1rem 0', color: 'var(--color-text-secondary)' }}>
        El recurso solicitado o partido no está disponible.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-secondary)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-secondary)',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Volver al Panel Principal
      </Link>
    </div>
  );
}

