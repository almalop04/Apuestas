import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  clickable?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Card({ clickable = false, children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`card ${clickable ? 'card-clickable' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
