import { FormEvent, useState } from "react";
import { useAmbulances, useCreateAmbulance } from "../hooks/useAmbulances";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { Table, THead, TBody, TR, TH, TD } from "../components/Table";
import { StatusDot, statusKind } from "../components/StatusDot";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { ApiError } from "../services/apiClient";

export function AmbulancesPage() {
  const { data, isLoading } = useAmbulances();
  const createAmbulance = useCreateAmbulance();

  const [driverName, setDriverName] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPassword, setDriverPassword] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createAmbulance.mutateAsync({
        driverName,
        driverEmail,
        driverPassword,
        driverPhone: driverPhone || undefined,
        vehicleNumber,
      });
      setDriverName("");
      setDriverEmail("");
      setDriverPassword("");
      setDriverPhone("");
      setVehicleNumber("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add ambulance.");
    }
  }

  return (
    <div>
      <PageHeader title="Ambulances" subtitle="Your hospital's ambulance fleet and drivers" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <Panel title="Fleet">
          {isLoading ? (
            <p className="text-sm text-ink-muted">Loading…</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Vehicle</TH>
                  <TH>Driver</TH>
                  <TH>Phone</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {(data?.ambulances ?? []).map((a) => (
                  <TR key={a.id}>
                    <TD className="font-mono">{a.vehicleNumber}</TD>
                    <TD>{a.driverName}</TD>
                    <TD className="text-ink-muted">{a.latitude != null ? `${a.latitude}, ${a.longitude}` : "—"}</TD>
                    <TD>
                      <StatusDot kind={statusKind(a.status)} label={a.status} />
                    </TD>
                  </TR>
                ))}
                {data?.ambulances.length === 0 && (
                  <TR>
                    <TD colSpan={4} className="text-center text-ink-muted">
                      No ambulances yet.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          )}
        </Panel>

        <Panel title="Add ambulance">
          <form onSubmit={handleSubmit} className="space-y-3">
            <TextField
              label="Vehicle number"
              required
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
            <TextField
              label="Driver name"
              required
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
            <TextField
              label="Driver email"
              type="email"
              required
              value={driverEmail}
              onChange={(e) => setDriverEmail(e.target.value)}
            />
            <TextField
              label="Driver phone (optional)"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
            />
            <TextField
              label="Driver password"
              type="password"
              required
              value={driverPassword}
              onChange={(e) => setDriverPassword(e.target.value)}
            />
            {error && <p className="text-sm text-status-unavailable">{error}</p>}
            <Button type="submit" disabled={createAmbulance.isPending} className="w-full">
              {createAmbulance.isPending ? "Adding…" : "Add ambulance"}
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
