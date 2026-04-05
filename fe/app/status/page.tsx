"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

export default function StatusPage() {
  const { data: services } = useQuery({
    queryKey: ["status"],
    queryFn: async () => {
      const checks = [
        { name: "Website", url: "/", ok: false },
        { name: "API", url: "/api/v1/health", ok: false },
        { name: "Database", url: "/api/v1/tiers", ok: false },
      ];
      for (const s of checks) {
        try { const r = await fetch(s.url); s.ok = r.ok; } catch { s.ok = false; }
      }
      return checks;
    },
    refetchInterval: 30000,
  });

  const allOk = services?.every(s => s.ok);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="mx-auto max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">YourPage Status</h1>
          <div className={`inline-block mt-3 px-4 py-2 rounded-full text-sm font-medium ${allOk ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
            {allOk ? "✅ Semua Sistem Normal" : "⚠️ Ada Gangguan"}
          </div>
        </div>
        <div className="space-y-3">
          {services?.map(s => (
            <Card key={s.name}>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium">{s.name}</span>
                {s.ok ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">Auto-refresh setiap 30 detik</p>
      </div>
    </div>
  );
}
