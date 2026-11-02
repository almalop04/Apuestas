import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = 'var(--radius-sm)',
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
      aria-hidden="true"
    />
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <Skeleton width="140px" height="16px" />
        <Skeleton width="90px" height="20px" borderRadius="var(--radius-full)" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <Skeleton width="180px" height="24px" />
        <Skeleton width="50px" height="20px" />
        <Skeleton width="180px" height="24px" />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Skeleton width="50%" height="40px" borderRadius="var(--radius-md)" />
        <Skeleton width="50%" height="40px" borderRadius="var(--radius-md)" />
      </div>
    </div>
  );
}
