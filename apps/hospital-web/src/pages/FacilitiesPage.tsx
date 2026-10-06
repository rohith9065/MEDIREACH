import { FormEvent, useState } from "react";
import { useFacilities, useUpdateFacility } from "../hooks/useFacilities";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { Table, THead, TBody, TR, TH, TD } from "../components/Table";
import { StatusDot, statusKind } from "../components/StatusDot";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { SelectField } from "../components/SelectField";
import { FACILITY_STATUSES } from "../../../../shared/constants/hospital";
import { ApiError } from "../services/apiClient";

export function FacilitiesPage() {
  const { data, isLoading } = useFacilities();
  const updateFacility = useUpdateFacility();

  const [name, setName] = useState("");
  const [status, setStatus] = useState<string>("AVAILABLE");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateFacility.mutateAsync({
        facilityName: name.trim(),
        input: {
          status: status as (typeof FACILITY_STATUSES)[number],
          quantity: quantity ? Number(quantity) : undefined,
        },
      });
      setName("");
      setQuantity("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save facility.");
    }
  }

  return (
    <div>
      <PageHeader title="Facilities" subtitle="MRI, blood bank, pharmacy, and other services" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <Panel title="All facilities">
          {isLoading ? (
            <p className="text-sm text-ink-muted">Loading…</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Facility</TH>
                  <TH>Status</TH>
                  <TH>Quantity</TH>
                </TR>
              </THead>
              <TBody>
                {(data?.facilities ?? []).map((f) => (
                  <TR key={f.id}>
                    <TD className="font-medium">{f.facilityName.replace(/_/g, " ")}</TD>
                    <TD>
                      <StatusDot kind={statusKind(f.status)} label={f.status} />
                    </TD>
                    <TD numeric>{f.quantity ?? "—"}</TD>
                  </TR>
                ))}
                {data?.facilities.length === 0 && (
                  <TR>
                    <TD colSpan={3} className="text-center text-ink-muted">
                      No facilities yet.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          )}
        </Panel>

        <Panel title="Add / update facility">
          <form onSubmit={handleSubmit} className="space-y-3">
            <TextField
              label="Facility name"
              placeholder="e.g. MRI, BLOOD_BANK"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <SelectField
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={FACILITY_STATUSES.map((s) => ({ value: s, label: s }))}
            />
            <TextField
              label="Quantity (optional)"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {error && <p className="text-sm text-status-unavailable">{error}</p>}
            <Button type="submit" disabled={updateFacility.isPending} className="w-full">
              {updateFacility.isPending ? "Saving…" : "Save facility"}
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
