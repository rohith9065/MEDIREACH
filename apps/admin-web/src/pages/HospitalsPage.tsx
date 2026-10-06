import { useState } from "react";
import { useHospitals, useVerifyHospital, useRejectHospital } from "../hooks/useHospitals";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { Table, THead, TBody, TR, TH, TD } from "../components/Table";
import { Badge, badgeKind } from "../components/Badge";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { HospitalStatus } from "../../../../shared/types/hospital";
import { cn } from "../lib/cn";

const TABS: { label: string; value: HospitalStatus | undefined }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: undefined },
];

export function HospitalsPage() {
  const [tab, setTab] = useState<HospitalStatus | undefined>("PENDING");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useHospitals(tab);
  const verify = useVerifyHospital();
  const reject = useRejectHospital();

  const hospitals = data?.hospitals ?? [];

  function startReject(id: string) {
    setRejectingId(id);
    setReason("");
  }

  function confirmReject(id: string) {
    reject.mutate({ id, reason: reason.trim() || undefined });
    setRejectingId(null);
  }

  return (
    <div>
      <PageHeader title="Hospitals" subtitle="Review self-registered hospitals before they go live for patients" />

      <div className="mb-6 flex gap-1 border-b border-border-strong">
        {TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t.value)}
            className={cn(
              "border-b-2 px-3 py-2 font-mono text-sm",
              tab === t.value
                ? "border-accent text-accent"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Panel>
        {isLoading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Registration #</TH>
                <TH>Admin</TH>
                <TH>Status</TH>
                <TH>Registered</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {hospitals.map((h) => (
                <TR key={h.id}>
                  <TD>{h.name}</TD>
                  <TD numeric>{h.registrationNumber}</TD>
                  <TD>
                    {h.adminName ?? "—"}
                    {h.adminEmail && <div className="text-xs text-ink-muted">{h.adminEmail}</div>}
                  </TD>
                  <TD>
                    <Badge kind={badgeKind(h.status)} label={h.status} />
                  </TD>
                  <TD className="text-ink-muted">{new Date(h.createdAt).toLocaleDateString()}</TD>
                  <TD>
                    {rejectingId === h.id ? (
                      <div className="flex items-center gap-2">
                        <TextField
                          label=""
                          className="w-40"
                          placeholder="Reason (optional)"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                        <Button variant="danger" onClick={() => confirmReject(h.id)} disabled={reject.isPending}>
                          Confirm
                        </Button>
                        <Button variant="secondary" onClick={() => setRejectingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      h.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            onClick={() => verify.mutate(h.id)}
                            disabled={verify.isPending}
                          >
                            Approve
                          </Button>
                          <Button variant="danger" onClick={() => startReject(h.id)}>
                            Reject
                          </Button>
                        </div>
                      )
                    )}
                  </TD>
                </TR>
              ))}
              {hospitals.length === 0 && (
                <TR>
                  <TD colSpan={6} className="text-center text-ink-muted">
                    No hospitals in this view.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
