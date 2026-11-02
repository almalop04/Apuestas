import React from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  caption?: string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  caption,
  emptyMessage = 'Sin registros disponibles.',
  className = '',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={`table-container ${className}`} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`} tabIndex={0} role="region" aria-label={caption || 'Tabla de datos'}>
      <table className="data-table">
        {caption && <caption style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.align === 'right' ? 'num' : ''}
                style={{ textAlign: col.align || 'left' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={col.align === 'right' ? 'num' : ''}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render ? col.render(row, rowIndex) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
