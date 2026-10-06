import { FormEvent, useState } from "react";
import { useDoctors, useCreateDoctor, useUpdateDoctorStatus } from "../hooks/useDoctors";
import { useDepartments } from "../hooks/useDepartments";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { Table, THead, TBody, TR, TH, TD } from "../components/Table";
import { StatusDot, statusKind } from "../components/StatusDot";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { SelectField } from "../components/SelectField";
import { DoctorScheduleEditor } from "../components/DoctorScheduleEditor";
import { ApiError } from "../services/apiClient";

export function DoctorsPage() {
  const { data, isLoading } = useDoctors();
  const { data: departmentsData } = useDepartments();
  const createDoctor = useCreateDoctor();
  const updateStatus = useUpdateDoctorStatus();

  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scheduleDoctorId, setScheduleDoctorId] = useState("");

  const departments = departmentsData?.departments ?? [];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createDoctor.mutateAsync({
        name,
        departmentId: departmentId || undefined,
        specialization: specialization || undefined,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        consultationFee: consultationFee ? Number(consultationFee) : undefined,
      });
      setName("");
      setDepartmentId("");
      setSpecialization("");
      setExperienceYears("");
      setConsultationFee("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add doctor.");
    }
  }

  return (
    <div>
      <PageHeader title="Doctors" subtitle="Directory of doctors at your hospital" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <Panel title="All doctors">
          {isLoading ? (
            <p className="text-sm text-ink-muted">Loading…</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Department</TH>
                  <TH>Specialization</TH>
                  <TH>Experience</TH>
                  <TH>Fee</TH>
                  <TH>Status</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {(data?.doctors ?? []).map((doc) => (
                  <TR key={doc.id}>
                    <TD>{doc.name}</TD>
                    <TD>{doc.departmentName ?? "—"}</TD>
                    <TD>{doc.specialization ?? "—"}</TD>
                    <TD numeric>{doc.experienceYears != null ? `${doc.experienceYears} yrs` : "—"}</TD>
                    <TD numeric>{doc.consultationFee != null ? `₹${doc.consultationFee}` : "—"}</TD>
                    <TD>
                      <StatusDot kind={statusKind(doc.status)} label={doc.status} />
                    </TD>
                    <TD>
                      <button
                        className="text-xs font-medium uppercase tracking-wide text-ink-muted hover:text-ink"
                        onClick={() =>
                          updateStatus.mutate({
                            id: doc.id,
                            status: doc.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE",
                          })
                        }
                      >
                        Toggle
                      </button>
                    </TD>
                  </TR>
                ))}
                {data?.doctors.length === 0 && (
                  <TR>
                    <TD colSpan={7} className="text-center text-ink-muted">
                      No doctors yet.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          )}
        </Panel>

        <Panel title="Add doctor">
          <form onSubmit={handleSubmit} className="space-y-3">
            <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <SelectField
              label="Department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={[
                { value: "", label: "— None —" },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
            <TextField
              label="Specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            />
            <TextField
              label="Experience (years)"
              type="number"
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
            />
            <TextField
              label="Consultation fee"
              type="number"
              min={0}
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
            />
            {error && <p className="text-sm text-status-unavailable">{error}</p>}
            <Button type="submit" disabled={createDoctor.isPending} className="w-full">
              {createDoctor.isPending ? "Adding…" : "Add doctor"}
            </Button>
          </form>
        </Panel>
      </div>

      <div className="mt-8">
        <Panel title="Doctor schedule">
          <div className="mb-4 max-w-xs">
            <SelectField
              label="Doctor"
              value={scheduleDoctorId}
              onChange={(e) => setScheduleDoctorId(e.target.value)}
              options={[
                { value: "", label: "— Select a doctor —" },
                ...(data?.doctors ?? []).map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          </div>
          {scheduleDoctorId ? (
            <DoctorScheduleEditor key={scheduleDoctorId} doctorId={scheduleDoctorId} />
          ) : (
            <p className="text-sm text-ink-muted">Select a doctor to set their weekly working hours.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
