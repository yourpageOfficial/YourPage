import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-navy-900">
      <div className="text-center">
        <div className="h-20 w-20 rounded-2xl bg-primary-50 dark:bg-navy-800 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="h-10 w-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-display font-black tracking-tight mb-2">Kamu Sedang Offline</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Pastikan koneksi internet dan coba lagi.</p>
        <Button onClick={() => window.location.reload()} className="rounded-2xl">Coba Lagi</Button>
      </div>
    </div>
  );
}
