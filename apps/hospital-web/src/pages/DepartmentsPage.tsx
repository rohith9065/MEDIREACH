import { FormEvent, useState } from "react";
import { useDepartments, useCreateDepartment, useUpdateDepartment } from "../hooks/useDepartments";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { Table, THead, TBody, TR, TH, TD } from "../components/Table";
import { StatusDot, statusKind } from "../components/StatusDot";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { ApiError } from "../services/apiClient";

export function DepartmentsPage() {
  const { data, isLoading } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createDepartment.mutateAsync({ name, description: description || undefined });
      setName("");
      setDescription("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add department.");
    }
  }

  return (
    <div>
      <PageHeader title="Departments" subtitle="Clinical departments at your hospital" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <Panel title="All departments">
          {isLoading ? (
            <p className="text-sm text-ink-muted">Loading…</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Description</TH>
                  <TH>Status</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {(data?.departments ?? []).map((dept) => (
                  <TR key={dept.id}>
                    <TD className="font-medium">{dept.name}</TD>
                    <TD className="text-ink-muted">{dept.description ?? "—"}</TD>
                    <TD>
                      <StatusDot kind={statusKind(dept.status)} label={dept.status} />
                    </TD>
                    <TD>
                      <button
                        className="text-xs font-medium uppercase tracking-wide text-ink-muted hover:text-ink"
                        onClick={() =>
                          updateDepartment.mutate({
                            id: dept.id,
                            input: { status: dept.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
                          })
                        }
                      >
                        Toggle
                      </button>
                    </TD>
                  </TR>
                ))}
                {data?.departments.length === 0 && (
                  <TR>
                    <TD colSpan={4} className="text-center text-ink-muted">
                      No departments yet.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          )}
        </Panel>

        <Panel title="Add department">
          <form onSubmit={handleSubmit} className="space-y-3">
            <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            {error && <p className="text-sm text-status-unavailable">{error}</p>}
            <Button type="submit" disabled={createDepartment.isPending} className="w-full">
              {createDepartment.isPending ? "Adding…" : "Add department"}
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
