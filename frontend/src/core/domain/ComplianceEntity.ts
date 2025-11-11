// src/core/domain/ComplianceEntity.ts

export interface ComplianceBalance {
  shipId: string;
  year: number;
  cb: number;
}

export interface AdjustedComplianceBalance {
  shipId: string;
  year: number;
  cbBefore: number;
  netBanked: number;
  cbAfter: number;
}

