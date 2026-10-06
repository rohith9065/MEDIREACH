type StatusKind = "available" | "limited" | "unavailable" | "unknown";

const COLOR_CLASS: Record<StatusKind, string> = {
  available: "bg-status-available",
  limited: "bg-status-limited",
  unavailable: "bg-status-unavailable",
  unknown: "bg-status-unknown",
};

// Maps the domain status strings (AVAILABLE/LIMITED/UNAVAILABLE/ACTIVE/INACTIVE) to a dot color.
export function statusKind(value: string): StatusKind {
  switch (value) {
    case "AVAILABLE":
    case "ACTIVE":
      return "available";
    case "LIMITED":
      return "limited";
    case "UNAVAILABLE":
    case "INACTIVE":
      return "unavailable";
    default:
      return "unknown";
  }
}

export function StatusDot({ kind, label }: { kind: StatusKind; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 shrink-0 rounded-full ${COLOR_CLASS[kind]}`} aria-hidden />
      <span className="text-sm">{label}</span>
    </span>
  );
}
