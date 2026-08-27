export default function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 bg-slate-200 dark:bg-slate-700 rounded mb-2" style={{ width: `${80 - i * 15}%` }} />
      ))}
    </div>
  );
}
