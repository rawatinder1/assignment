"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { IconUsers, IconCircleCheck, IconAlertCircle, IconTrash, IconPlus } from "@tabler/icons-react";

interface PoolMemberRow {
  id: string;
  shipId: string;
  cbBefore: number | null;
  loading: boolean;
}

interface PoolResult {
  poolId: number;
  year: number;
  members: Array<{ shipId: string; cbBefore: number; cbAfter: number }>;
  poolSum: number;
}

export default function PoolingPage() {
  const [year, setYear] = useState<number>(2024);
  const [memberRows, setMemberRows] = useState<PoolMemberRow[]>([
    { id: '1', shipId: '', cbBefore: null, loading: false }
  ]);
  const [poolResult, setPoolResult] = useState<PoolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadCB = async (rowId: string) => {
    const row = memberRows.find(r => r.id === rowId);
    if (!row || !row.shipId || row.shipId.trim() === "") {
      toast.error("Please select a Ship ID");
      return;
    }

    // Check if already loaded
    if (row.cbBefore !== null) {
      toast.info(`CB already loaded for ${row.shipId}`);
      return;
    }

    // Check for duplicates
    const existingLoaded = memberRows.filter(r => r.cbBefore !== null && r.shipId === row.shipId);
    if (existingLoaded.length > 0) {
      toast.error(`${row.shipId} is already in the pool`);
      return;
    }

    try {
      setMemberRows(memberRows.map(r => 
        r.id === rowId ? { ...r, loading: true } : r
      ));
      setError(null);

      const adjusted = await api.getAdjustedCB(row.shipId, year);

      setMemberRows(memberRows.map(r =>
        r.id === rowId ? { ...r, cbBefore: adjusted.cbAfter, loading: false } : r
      ));

      toast.success(`Loaded CB for ${row.shipId}: ${adjusted.cbAfter.toLocaleString()} gCO₂eq`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load CB";
      setError(errorMsg);
      toast.error(errorMsg);
      setMemberRows(memberRows.map(r =>
        r.id === rowId ? { ...r, loading: false } : r
      ));
    }
  };

  const handleRemoveRow = (rowId: string) => {
    if (memberRows.length === 1) {
      toast.info("At least one row is required");
      return;
    }
    const row = memberRows.find(r => r.id === rowId);
    setMemberRows(memberRows.filter(r => r.id !== rowId));
    if (row?.shipId) {
      toast.success(`Removed ${row.shipId}`);
    }
  };

  const handleAddRow = () => {
    const newId = String(Date.now());
    setMemberRows([...memberRows, { id: newId, shipId: '', cbBefore: null, loading: false }]);
  };

  const handleShipIdChange = (rowId: string, shipId: string) => {
    setMemberRows(memberRows.map(r =>
      r.id === rowId ? { ...r, shipId, cbBefore: null } : r
    ));
  };

  const handleCreatePool = async () => {
    const loadedMembers = memberRows.filter(r => r.cbBefore !== null);

    if (loadedMembers.length === 0) {
      toast.error("Please load CB for at least one member");
      return;
    }

    if (!isValid) {
      toast.error("Pool invalid: Sum of CBs must be ≥ 0");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await api.createPool(
        year,
        loadedMembers.map((m) => ({ shipId: m.shipId }))
      );

      setPoolResult(result);
      toast.success(`Pool #${result.poolId} created successfully!`);

      // Reset form
      setMemberRows([{ id: String(Date.now()), shipId: '', cbBefore: null, loading: false }]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create pool";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadedMembers = memberRows.filter(r => r.cbBefore !== null);
  const poolSum = loadedMembers.reduce((sum, m) => sum + (m.cbBefore ?? 0), 0);
  const isValid = poolSum >= 0;
  const surplusCount = loadedMembers.filter(m => (m.cbBefore ?? 0) > 0).length;
  const deficitCount = loadedMembers.filter(m => (m.cbBefore ?? 0) < 0).length;

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Pool Configuration
            </h1>
            <p className="text-muted-foreground mt-2">
              Add ships to pool and create compliance pools (Article 21)
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          {/* Year Selection */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Year</h2>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>

          {/* Pool Members */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <IconUsers className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Pool Members</h2>
            </div>

            <div className="space-y-4">
              {memberRows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Ship/Route ID
                    </label>
                    <input
                      type="text"
                      value={row.shipId}
                      onChange={(e) => handleShipIdChange(row.id, e.target.value)}
                      disabled={row.loading || row.cbBefore !== null}
                      placeholder="Enter Ship ID"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      CB Before (gCO₂eq)
                    </label>
                    <input
                      type="text"
                      value={row.cbBefore !== null ? row.cbBefore.toLocaleString() : ''}
                      readOnly
                      placeholder="—"
                      className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-center font-medium"
                    />
                  </div>

                  <div className="col-span-2">
                    <button
                      onClick={() => handleLoadCB(row.id)}
                      disabled={row.loading || !row.shipId || row.cbBefore !== null}
                      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {row.loading ? "Loading..." : "Load CB"}
                    </button>
                  </div>

                  <div className="col-span-3">
                    <button
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={memberRows.length === 1}
                      className="w-full rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <IconTrash className="inline w-4 h-4 mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddRow}
              className="mt-4 flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <IconPlus className="w-4 h-4" />
              Add Member
            </button>
          </div>

          {/* KPI Cards */}
          {loadedMembers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`rounded-lg border p-4 ${
                isValid ? 'border-green-500 bg-green-50' : 'border-destructive bg-destructive/10'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {isValid ? (
                    <IconCircleCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <IconAlertCircle className="w-5 h-5 text-destructive" />
                  )}
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pool Sum
                  </div>
                </div>
                <div className={`text-2xl font-bold ${isValid ? 'text-green-600' : 'text-destructive'}`}>
                  {poolSum.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">gCO₂eq</div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Members
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {loadedMembers.length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">ships in pool</div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Surplus Ships
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {surplusCount}
                </div>
                <div className="text-xs text-muted-foreground mt-1">CB &gt; 0</div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Deficit Ships
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {deficitCount}
                </div>
                <div className="text-xs text-muted-foreground mt-1">CB &lt; 0</div>
              </div>
            </div>
          )}

          {/* Validation Status */}
          {loadedMembers.length > 0 && (
            <div className={`rounded-lg border p-4 ${
              isValid
                ? 'border-green-500/50 bg-green-50'
                : 'border-destructive bg-destructive/10'
            }`}>
              <div className="flex items-center gap-3">
                {isValid ? (
                  <>
                    <IconCircleCheck className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-green-900">
                        Pool is valid and can be created
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Sum: {poolSum.toLocaleString()} gCO₂eq ≥ 0 ✓
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <IconAlertCircle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">
                        Pool is invalid
                      </p>
                      <p className="text-xs text-destructive/80 mt-1">
                        Sum ({poolSum.toLocaleString()} gCO₂eq) must be ≥ 0
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Pool Result */}
          {poolResult && (
            <div className="rounded-lg border border-green-500/50 bg-green-50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <IconCircleCheck className="w-6 h-6 text-green-600" />
                <h2 className="text-lg font-semibold text-green-900">Pool Created Successfully!</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg bg-white p-4">
                  <div className="text-xs text-muted-foreground mb-1">Pool ID</div>
                  <div className="text-xl font-bold text-primary">#{poolResult.poolId}</div>
                </div>
                <div className="rounded-lg bg-white p-4">
                  <div className="text-xs text-muted-foreground mb-1">Year</div>
                  <div className="text-xl font-bold">{poolResult.year}</div>
                </div>
                <div className="rounded-lg bg-white p-4">
                  <div className="text-xs text-muted-foreground mb-1">Pool Sum</div>
                  <div className="text-xl font-bold text-green-600">
                    {poolResult.poolSum.toLocaleString()} gCO₂eq
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-4">
                <h3 className="text-sm font-semibold mb-3">Final Allocation</h3>
                <div className="space-y-2">
                  {poolResult.members.map((member) => (
                    <div
                      key={member.shipId}
                      className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md"
                    >
                      <span className="text-sm font-medium">{member.shipId}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={member.cbBefore >= 0 ? 'text-green-600' : 'text-red-600'}>
                          Before: {member.cbBefore.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className={`font-semibold ${member.cbAfter >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          After: {member.cbAfter.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Create Pool Button */}
          {loadedMembers.length > 0 && !poolResult && (
            <div className="flex justify-end">
              <button
                onClick={handleCreatePool}
                disabled={loading || !isValid}
                className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    Creating Pool...
                  </span>
                ) : (
                  <>
                    <IconUsers className="inline w-4 h-4 mr-2" />
                    Create Pool
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
