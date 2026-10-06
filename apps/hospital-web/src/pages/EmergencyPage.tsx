import { useMyHospital, useUpdateEmergencyStatus } from "../hooks/useHospitalProfile";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { StatusDot, statusKind } from "../components/StatusDot";
import { Button } from "../components/Button";
import { EMERGENCY_STATUSES } from "../../../../shared/constants/hospital";

export function EmergencyPage() {
  const { data, isLoading } = useMyHospital();
  const updateStatus = useUpdateEmergencyStatus();

  const hospital = data?.hospital;

  return (
    <div>
      <PageHeader title="Emergency Status" subtitle="Patients see this before they travel to your hospital" />

      <Panel title="Current status">
        {isLoading || !hospital ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : (
          <div className="space-y-6">
            <div>
              <StatusDot kind={statusKind(hospital.emergencyStatus)} label={hospital.emergencyStatus} />
              {hospital.emergencyStatusUpdatedAt && (
                <p className="mt-1 text-xs text-ink-muted">
                  Updated {new Date(hospital.emergencyStatusUpdatedAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {EMERGENCY_STATUSES.map((status) => (
                <Button
                  key={status}
                  variant={status === hospital.emergencyStatus ? "primary" : "secondary"}
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
