"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IconInfoCircle, IconChartBar } from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
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
    loadComparison();
  }, []);

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getComparison();
      setComparison(data);
      toast.success(`Loaded comparison for ${data.length} routes`);
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
    ghgIntensity: route.ghgIntensity,
    target: TARGET_INTENSITY,
  }));

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <IconChartBar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Compare Routes</h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Compare route GHG intensities against the target
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                  Compliance Target
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {TARGET_INTENSITY} <span className="text-sm font-normal text-gray-500">gCO₂e/MJ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <IconChartBar className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">GHG Intensity Comparison</h2>
              <Tooltip>
                <TooltipTrigger>
                  <IconInfoCircle className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  Green bars indicate compliant routes (below target)
                </TooltipContent>
              </Tooltip>
            </div>
            
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="routeId"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  stroke="#9ca3af"
                  label={{
                    value: "gCO₂e/MJ",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#6b7280" },
                  }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="ghgIntensity"
                  fill="#10b981"
                  name="Route GHG Intensity"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="target"
                  fill="#3b82f6"
                  name="Target (89.3368)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Vessel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fuel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      GHG Intensity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      % Difference
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Compliance Balance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparison.map((route) => (
                    <tr
                      key={route.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {route.routeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.vesselType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {route.ghgIntensity.toFixed(2)} <span className="text-xs text-gray-500">gCO₂e/MJ</span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                          route.percentDiff >= 0
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {route.percentDiff >= 0 ? "+" : ""}
                        {route.percentDiff.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {route.complianceBalance.toLocaleString()} <span className="text-xs text-gray-500">gCO₂eq</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {route.isCompliant ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            Compliant
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
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
    </TooltipProvider>
  );
}
