import { cn } from "../lib/cn";

type BadgeKind = "available" | "limited" | "unavailable" | "unknown";

const KIND_CLASS: Record<BadgeKind, string> = {
  available: "bg-status-available/10 text-status-available",
  limited: "bg-status-limited/10 text-status-limited",
  unavailable: "bg-status-unavailable/10 text-status-unavailable",
  unknown: "bg-status-unknown/10 text-status-unknown",
};

// Maps hospital-status / active-flag domain values to a badge color — PENDING reads as
// "limited" (amber, needs attention), VERIFIED as "available" (green), REJECTED/SUSPENDED and
// inactive users as "unavailable" (red).
export function badgeKind(value: string | boolean): BadgeKind {
  if (typeof value === "boolean") {
    return value ? "available" : "unavailable";
  }
  switch (value) {
    case "VERIFIED":
      return "available";
    case "PENDING":
      return "limited";
    case "REJECTED":
    case "SUSPENDED":
      return "unavailable";
    default:
      return "unknown";
  }
}

export function Badge({ kind, label }: { kind: BadgeKind; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 font-mono text-xs font-medium", KIND_CLASS[kind])}>
      {label}
    </span>
  );
}
