import { useEffect, useState } from "react";
import { useBeds, useUpdateBed } from "../hooks/useBeds";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { Table, THead, TBody, TR, TH, TD } from "../components/Table";
import { Button } from "../components/Button";
import { BED_TYPES } from "../../../../shared/constants/hospital";
import { BedType } from "../../../../shared/types/hospital";
import { ApiError } from "../services/apiClient";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function BedsPage() {
  const { data, isLoading } = useBeds();
  const updateBed = useUpdateBed();
  const [drafts, setDrafts] = useState<Record<string, { total: string; occupied: string }>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const bedsByType = new Map((data?.beds ?? []).map((b) => [b.bedType, b]));

  useEffect(() => {
    if (!data) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const bedType of BED_TYPES) {
        if (next[bedType] === undefined) {
          const existing = bedsByType.get(bedType);
          next[bedType] = { total: String(existing?.totalBeds ?? 0), occupied: String(existing?.occupiedBeds ?? 0) };
        }
      }
      return next;
    });
    // data is the only real dependency here — bedsByType is derived from it each render
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(bedType: BedType) {
    const draft = drafts[bedType];
    setRowError((prev) => ({ ...prev, [bedType]: "" }));
    try {
      await updateBed.mutateAsync({
        bedType,
        input: { totalBeds: Number(draft.total), occupiedBeds: Number(draft.occupied) },
      });
    } catch (err) {
      setRowError((prev) => ({
        ...prev,
        [bedType]: err instanceof ApiError ? err.message : "Could not save.",
      }));
    }
  }

  return (
    <div>
      <PageHeader title="Beds" subtitle="Update bed capacity by type — patients see this live" />
      <Panel>
        {isLoading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Type</TH>
                <TH>Total</TH>
                <TH>Occupied</TH>
                <TH>Available</TH>
                <TH>Updated</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {BED_TYPES.map((bedType) => {
                const existing = bedsByType.get(bedType);
                const draft = drafts[bedType] ?? { total: "0", occupied: "0" };
                const available = Number(draft.total) - Number(draft.occupied);
                return (
                  <TR key={bedType}>
                    <TD className="font-medium">{bedType}</TD>
                    <TD numeric>
                      <input
                        type="number"
                        min={0}
                        className="w-20 rounded border border-rule-subtle bg-paper-raised px-2 py-1 font-mono text-sm"
                        value={draft.total}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [bedType]: { ...prev[bedType], total: e.target.value } }))
                        }
                      />
                    </TD>
                    <TD numeric>
                      <input
                        type="number"
                        min={0}
                        className="w-20 rounded border border-rule-subtle bg-paper-raised px-2 py-1 font-mono text-sm"
                        value={draft.occupied}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [bedType]: { ...prev[bedType], occupied: e.target.value },
                          }))
                        }
                      />
                    </TD>
                    <TD numeric className={available < 0 ? "text-status-unavailable" : undefined}>
                      {available}
                    </TD>
                    <TD className="text-ink-muted">{existing ? timeAgo(existing.lastUpdated) : "never"}</TD>
                    <TD>
                      <Button variant="secondary" onClick={() => handleSave(bedType)} disabled={updateBed.isPending}>
                        Save
                      </Button>
                      {rowError[bedType] && (
                        <p className="mt-1 text-xs text-status-unavailable">{rowError[bedType]}</p>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
