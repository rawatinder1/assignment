"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const TARGET_INTENSITY = 89.3368;

interface RouteComparison {
  id: number;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  percentDiff: number;
  complianceBalance: number;
  isCompliant: boolean;
}

export default function ComparePage() {
  const [comparison, setComparison] = useState<RouteComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadComparison();
  }, []);

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getComparison();
      setComparison(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load comparison";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && comparison.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  const chartData = comparison.map((route) => ({
    routeId: route.routeId,
    intensity: route.ghgIntensity,
    vesselType: route.vesselType,
    fuelType: route.fuelType,
    year: route.year,
    percentDiff: route.percentDiff,
    isCompliant: route.isCompliant,
    complianceBalance: route.complianceBalance,
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{data.routeId}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">GHG Intensity:</span>
            <span className="font-semibold text-gray-900">{data.intensity.toFixed(2)} gCO₂e/MJ</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Target:</span>
            <span className="font-semibold text-blue-600">{TARGET_INTENSITY} gCO₂e/MJ</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Difference:</span>
            <span className={`font-semibold ${data.percentDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {data.percentDiff >= 0 ? '+' : ''}{data.percentDiff.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">CB:</span>
            <span className={`font-semibold ${data.complianceBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.complianceBalance.toLocaleString()} gCO₂eq
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 mt-2">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Vessel:</span>
              <span className="font-medium text-gray-900">{data.vesselType}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Fuel:</span>
              <span className="font-medium text-gray-900">{data.fuelType}</span>
            </div>
          </div>
          <div className="pt-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
              data.isCompliant 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {data.isCompliant ? '✓ Compliant' : '✗ Non-compliant'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Compare Routes
            </h1>
            <p className="text-muted-foreground mt-2">
              Analyze route GHG intensities against the compliance target
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Target Intensity
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {TARGET_INTENSITY}
              </div>
              <div className="text-xs text-muted-foreground mt-1">gCO₂e/MJ</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Total Routes
              </div>
              <div className="text-2xl font-bold">
                {comparison.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">analyzed</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Compliant
              </div>
              <div className="text-2xl font-bold text-green-600">
                {comparison.filter(r => r.isCompliant).length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">routes</div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Non-Compliant
              </div>
              <div className="text-2xl font-bold text-red-600">
                {comparison.filter(r => !r.isCompliant).length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">routes</div>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-6">GHG Intensity Analysis</h2>
            
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorCompliant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="colorNonCompliant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="routeId"
                  tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  stroke="#9ca3af"
                  label={{
                    value: "GHG Intensity (gCO₂e/MJ)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#6b7280", fontWeight: 500 },
                  }}
                  domain={[0, 'auto']}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                />
                <ReferenceLine 
                  y={TARGET_INTENSITY} 
                  stroke="#3b82f6" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  label={{ 
                    value: `Target: ${TARGET_INTENSITY}`, 
                    position: 'right', 
                    fill: '#3b82f6', 
                    fontSize: 12,
                    fontWeight: 600
                  }}
                />
                <Bar
                  dataKey="intensity"
                  fill="#8884d8"
                  name="GHG Intensity"
                  radius={[8, 8, 0, 0]}
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    const fillColor = payload.isCompliant ? "url(#colorCompliant)" : "url(#colorNonCompliant)";
                    return (
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={fillColor}
                        rx={8}
                        ry={8}
                      />
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>

            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-b from-green-500/80 to-green-500/60" />
                <span className="text-muted-foreground">Compliant (Below Target)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-b from-red-500/80 to-red-500/60" />
                <span className="text-muted-foreground">Non-Compliant (Above Target)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-blue-600" style={{ borderTop: '2px dashed' }} />
                <span className="text-muted-foreground">Compliance Target</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Detailed Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Vessel Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Fuel Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      GHG Intensity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      % Difference
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      CB (gCO₂eq)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {comparison.map((route) => (
                    <tr
                      key={route.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {route.routeId}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {route.vesselType}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {route.fuelType}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {route.year}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right">
                        {route.ghgIntensity.toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-semibold text-right ${
                          route.percentDiff >= 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {route.percentDiff >= 0 ? "+" : ""}
                        {route.percentDiff.toFixed(2)}%
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold text-right ${
                        route.complianceBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {route.complianceBalance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {route.isCompliant ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Compliant
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            Non-compliant
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
