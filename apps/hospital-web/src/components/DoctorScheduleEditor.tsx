import { useEffect, useState } from "react";
import { useDoctorSchedule, useSetDoctorSchedule } from "../hooks/useDoctorSchedule";
import { Button } from "./Button";
import { ApiError } from "../services/apiClient";
import { DAYS_OF_WEEK } from "../../../../shared/constants/appointment";

interface DayRow {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

function emptyRows(): DayRow[] {
  return DAYS_OF_WEEK.map(() => ({ enabled: false, startTime: "09:00", endTime: "17:00" }));
}

export function DoctorScheduleEditor({ doctorId }: { doctorId: string }) {
  const { data, isLoading } = useDoctorSchedule(doctorId);
  const setSchedule = useSetDoctorSchedule(doctorId);
  const [rows, setRows] = useState<DayRow[]>(emptyRows);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const next = emptyRows();
    for (const w of data.windows) {
      next[w.dayOfWeek] = { enabled: true, startTime: w.startTime, endTime: w.endTime };
    }
    setRows(next);
  }, [data]);

  function updateRow(day: number, patch: Partial<DayRow>) {
    setRows((prev) => prev.map((r, i) => (i === day ? { ...r, ...patch } : r)));
  }

  async function handleSave() {
    setError(null);
    try {
      const windows = rows
        .map((r, dayOfWeek) => ({ ...r, dayOfWeek }))
        .filter((r) => r.enabled)
        .map((r) => ({ dayOfWeek: r.dayOfWeek, startTime: r.startTime, endTime: r.endTime }));
      await setSchedule.mutateAsync({ windows });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save schedule.");
    }
  }

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading schedule…</p>;
  }

  return (
    <div className="space-y-2">
      {DAYS_OF_WEEK.map((day, i) => (
        <div key={day.value} className="flex items-center gap-3 border-b border-rule-subtle py-2 last:border-0">
          <label className="flex w-32 items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={rows[i].enabled}
              onChange={(e) => updateRow(i, { enabled: e.target.checked })}
            />
            {day.label}
          </label>
          <input
            type="time"
            value={rows[i].startTime}
            disabled={!rows[i].enabled}
            onChange={(e) => updateRow(i, { startTime: e.target.value })}
            className="rounded border border-rule-subtle bg-paper-raised px-2 py-1 text-sm disabled:opacity-40"
          />
          <span className="text-ink-muted">to</span>
          <input
            type="time"
            value={rows[i].endTime}
            disabled={!rows[i].enabled}
            onChange={(e) => updateRow(i, { endTime: e.target.value })}
            className="rounded border border-rule-subtle bg-paper-raised px-2 py-1 text-sm disabled:opacity-40"
          />
        </div>
      ))}
      {error && <p className="text-sm text-status-unavailable">{error}</p>}
      <Button onClick={handleSave} disabled={setSchedule.isPending} className="mt-2">
        {setSchedule.isPending ? "Saving…" : "Save schedule"}
      </Button>
    </div>
  );
}
