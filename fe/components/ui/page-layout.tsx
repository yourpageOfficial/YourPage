import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action, className }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 sm:mb-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function StatGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: 2 | 3 | 4 | 5 }) {
  const colClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  }[cols];
  return <div className={cn("grid gap-3", colClass)}>{children}</div>;
}

export function EmptyState({ icon: Icon, title, action }: {
  icon: any;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-300" />
      <p className="mt-3 text-sm text-gray-500">{title}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ItemList({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2 sm:space-y-3">{children}</div>;
}
