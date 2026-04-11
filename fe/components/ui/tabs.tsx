import * as React from "react";
import { cn } from "@/lib/utils";

/* Context for compound tabs */
const TabsContext = React.createContext<{ value: string; onChange: (v: string) => void }>({ value: "", onChange: () => {} });

/* Compound API: <Tabs defaultValue="x"> <TabsList> <TabsTrigger> ... </Tabs> */
function Tabs({ defaultValue, children, className }: { defaultValue?: string; children: React.ReactNode; className?: string;
  /* simple API props (ignored in compound mode) */
  tabs?: any; active?: string; onChange?: any;
}) {
  const [value, setValue] = React.useState(defaultValue || "");
  return (
    <TabsContext.Provider value={{ value, onChange: setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex gap-1 p-1 rounded-2xl bg-primary-50 dark:bg-navy-800 border border-primary-100 dark:border-primary-900/30", className)} role="tablist">
      {children}
    </div>
  );
}

function TabsTrigger({ value, children, count, className }: { value: string; children: React.ReactNode; count?: number; className?: string }) {
  const ctx = React.useContext(TabsContext);
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => ctx.onChange(value)}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
        active ? "bg-white dark:bg-navy-900 text-primary shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
        className
      )}
    >
      {children}
      {count !== undefined && <span className="text-[10px] opacity-60">({count})</span>}
    </button>
  );
}

function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== value) return null;
  return <div className={className} role="tabpanel">{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
