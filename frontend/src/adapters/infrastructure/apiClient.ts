// src/adapters/infrastructure/apiClient.ts
import type { ApiClientPort } from "@/core/ports/ApiClientPort";
import type { RouteEntity, RouteComparison } from "@/core/domain/RouteEntity";
import type { ComplianceBalance, AdjustedComplianceBalance } from "@/core/domain/ComplianceEntity";
import type { BankRecord, BankResult } from "@/core/domain/BankingEntity";
import type { PoolResult } from "@/core/domain/PoolEntity";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ApiError {
  error?: string;
}

class ApiClient implements ApiClientPort {
  private async fetchApi<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error ?? `API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getRoutes(filters?: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<RouteEntity[]> {
    const params = new URLSearchParams();
    if (filters?.vesselType) params.append("vesselType", filters.vesselType);
    if (filters?.fuelType) params.append("fuelType", filters.fuelType);
    if (filters?.year) params.append("year", filters.year.toString());

    const query = params.toString();
    return this.fetchApi<RouteEntity[]>(`/routes${query ? `?${query}` : ""}`);
  }

  async getComparison(): Promise<RouteComparison[]> {
    return this.fetchApi<RouteComparison[]>("/routes/comparison");
  }

  async setBaseline(routeId: number): Promise<{ message: string }> {
    return this.fetchApi<{ message: string }>(`/routes/${routeId}/baseline`, {
      method: "POST",
    });
  }

  async getCB(shipId: string, year: number): Promise<ComplianceBalance> {
    return this.fetchApi<ComplianceBalance>(
      `/compliance/cb?shipId=${shipId}&year=${year}`
    );
  }

  async getAdjustedCB(
    shipId: string,
    year: number
  ): Promise<AdjustedComplianceBalance> {
    return this.fetchApi<AdjustedComplianceBalance>(
      `/compliance/adjusted-cb?shipId=${shipId}&year=${year}`
    );
  }

  async getBankRecords(
    shipId: string,
    year: number
  ): Promise<BankRecord[]> {
    return this.fetchApi<BankRecord[]>(
      `/banking/records?shipId=${shipId}&year=${year}`
    );
  }

  async bankSurplus(
    shipId: string,
    year: number
  ): Promise<BankResult> {
    return this.fetchApi<BankResult>("/banking/bank", {
      method: "POST",
      body: JSON.stringify({ shipId, year }),
    });
  }

  async applyBanked(
    shipId: string,
    year: number,
    amount: number
  ): Promise<BankResult> {
    return this.fetchApi<BankResult>("/banking/apply", {
      method: "POST",
      body: JSON.stringify({ shipId, year, amount }),
    });
  }

  async createPool(
    year: number,
    members: Array<{ shipId: string }>
  ): Promise<PoolResult> {
    return this.fetchApi<PoolResult>("/pools", {
      method: "POST",
      body: JSON.stringify({ year, members }),
    });
  }
}

export const apiClient = new ApiClient();