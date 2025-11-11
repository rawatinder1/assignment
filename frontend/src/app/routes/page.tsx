"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { IconInfoCircle, IconRoute, IconFilter, IconFilterOff } from "@tabler/icons-react";

interface Route {
  id: number;
  routeId: string;
  year: number;
  vesselType: string;
  fuelType: string;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  ghgIntensity: number;
  isBaseline: boolean;
}

export default function RoutesPage() {
  const [allRoutes, setAllRoutes] = useState<Route[]>([]); // Store all routes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }>({});

  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);

  // Load all routes once on mount
  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRoutes(); // Fetch all routes without filters

      setAllRoutes(data);

      // Extract unique values for filters
      const uniqueVesselTypes = [...new Set(data.map((r: Route) => r.vesselType))].sort();
      const uniqueFuelTypes = [...new Set(data.map((r: Route) => r.fuelType))].sort();
      const uniqueYears = [...new Set(data.map((r: Route) => r.year))].sort((a, b) => b - a);

      setVesselTypes(uniqueVesselTypes);
      setFuelTypes(uniqueFuelTypes);
      setYears(uniqueYears);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load routes";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load routes once on mount
  useEffect(() => {
    void loadRoutes();
  }, []);

  // Filter routes on the client side (instant, no API calls)
  const filteredRoutes = allRoutes.filter((route) => {
    if (filters.vesselType && route.vesselType !== filters.vesselType) return false;
    if (filters.fuelType && route.fuelType !== filters.fuelType) return false;
    if (filters.year && route.year !== filters.year) return false;
    return true;
  });

  const handleSetBaseline = async (routeId: number) => {
    try {
      await api.setBaseline(routeId);
      toast.success("Baseline updated successfully");
      
      // Optimistic update: Update local state immediately
      setAllRoutes(prevRoutes => 
        prevRoutes.map(r => ({
          ...r,
          isBaseline: r.id === routeId
        }))
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set baseline";
      toast.error(errorMsg);
      // Revert on error
      await loadRoutes();
    }
  };

  if (loading && allRoutes.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filters.vesselType || filters.fuelType || filters.year;

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
          <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <IconRoute className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Routes Management</h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    View and manage all shipping routes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filteredRoutes.length}</span>
                <span>{filteredRoutes.length === allRoutes.length ? 'routes' : `of ${allRoutes.length} routes`}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconFilter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filters</span>
                  {hasActiveFilters && (
                    <span className="text-xs text-gray-500">({filteredRoutes.length} results)</span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-all"
                  >
                    <IconFilterOff className="w-3.5 h-3.5" />
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Vessel Type
                  </label>
                  <select
                    value={filters.vesselType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, vesselType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Vessel Types</option>
                    {vesselTypes.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Fuel Type
                  </label>
                  <select
                    value={filters.fuelType ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, fuelType: e.target.value === "" ? undefined : e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Fuel Types</option>
                    {fuelTypes.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Year
                  </label>
                  <select
                    value={filters.year ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
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
                      Fuel Consumption
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Emissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <IconFilter className="w-12 h-12 text-gray-300" />
                          <p className="text-sm font-medium">No routes found</p>
                          <p className="text-xs">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        route.isBaseline ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{route.routeId}</span>
                          {route.isBaseline && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Baseline
                            </span>
                          )}
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.fuelConsumption.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.distance.toLocaleString()} <span className="text-xs text-gray-500">km</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.totalEmissions.toLocaleString()} <span className="text-xs text-gray-500">t</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!route.isBaseline && (
                          <button
                            onClick={() => handleSetBaseline(route.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
                          >
                            Set Baseline
                          </button>
                        )}
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
    </>
  );
}
