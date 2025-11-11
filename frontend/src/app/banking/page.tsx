"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IconInfoCircle, IconWallet, IconCoin } from "@tabler/icons-react";

interface BankResult {
  shipId: string;
  year: number;
  cbBefore: number;
  banked?: number;
  applied?: number;
  cbAfter: number;
}

interface BankRecord {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

export default function BankingPage() {
  const [shipId, setShipId] = useState("");
  const [year, setYear] = useState<number>(2024);
  const [cb, setCb] = useState<number | null>(null);
  const [availableBanked, setAvailableBanked] = useState<number>(0);
  const [bankAmount, setBankAmount] = useState("");
  const [applyAmount, setApplyAmount] = useState("");
  const [bankRecords, setBankRecords] = useState<BankRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetCB = async () => {
    if (!shipId) {
      setError("Please enter a Ship/Route ID");
      toast.error("Please enter a Ship/Route ID");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await api.getCB(shipId, year);
      setCb(result.cb);
      toast.success(`CB loaded: ${result.cb.toLocaleString()} gCO₂eq`);
      
      // Load banked amount
      const banked = await api.getAdjustedCB(shipId, year);
      setAvailableBanked(banked.bankedAmount);
      
      // Load bank records
      await loadBankRecords();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get compliance balance";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadBankRecords = async () => {
    if (!shipId) return;
    try {
      setLoadingRecords(true);
      const records = await api.getBankRecords(shipId, year);
      setBankRecords(records);
    } catch (err) {
      console.error("Failed to load bank records:", err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleBank = async () => {
    if (!shipId) {
      toast.error("Please enter a Ship/Route ID");
      return;
    }
    const amount = parseFloat(bankAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    if (cb === null || cb <= 0) {
      toast.error("No positive balance available to bank");
      return;
    }
    if (amount > cb) {
      toast.error(`Amount exceeds available balance (${cb.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await api.bankSurplus(shipId, year);
      setCb(result.cbAfter);
      setAvailableBanked(availableBanked + result.banked);
      setBankAmount("");
      toast.success(`Successfully banked ${result.banked.toLocaleString()} gCO₂eq`);
      await loadBankRecords();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to bank surplus";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!shipId) {
      toast.error("Please enter a Ship/Route ID");
      return;
    }
    const amount = parseFloat(applyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    if (amount > availableBanked) {
      toast.error(`Amount exceeds available banked surplus (${availableBanked.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await api.applyBanked(shipId, year, amount);
      setCb(result.cbAfter);
      setAvailableBanked(availableBanked - result.applied);
      setApplyAmount("");
      toast.success(`Successfully applied ${result.applied.toLocaleString()} gCO₂eq`);
      await loadBankRecords();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to apply banked surplus";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = () => {
    if (cb === null) return { label: "-", color: "text-gray-500" };
    if (cb > 0) return { label: "Surplus", color: "text-emerald-600" };
    if (cb < 0) return { label: "Deficit", color: "text-red-600" };
    return { label: "Balanced", color: "text-gray-600" };
  };

  const status = getStatus();
  const remaining = cb !== null ? cb + availableBanked : 0;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500 rounded-lg">
                <IconWallet className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Banking Configuration</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ship/Route ID
                </label>
                <input
                  type="text"
                  value={shipId}
                  onChange={(e) => setShipId(e.target.value)}
                  placeholder="R001"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          {cb !== null && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-lg border border-red-200 p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 p-2 bg-red-500/20 rounded-lg">
                  <IconCoin className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-xs font-medium text-red-600 uppercase tracking-wider mb-2">Current CB</div>
                <div className="text-3xl font-bold text-red-700 mb-1">
                  {cb.toLocaleString()}
                </div>
                <div className="text-xs text-red-600/70">gCO₂eq</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200 p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 p-2 bg-blue-500/20 rounded-lg">
                <IconWallet className="w-5 h-5 text-blue-600" />
              </div>
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-2">Available Banked</div>
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  {availableBanked.toLocaleString()}
                </div>
                <div className="text-xs text-blue-600/70">gCO₂eq</div>
              </div>

              <div className={`bg-gradient-to-br ${cb >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} rounded-2xl shadow-lg border p-6 relative overflow-hidden`}>
                <div className={`absolute top-4 right-4 p-2 ${cb >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'} rounded-lg`}>
                  {cb >= 0 ? '✓' : '⚠'}
                </div>
                <div className={`text-xs font-medium ${cb >= 0 ? 'text-emerald-600' : 'text-red-600'} uppercase tracking-wider mb-2`}>Status</div>
                <div className={`text-3xl font-bold ${cb >= 0 ? 'text-emerald-700' : 'text-red-700'} mb-1`}>
                  {status.label}
                </div>
                <div className={`text-xs ${cb >= 0 ? 'text-emerald-600/70' : 'text-red-600/70'}`}>
                  {cb >= 0 ? 'Compliant' : 'Non-compliant'}
                </div>
              </div>
            </div>
          )}

          {/* Banking Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Surplus */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconWallet className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Bank Surplus</h2>
                <Tooltip>
                  <TooltipTrigger>
                    <IconInfoCircle className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Bank positive compliance balance for future use
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Bank positive compliance balance for future use.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (gCO₂eq)
                  </label>
                  <input
                    type="number"
                    value={bankAmount}
                    onChange={(e) => setBankAmount(e.target.value)}
                    placeholder="Enter amount to bank"
                    disabled={loading || cb === null || cb <= 0}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                <button
                  onClick={handleBank}
                  disabled={loading || !shipId || cb === null || cb <= 0 || !bankAmount}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Banking...
                    </span>
                  ) : (
                    "Bank Surplus"
                  )}
                </button>

                {cb !== null && cb <= 0 && (
                  <p className="text-sm text-red-600">Cannot bank: No surplus balance available</p>
                )}
              </div>
            </div>

            {/* Apply Banked */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconCoin className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">Apply Banked</h2>
                <Tooltip>
                  <TooltipTrigger>
                    <IconInfoCircle className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Apply previously banked surplus to current deficit
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Apply previously banked surplus to current deficit.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (gCO₂eq)
                  </label>
                  <input
                    type="number"
                    value={applyAmount}
                    onChange={(e) => setApplyAmount(e.target.value)}
                    placeholder="Enter amount to apply"
                    disabled={loading || availableBanked === 0}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                <button
                  onClick={handleApply}
                  disabled={loading || !shipId || availableBanked === 0 || !applyAmount}
                  className="w-full py-3 px-4 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Applying...
                    </span>
                  ) : (
                    "Apply Banked"
                  )}
                </button>

                {availableBanked === 0 && (
                  <p className="text-sm text-red-600">Cannot apply: No banked surplus available</p>
                )}
              </div>
            </div>
          </div>

          {/* Bank Records */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bank Records</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount (gCO₂eq)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Remaining (gCO₂eq)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingRecords ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Loading records...
                        </div>
                      </td>
                    </tr>
                  ) : bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No bank records found
                      </td>
                    </tr>
                  ) : (
                    bankRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {record.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {record.year}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {record.amountGco2eq.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {availableBanked.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
