// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: `API request failed: ${response.statusText}` 
      })) as { error?: string; message?: string };
      throw new Error(error.error ?? error.message ?? `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("An unexpected error occurred while fetching data");
  }
}

export const api = {
  getRoutes: async (filters?: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.vesselType) params.append("vesselType", filters.vesselType);
    if (filters?.fuelType) params.append("fuelType", filters.fuelType);
    if (filters?.year) params.append("year", filters.year.toString());
    const query = params.toString();
    return fetchApi<any[]>(`/routes${query ? `?${query}` : ""}`);
  },

  getComparison: async (): Promise<any[]> => {
    return fetchApi<any[]>("/routes/comparison");
  },

  setBaseline: async (routeId: number): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/routes/${routeId}/baseline`, {
      method: "POST",
    });
  },

  getCB: async (shipId: string, year: number): Promise<{ shipId: string; year: number; cb: number }> => {
    return fetchApi<{ shipId: string; year: number; cb: number }>(`/compliance/cb?shipId=${shipId}&year=${year}`);
  },

  getAdjustedCB: async (shipId: string, year: number): Promise<{ shipId: string; year: number; cbBefore: number; bankedAmount: number; cbAfter: number }> => {
    return fetchApi<{ shipId: string; year: number; cbBefore: number; bankedAmount: number; cbAfter: number }>(`/compliance/adjusted-cb?shipId=${shipId}&year=${year}`);
  },

  getBankRecords: async (shipId: string, year: number): Promise<any[]> => {
    return fetchApi<any[]>(`/banking/records?shipId=${shipId}&year=${year}`);
  },

  bankSurplus: async (shipId: string, year: number): Promise<{ shipId: string; year: number; cbBefore: number; banked: number; cbAfter: number }> => {
    return fetchApi<{ shipId: string; year: number; cbBefore: number; banked: number; cbAfter: number }>("/banking/bank", {
      method: "POST",
      body: JSON.stringify({ shipId, year }),
    });
  },

  applyBanked: async (shipId: string, year: number, amount: number): Promise<{ shipId: string; year: number; cbBefore: number; applied: number; cbAfter: number }> => {
    return fetchApi<{ shipId: string; year: number; cbBefore: number; applied: number; cbAfter: number }>("/banking/apply", {
      method: "POST",
      body: JSON.stringify({ shipId, year, amount }),
    });
  },

  createPool: async (year: number, members: Array<{ shipId: string }>): Promise<any> => {
    return fetchApi<any>("/pools", {
      method: "POST",
      body: JSON.stringify({ year, members }),
    });
  },
};

