import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{description}</p>}
      {action && (
        <Link href={action.href}><Button className="mt-4">{action.label}</Button></Link>
      )}
    </div>
  );
}
