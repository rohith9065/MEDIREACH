import { useState } from "react";
import { useUsers, useDeactivateUser } from "../hooks/useUsers";
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { Table, THead, TBody, TR, TH, TD } from "../components/Table";
import { Badge, badgeKind } from "../components/Badge";
import { Button } from "../components/Button";
import { SelectField } from "../components/SelectField";
import { Role } from "../../../../shared/types/roles";
import { ROLES } from "../../../../shared/constants/roles";

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  ...Object.values(ROLES).map((r) => ({ value: r, label: r })),
];

export function UsersPage() {
  const { user: me } = useAuth();
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data, isLoading } = useUsers({ role });
  const deactivate = useDeactivateUser();

  const users = data?.users ?? [];

  function confirmDeactivate(id: string) {
    deactivate.mutate(id);
    setConfirmingId(null);
  }

  return (
    <div>
      <PageHeader title="Users" subtitle="All accounts across every role" />

      <div className="mb-6 w-56">
        <SelectField
          label="Role"
          options={ROLE_OPTIONS}
          value={role ?? ""}
          onChange={(e) => setRole((e.target.value || undefined) as Role | undefined)}
        />
      </div>

      <Panel>
        {isLoading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH>Joined</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {users.map((u) => {
                const isSelf = u.id === me?.id;
                const isSuperAdmin = u.role === "SUPER_ADMIN";
                const disabled = isSelf || isSuperAdmin || !u.isActive;
                return (
                  <TR key={u.id}>
                    <TD>{u.name}</TD>
                    <TD>{u.email}</TD>
                    <TD className="font-mono text-xs">{u.role}</TD>
                    <TD>
                      <Badge kind={badgeKind(u.isActive)} label={u.isActive ? "ACTIVE" : "DEACTIVATED"} />
                    </TD>
                    <TD className="text-ink-muted">{new Date(u.createdAt).toLocaleDateString()}</TD>
                    <TD>
                      {confirmingId === u.id ? (
                        <div className="flex gap-2">
                          <Button variant="danger" onClick={() => confirmDeactivate(u.id)}>
                            Confirm
                          </Button>
                          <Button variant="secondary" onClick={() => setConfirmingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="danger" disabled={disabled} onClick={() => setConfirmingId(u.id)}>
                          Deactivate
                        </Button>
                      )}
                    </TD>
                  </TR>
                );
              })}
              {users.length === 0 && (
                <TR>
                  <TD colSpan={6} className="text-center text-ink-muted">
                    No users match this filter.
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
