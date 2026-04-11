"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Activity } from "lucide-react";

export default function StatusPage() {
  const { data: services } = useQuery({
    queryKey: ["status"],
    queryFn: async () => {
      const checks = [
        { name: "Website", url: "/", ok: false },
        { name: "API", url: "/api/v1/health", ok: false },
        { name: "Database", url: "/api/v1/tiers", ok: false },
      ];
      for (const s of checks) { try { const r = await fetch(s.url); s.ok = r.ok; } catch { s.ok = false; } }
      return checks;
    },
    refetchInterval: 30000,
  });

  const allOk = services?.every(s => s.ok);

  return (
    <div className="min-h-screen bg-white dark:bg-navy-900 py-12 px-4">
      <div className="mx-auto max-w-lg">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
            <Activity className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight">YourPage Status</h1>
          <div className={`inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-2xl text-sm font-bold ${allOk ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-red-50 dark:bg-red-900/20 text-red-600"}`}>
            {allOk ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {allOk ? "Semua Sistem Normal" : "Ada Gangguan"}
          </div>
        </div>
        <div className="space-y-3">
          {services?.map(s => (
            <Card key={s.name} hover>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-semibold">{s.name}</span>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${s.ok ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                  {s.ok ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-8">Auto-refresh setiap 30 detik</p>
      </div>
    </div>
  );
}
