import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  emptyMessage?: string;
}

export default function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  pagination,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="text-center py-12 text-slate-500">{emptyMessage}</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              {columns.map((col) => (
                <th key={String(col.key)} className={`px-6 py-3 text-left text-sm font-medium text-slate-900 dark:text-white ${col.width || ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={String(row.id)}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-slate-200 dark:border-slate-700 ${
                  onRowClick ? 'hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                    {col.render ? col.render((row as any)[col.key], row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)} · Total: {pagination.total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}