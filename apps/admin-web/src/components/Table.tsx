import { TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Table(props: TableHTMLAttributes<HTMLTableElement>) {
  return <table className="w-full border-collapse text-sm" {...props} />;
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="border-b border-border-strong bg-bg" {...props} />;
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TR(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className="border-b border-border last:border-0" {...props} />;
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wide text-ink-muted", className)}
      {...props}
    />
  );
}

export function TD({
  className,
  numeric,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td className={cn("px-3 py-2 align-middle font-sans", numeric && "font-mono tabular-nums", className)} {...props} />
  );
}
