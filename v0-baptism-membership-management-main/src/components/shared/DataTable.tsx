import { ReactNode } from 'react';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  onRowClick,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={`border-b hover:bg-gray-50 transition ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4 text-sm text-gray-900">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
