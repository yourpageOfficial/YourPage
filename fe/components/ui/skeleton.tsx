import { cn } from "@/lib/utils";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("animate-pulse rounded-xl bg-primary-100 dark:bg-navy-800", className)} style={style} />;
}

export function PostSkeleton() {
  return (
    <div className="rounded-xl border dark:border-primary-900/30 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border dark:border-primary-900/30 p-4 flex items-center justify-between">
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center p-3 rounded-xl border dark:border-primary-900/30">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-4 flex-shrink-0", c === 0 ? "w-32" : "w-20")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-56" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="flex items-end gap-2 h-40 p-4 rounded-xl border dark:border-primary-900/30">
      {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
