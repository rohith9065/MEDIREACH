import { useHospitalDashboard } from "../hooks/useHospitalDashboard";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { StatusDot, statusKind } from "../components/StatusDot";

export function DashboardPage() {
  const { data, isLoading, isError } = useHospitalDashboard();

  if (isLoading) return <p className="text-sm text-ink-muted">Loading dashboard…</p>;
  if (isError || !data) return <p className="text-sm text-status-unavailable">Failed to load dashboard.</p>;

  const { hospital, bedTotals, doctorCount, departmentCount, facilityCount } = data;

  return (
    <div>
      <PageHeader
        title={hospital.name}
        subtitle={`${hospital.address ?? "No address on file"} · Registration ${hospital.registrationNumber}`}
      />

      <div className="mb-8 grid grid-cols-2 gap-8 border-b border-rule-subtle pb-8 sm:grid-cols-4">
        {bedTotals.map((bed) => (
          <div key={bed.bedType} className="border-l-2 border-ink pl-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">{bed.bedType} beds available</p>
            <p className="mt-1 font-serif text-3xl text-ink">{bed.available}</p>
            <p className="mt-0.5 font-mono text-xs text-ink-muted">of {bed.total}</p>
          </div>
        ))}
        <div className="border-l-2 border-status-unavailable pl-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Emergency</p>
          <div className="mt-2">
            <StatusDot kind={statusKind(hospital.emergencyStatus)} label={hospital.emergencyStatus} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Panel title="Doctors">
          <p className="font-serif text-2xl text-ink">{doctorCount}</p>
          <p className="text-sm text-ink-muted">across {departmentCount} departments</p>
        </Panel>
        <Panel title="Facilities">
          <p className="font-serif text-2xl text-ink">{facilityCount}</p>
          <p className="text-sm text-ink-muted">tracked facility types</p>
        </Panel>
        <Panel title="Verification">
          <StatusDot kind={hospital.verified ? "available" : "unknown"} label={hospital.status} />
        </Panel>
      </div>
    </div>
  );
}
