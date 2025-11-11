"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";

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
  const [adjustedCb, setAdjustedCb] = useState<number | null>(null);
  const [bankedAmount, setBankedAmount] = useState<number>(0);
  const [applyAmount, setApplyAmount] = useState("");
  const [bankRecords, setBankRecords] = useState<BankRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load data when shipId and year change (debounced)
  useEffect(() => {
    // Only load if shipId has at least 1 character
    if (shipId && shipId.trim().length > 0 && year) {
      const timer = setTimeout(() => {
        void loadCompleteData();
      }, 500); // Debounce to avoid too many API calls while typing
      
      return () => clearTimeout(timer);
    } else {
      // Reset state when shipId is cleared
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipId, year]);

  const loadCompleteData = async () => {
    if (!shipId || !year) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch CB
      const cbResult = await api.getCB(shipId, year);
      setCb(cbResult.cb ?? 0);

      // Fetch adjusted CB (includes banked amount)
      const adjustedResult = await api.getAdjustedCB(shipId, year);
      setAdjustedCb(adjustedResult.cbAfter ?? 0);
      setBankedAmount(adjustedResult.bankedAmount ?? 0);

      // Fetch bank records
      const records = await api.getBankRecords(shipId, year);
      setBankRecords(records ?? []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMsg);
      
      // Reset to safe defaults on error
      setCb(null);
      setAdjustedCb(null);
      setBankedAmount(0);
      setBankRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSurplus = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    if (cb === null || cb <= 0) {
      toast.error("No positive balance available to bank");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Backend banks the ENTIRE positive CB automatically
      const result = await api.bankSurplus(shipId, year);
      
      toast.success(`Successfully banked ${result.banked.toLocaleString()} gCO₂eq`);
      
      // Reload all data
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to bank surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const handleApplyBanked = async () => {
    if (!shipId || !year) {
      toast.error("Please enter Ship ID and Year");
      return;
    }
    
    const amount = parseFloat(applyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    
    if (amount > bankedAmount) {
      toast.error(`Amount exceeds available banked surplus (${bankedAmount.toLocaleString()} gCO₂eq)`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.applyBanked(shipId, year, amount);
      
      toast.success(`Successfully applied ${result.applied.toLocaleString()} gCO₂eq`);
      setApplyAmount("");
      
      // Reload all data
      await loadCompleteData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to apply banked surplus";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const totalBankedFromRecords = bankRecords.reduce((sum, record) => sum + (record.amountGco2eq ?? 0), 0);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Banking Operations
          </h1>
          <p className="text-muted-foreground mt-2">
            Bank surplus or apply banked compliance balance (Article 20)
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Input Form */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Ship & Year Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Ship/Route ID
              </label>
              <input
                type="text"
                value={shipId}
                onChange={(e) => setShipId(e.target.value)}
                placeholder="Enter ship ID"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: R001, R002, etc.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
                placeholder="2024"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !cb && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading compliance data...</p>
          </div>
        )}

        {/* KPI Cards */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Current CB
                </span>
                <span className={`text-xs font-semibold ${cb > 0 ? 'text-green-600' : cb < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {cb > 0 ? 'Surplus' : cb < 0 ? 'Deficit' : 'Balanced'}
                </span>
              </div>
              <div className="text-2xl font-bold">
                {cb.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Banked Amount
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {(bankedAmount ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂eq Available</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Adjusted CB
              </div>
              <div className="text-2xl font-bold">
                {adjustedCb !== null ? adjustedCb.toLocaleString() : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">After Banking</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Total Banked
              </div>
              <div className="text-2xl font-bold">
                {totalBankedFromRecords.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">From All Years</div>
            </div>
          </div>
        )}

        {/* Banking Actions */}
        {cb !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Surplus Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Bank Surplus</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Bank your entire positive compliance balance for future use (Article 20).
              </p>
              
              {cb !== null && cb > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-green-50 border border-green-200">
                    <p className="text-sm text-green-800">
                      Available to bank: <span className="font-bold">{(cb ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={handleBankSurplus}
                    disabled={loading}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Banking..." : "Bank Entire Surplus"}
                  </button>
                  
                  <p className="text-xs text-muted-foreground">
                    Note: This will bank the entire positive CB balance
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    {cb === 0 ? 'No surplus available to bank' : 'Cannot bank: Balance is in deficit'}
                  </p>
                </div>
              )}
            </div>

            {/* Apply Banked Action */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Apply Banked</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Apply previously banked surplus to reduce your current deficit.
              </p>
              
              {bankedAmount !== null && bankedAmount > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      Available: <span className="font-bold">{(bankedAmount ?? 0).toLocaleString()} gCO₂eq</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount to Apply (gCO₂eq)
                    </label>
                    <input
                      type="number"
                      value={applyAmount}
                      onChange={(e) => setApplyAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={loading}
                      max={bankedAmount}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    onClick={handleApplyBanked}
                    disabled={loading || !applyAmount || parseFloat(applyAmount) <= 0}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Applying..." : "Apply Banked"}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted border border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    No banked surplus available to apply
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bank Records */}
        {shipId && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Bank Records History</h2>
              <p className="text-sm text-muted-foreground mt-1">
                All banking transactions for {shipId}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount (gCO₂eq)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                          <span className="text-sm">Loading records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <p className="text-sm">No bank records found for this ship</p>
                        <p className="text-xs mt-1">Bank surplus to create records</p>
                      </td>
                    </tr>
                  ) : (
                    bankRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">
                          #{record.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.shipId}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {record.year}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">
                          {(record.amountGco2eq ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
