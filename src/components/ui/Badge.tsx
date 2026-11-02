import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

export type BadgeVariant = 'win' | 'draw' | 'loss' | 'nodata' | 'neutral' | 'success';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, icon, className = '' }: BadgeProps) {
  // Doble señalización garantizada: cada estado incluye un icono SVG semántico
  let defaultIcon: React.ReactNode = null;
  let variantClass = 'badge-neutral';

  switch (variant) {
    case 'win':
      variantClass = 'badge-win';
      defaultIcon = <ArrowUpRight size={13} aria-hidden="true" />;
      break;
    case 'loss':
      variantClass = 'badge-loss';
      defaultIcon = <ArrowDownRight size={13} aria-hidden="true" />;
      break;
    case 'draw':
      variantClass = 'badge-draw';
      defaultIcon = <Minus size={13} aria-hidden="true" />;
      break;
    case 'nodata':
      variantClass = 'badge-nodata';
      defaultIcon = <AlertTriangle size={13} aria-hidden="true" />;
      break;
    case 'success':
      variantClass = 'badge-win';
      defaultIcon = <CheckCircle2 size={13} aria-hidden="true" />;
      break;
    default:
      variantClass = 'badge-neutral';
      defaultIcon = null;
  }

  return (
    <span className={`badge ${variantClass} ${className}`}>
      {icon ?? defaultIcon}
      <span>{children}</span>
    </span>
  );
}
