"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IconInfoCircle, IconUsers, IconCircleCheck, IconAlertCircle } from "@tabler/icons-react";

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

  const handleLoadCB = async () => {
    if (!newShipId) {
      toast.error("Please enter a Ship/Route ID");
      return;
    }
    try {
      setLoadingCB(true);
      setError(null);
      const adjusted = await api.getAdjustedCB(newShipId, year);
      setMembers([
        ...members,
        { shipId: newShipId, cbBefore: adjusted.cbAfter },
      ]);
      setNewShipId("");
      toast.success(`Added ${newShipId} with CB: ${adjusted.cbAfter.toLocaleString()} gCO₂eq`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get adjusted compliance balance";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingCB(false);
    }
  };

  const handleRemoveMember = (index: number) => {
    const removed = members[index];
    setMembers(members.filter((_, i) => i !== index));
    toast.success(`Removed ${removed?.shipId}`);
  };

  const handleCreatePool = async () => {
    if (members.length === 0) {
      toast.error("Please add at least one member");
      return;
    }
    if (!isValid) {
      toast.error("Pool is invalid. Check pooling rules.");
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
      toast.success(`Pool created successfully! Pool ID: ${result.poolId}`);
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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500 rounded-lg">
                <IconUsers className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Pool Configuration</h1>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full md:w-48 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>

          {/* Pool Members Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <IconUsers className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Pool Members</h2>
              <Tooltip>
                <TooltipTrigger>
                  <IconInfoCircle className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  Add ships to create a compliance pool
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              <div className="lg:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ship/Route ID
                </label>
                <select
                  value={newShipId}
                  onChange={(e) => setNewShipId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">Select ship...</option>
                  <option value="R001">R001</option>
                  <option value="R002">R002</option>
                  <option value="R003">R003</option>
                  <option value="R004">R004</option>
                  <option value="R005">R005</option>
                </select>
              </div>

              <div className="lg:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CB Before (gCO₂eq)
                </label>
                <div className="px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-500">
                  {members.length > 0 && newShipId ? '0' : '0'}
                </div>
              </div>

              <div className="lg:col-span-3 flex gap-2">
                <button
                  onClick={handleLoadCB}
                  disabled={loadingCB || !newShipId}
                  className="flex-1 py-3 px-4 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loadingCB ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    "Load CB"
                  )}
                </button>
              </div>
            </div>

            {/* Add Member Button */}
            <button
              onClick={handleLoadCB}
              disabled={loadingCB || !newShipId}
              className="mt-4 flex items-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">+</span> Add Member
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`rounded-2xl shadow-lg border p-6 relative overflow-hidden ${
              isValid 
                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' 
                : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <div className={`absolute top-4 right-4 p-2 rounded-lg ${
                isValid ? 'bg-emerald-500/20' : 'bg-gray-500/20'
              }`}>
                {isValid ? (
                  <IconCircleCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <span className="text-gray-600">○</span>
                )}
              </div>
              <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${
                isValid ? 'text-emerald-600' : 'text-gray-600'
              }`}>
                Pool Sum
              </div>
              <div className={`text-3xl font-bold mb-1 ${
                isValid ? 'text-emerald-700' : 'text-gray-700'
              }`}>
                {poolSum.toLocaleString()}
              </div>
              <div className={`text-xs ${
                isValid ? 'text-emerald-600/70' : 'text-gray-600/70'
              }`}>
                gCO₂eq
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border border-purple-200 p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 p-2 bg-purple-500/20 rounded-lg">
                <IconUsers className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-2">
                Members
              </div>
              <div className="text-3xl font-bold text-purple-700 mb-1">
                {members.length}
              </div>
              <div className="text-xs text-purple-600/70">
                {members.length === 1 ? 'ship' : 'ships'}
              </div>
            </div>

            <div className={`rounded-2xl shadow-lg border p-6 relative overflow-hidden ${
              isValid && members.length > 0
                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
                : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
            }`}>
              <div className={`absolute top-4 right-4 p-2 rounded-lg ${
                isValid && members.length > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'
              }`}>
                {isValid && members.length > 0 ? (
                  <IconCircleCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <IconAlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${
                isValid && members.length > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                Status
              </div>
              <div className={`text-3xl font-bold mb-1 ${
                isValid && members.length > 0 ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {members.length === 0 ? 'No Members' : isValid ? 'Valid' : 'Invalid'}
              </div>
              <div className={`text-xs ${
                isValid && members.length > 0 ? 'text-emerald-600/70' : 'text-red-600/70'
              }`}>
                {isValid && members.length > 0 ? 'Pool can be created' : 'Check requirements'}
              </div>
            </div>
          </div>

          {/* Members List */}
          {members.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Current Pool Members</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Ship/Route ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        CB Before (gCO₂eq)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {members.map((member, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {member.shipId}
                        </td>
                        <td className={`px-6 py-4 text-sm font-semibold ${
                          member.cbBefore >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {member.cbBefore.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleRemoveMember(index)}
                            className="text-red-600 hover:text-red-800 font-medium transition-colors"
                          >
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconCircleCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">Pool Created Successfully</h2>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Pool ID:</span>
                  <span className="text-sm font-semibold text-gray-900">{poolResult.poolId}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Year:</span>
                  <span className="text-sm font-semibold text-gray-900">{poolResult.year}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Pool Sum:</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {poolResult.poolSum.toLocaleString()} gCO₂eq
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Members After Pooling:</div>
                <div className="space-y-2">
                  {poolResult.members.map((member, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 px-3 bg-white rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-900">{member.shipId}</span>
                      <span className={`text-sm font-semibold ${
                        member.cbAfter >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {member.cbAfter.toLocaleString()} gCO₂eq
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pooling Rules */}
          <div className="bg-blue-50 rounded-2xl shadow-sm border border-blue-200 p-6">
            <h3 className="text-base font-semibold text-blue-900 mb-4">
              Pooling Rules (Article 21)
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Pool sum (Σ CB) must be ≥ 0</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Deficit ships cannot exit worse than before</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Surplus ships cannot exit with negative CB</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Greedy allocation: transfers from surplus to deficit</span>
              </li>
            </ul>
          </div>

          {/* Create Pool Button */}
          {members.length > 0 && !poolResult && (
            <div className="flex justify-end">
              <button
                onClick={handleCreatePool}
                disabled={loading || !isValid}
                className="py-3 px-8 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Pool...
                  </span>
                ) : (
                  "Create Pool"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
