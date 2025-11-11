"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { IconUsers, IconCircleCheck, IconAlertCircle, IconTrash, IconPlus } from "@tabler/icons-react";

interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter?: number;
}

interface PoolResult {
  poolId: number;
  year: number;
  members: Array<{ shipId: string; cbBefore: number; cbAfter: number }>;
  poolSum: number;
}

export default function PoolingPage() {
  const [year, setYear] = useState<number>(2024);
  const [members, setMembers] = useState<PoolMember[]>([]);
  const [newShipId, setNewShipId] = useState("");
  const [poolResult, setPoolResult] = useState<PoolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCB, setLoadingCB] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = async () => {
    if (!newShipId || newShipId.trim() === "") {
      toast.error("Please enter a Ship ID");
      return;
    }
    
    // Check if already added
    if (members.some(m => m.shipId === newShipId)) {
      toast.error(`${newShipId} is already in the pool`);
      return;
    }
    
    try {
      setLoadingCB(true);
      setError(null);
      
      // Fetch adjusted CB for this ship
      const adjusted = await api.getAdjustedCB(newShipId, year);
      
      setMembers([
        ...members,
        { shipId: newShipId, cbBefore: adjusted.cbAfter },
      ]);
      setNewShipId("");
      toast.success(`Added ${newShipId} with CB: ${adjusted.cbAfter.toLocaleString()} gCO₂eq`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get compliance balance";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingCB(false);
    }
  };

  const handleRemoveMember = (shipId: string) => {
    setMembers(members.filter(m => m.shipId !== shipId));
    toast.success(`Removed ${shipId} from pool`);
  };

  const handleCreatePool = async () => {
    if (members.length === 0) {
      toast.error("Please add at least one member");
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
        members.map((m) => ({ shipId: m.shipId }))
      );
      
      setPoolResult(result);
      toast.success(`Pool #${result.poolId} created successfully!`);
      
      // Clear form
      setMembers([]);
      setNewShipId("");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create pool";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const poolSum = members.reduce((sum, m) => sum + m.cbBefore, 0);
  const isValid = poolSum >= 0;
  const surplusCount = members.filter(m => m.cbBefore > 0).length;
  const deficitCount = members.filter(m => m.cbBefore < 0).length;

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Pooling Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Create compliance pools between ships (Article 21)
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          {/* Year Selection */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Pool Configuration</h2>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-muted-foreground">
                Year:
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>

          {/* Add Member Form */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Add Ships to Pool</h2>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newShipId}
                  onChange={(e) => setNewShipId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleAddMember()}
                  placeholder="Enter ship ID (e.g., R001)"
                  disabled={loadingCB}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                />
              </div>
              <button
                onClick={handleAddMember}
                disabled={loadingCB || !newShipId}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingCB ? (
                  <>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    Loading...
                  </>
                ) : (
                  <>
                    <IconPlus className="w-4 h-4" />
                    Add Ship
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ships will be fetched with their adjusted CB (after banking)
            </p>
          </div>

          {/* KPI Cards */}
          {members.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Pool Sum
                </div>
                <div className={`text-2xl font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {poolSum.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">gCO₂eq</div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Total Ships
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {members.length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">in pool</div>
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
          {members.length > 0 && (
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
                        Sum of compliance balances: {poolSum.toLocaleString()} gCO₂eq ≥ 0 ✓
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
                        Sum of CBs ({poolSum.toLocaleString()} gCO₂eq) must be ≥ 0
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Members Table */}
          {members.length > 0 && (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold">Pool Members</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {members.length} {members.length === 1 ? 'ship' : 'ships'} in pool
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Ship ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        CB Before (gCO₂eq)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {members.map((member) => (
                      <tr key={member.shipId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">
                          {member.shipId}
                        </td>
                        <td className={`px-4 py-3 text-sm font-semibold ${
                          member.cbBefore >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {member.cbBefore.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            member.cbBefore > 0
                              ? 'bg-green-100 text-green-700'
                              : member.cbBefore < 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {member.cbBefore > 0 ? 'Surplus' : member.cbBefore < 0 ? 'Deficit' : 'Balanced'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <button
                            onClick={() => handleRemoveMember(member.shipId)}
                            className="inline-flex items-center gap-1 text-destructive hover:text-destructive/80 font-medium transition-colors"
                          >
                            <IconTrash className="w-4 h-4" />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                <h3 className="text-sm font-semibold mb-3">Final Allocation (After Pooling)</h3>
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
          {members.length > 0 && !poolResult && (
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
