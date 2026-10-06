import { useState } from "react";
import { useDoctors } from "../hooks/useDoctors";
import { useQueue, useQueueActions } from "../hooks/useQueue";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { Table, THead, TBody, TR, TH, TD } from "../components/Table";
import { StatusDot } from "../components/StatusDot";
import { Button } from "../components/Button";
import { SelectField } from "../components/SelectField";
import { QueueStatus } from "../../../../shared/types/appointment";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function queueStatusKind(status: QueueStatus): "available" | "limited" | "unavailable" | "unknown" {
  switch (status) {
    case "COMPLETED":
      return "available";
    case "CALLED":
    case "IN_CONSULTATION":
      return "limited";
    case "SKIPPED":
    case "CANCELLED":
      return "unavailable";
    default:
      return "unknown";
  }
}

export function QueuePage() {
  const { data: doctorsData } = useDoctors();
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(todayIso());

  const { data, isLoading } = useQueue(doctorId || null, date);
  const { call, skip, complete } = useQueueActions(doctorId || null, date);

  const doctors = doctorsData?.doctors ?? [];
  const isToday = date === todayIso();

  return (
    <div>
      <PageHeader title="Queue" subtitle="Today's tokens by doctor — call, skip, or complete" />

      <div className="mb-6 flex gap-6">
        <div className="w-64">
          <SelectField
            label="Doctor"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            options={[{ value: "", label: "— Select a doctor —" }, ...doctors.map((d) => ({ value: d.id, label: d.name }))]}
          />
        </div>
        <div className="w-48">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded border border-rule-subtle bg-paper-raised px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </label>
        </div>
      </div>

      <Panel>
        {!doctorId ? (
          <p className="text-sm text-ink-muted">Select a doctor to see their queue.</p>
        ) : isLoading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Token</TH>
                <TH>Patient</TH>
                <TH>Status</TH>
                <TH>Called</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {(data?.tokens ?? []).map((t) => (
                <TR key={t.id}>
                  <TD numeric className="font-medium">
                    #{t.tokenNumber}
                  </TD>
                  <TD>{t.patientName ?? "—"}</TD>
                  <TD>
                    <StatusDot kind={queueStatusKind(t.status)} label={t.status.replace("_", " ")} />
                  </TD>
                  <TD className="text-ink-muted">{t.calledAt ? new Date(t.calledAt).toLocaleTimeString() : "—"}</TD>
                  <TD>
                    {isToday && (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => call.mutate(t.id)}
                          disabled={t.status !== "WAITING" || call.isPending}
                        >
                          Call
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => skip.mutate(t.id)}
                          disabled={!["WAITING", "CALLED"].includes(t.status) || skip.isPending}
                        >
                          Skip
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => complete.mutate(t.id)}
                          disabled={!["CALLED", "IN_CONSULTATION"].includes(t.status) || complete.isPending}
                        >
                          Complete
                        </Button>
                      </div>
                    )}
                  </TD>
                </TR>
              ))}
              {data?.tokens.length === 0 && (
                <TR>
                  <TD colSpan={5} className="text-center text-ink-muted">
                    No tokens for this date.
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
