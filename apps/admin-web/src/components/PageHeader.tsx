import { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between border-b border-border-strong pb-4">
      <div>
        <h1 className="font-mono text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 font-sans text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
