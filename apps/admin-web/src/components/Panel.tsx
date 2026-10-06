import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: ReactNode;
}

export function Panel({ title, action, children, className, ...props }: PanelProps) {
  return (
    <section className={cn("rounded border border-border bg-surface", className)} {...props}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          {title && <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-ink">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
