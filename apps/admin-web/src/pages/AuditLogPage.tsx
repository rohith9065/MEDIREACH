import { useAuditLog } from "../hooks/useAuditLog";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { Table, THead, TBody, TR, TH, TD } from "../components/Table";

const ACTION_LABEL: Record<string, string> = {
  HOSPITAL_VERIFIED: "Hospital verified",
  HOSPITAL_REJECTED: "Hospital rejected",
  USER_DEACTIVATED: "User deactivated",
};

export function AuditLogPage() {
  const { data, isLoading } = useAuditLog();
  const logs = data?.logs ?? [];

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Every verification and account action, newest first" />

      <Panel>
        {isLoading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Timestamp</TH>
                <TH>Actor</TH>
                <TH>Action</TH>
                <TH>Target</TH>
              </TR>
            </THead>
            <TBody>
              {logs.map((log) => (
                <TR key={log.id}>
                  <TD className="text-ink-muted">{new Date(log.createdAt).toLocaleString()}</TD>
                  <TD>{log.actorName ?? "—"}</TD>
                  <TD>{ACTION_LABEL[log.action] ?? log.action}</TD>
                  <TD numeric className="text-xs text-ink-muted">
                    {log.targetType}
                    {log.targetId ? `:${log.targetId.slice(0, 8)}` : ""}
                  </TD>
                </TR>
              ))}
              {logs.length === 0 && (
                <TR>
                  <TD colSpan={4} className="text-center text-ink-muted">
                    No activity yet.
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
