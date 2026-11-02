import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function Disclaimer() {
  return (
    <footer className="disclaimer-banner" role="contentinfo">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <ShieldCheck size={14} color="var(--color-secondary)" aria-hidden="true" />
        <span>
          <strong>Aviso analítico:</strong> Esta plataforma presenta modelos estadísticos y frecuencias históricas con fines puramente informativos. Las proyecciones son estimaciones matemáticas teóricas, no resultados garantizados ni promesas de rentabilidad económica.
        </span>
      </div>
    </footer>
  );
}
