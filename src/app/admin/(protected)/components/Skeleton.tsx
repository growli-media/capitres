import { glassCard } from "../../glass";

/** Base pulsing block — compose into page-shaped skeletons below. Not a
 * client component: Next.js renders `loading.tsx` fallbacks (which use
 * these) instantly, before any client JS needs to run. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-800/60 ${className}`} />;
}

/** Matches the shape of every admin list page: a heading + "New X"
 * button row, then a table-ish block of rows. Good enough for instant
 * paint on navigation — doesn't need to pixel-match each page's real
 * columns, just read as "this page's content is a table, loading." */
export function SkeletonListPage({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <div className={`overflow-hidden ${glassCard}`}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20 shrink-0" />
              <Skeleton className="h-4 w-16 shrink-0" />
              <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Matches Dashboard/Revenue: a slider, a KPI grid, then two content
 * columns. */
export function SkeletonDashboardPage() {
  return (
    <div>
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-72" />
      <Skeleton className="mt-6 h-14 w-full rounded-2xl" />
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
