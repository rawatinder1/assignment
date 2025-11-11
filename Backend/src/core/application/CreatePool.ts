// src/core/application/CreatePool.ts
import type { PoolRepositoryPort } from "../ports/PoolRepositoryPort.js";
import type { ComplianceRepositoryPort } from "../ports/ComplianceRepositoryPort.js";
import type { BankRepositoryPort } from "../ports/BankRepositoryPort.js";
import { getAdjustedCB } from "./GetAdjustedCB.js";

interface PoolMemberInput {
  shipId: string;
}

export async function createPool(
  poolRepo: PoolRepositoryPort,
  complianceRepo: ComplianceRepositoryPort,
  bankRepo: BankRepositoryPort,
  year: number,
  members: PoolMemberInput[]
) {
  if (members.length === 0) {
    throw new Error("Pool must have at least one member");
  }

  // Get adjusted CB for each member
  const memberCBs = await Promise.all(
    members.map(async (member) => {
      const adjusted = await getAdjustedCB(
        complianceRepo,
        bankRepo,
        member.shipId,
        year
      );
      return {
        shipId: member.shipId,
        cbBefore: adjusted.cbAfter, // Use adjusted CB as starting point
      };
    })
  );

  // Validate: Sum of CBs must be >= 0
  const sumCB = memberCBs.reduce((sum, m) => sum + m.cbBefore, 0);
  if (sumCB < 0) {
    throw new Error(
      `Pool invalid: Sum of compliance balances (${sumCB}) is negative`
    );
  }

  // Greedy allocation: sort by CB descending (surplus first, then deficits)
  const sorted = [...memberCBs].sort((a, b) => b.cbBefore - a.cbBefore);

  // Calculate allocations
  const allocations: Array<{ shipId: string; cbBefore: number; cbAfter: number }> = [];
  let surplus = 0;

  for (const member of sorted) {
    if (member.cbBefore >= 0) {
      // Surplus ship: can contribute
      surplus += member.cbBefore;
      allocations.push({
        shipId: member.shipId,
        cbBefore: member.cbBefore,
        cbAfter: 0, // Surplus ships exit at 0
      });
    } else {
      // Deficit ship: can receive
      const deficit = Math.abs(member.cbBefore);
      if (surplus >= deficit) {
        // Can fully cover deficit
        surplus -= deficit;
        allocations.push({
          shipId: member.shipId,
          cbBefore: member.cbBefore,
          cbAfter: 0, // Deficit fully covered
        });
      } else {
        // Partial coverage
        const remainingDeficit = deficit - surplus;
        allocations.push({
          shipId: member.shipId,
          cbBefore: member.cbBefore,
          cbAfter: -remainingDeficit, // Remaining deficit
        });
        surplus = 0;
      }
    }
  }

  // Validation rules:
  // 1. Deficit ship cannot exit worse
  // 2. Surplus ship cannot exit negative
  for (const alloc of allocations) {
    const original = memberCBs.find((m) => m.shipId === alloc.shipId)!;
    if (original.cbBefore < 0 && alloc.cbAfter < original.cbBefore) {
      throw new Error(
        `Pool invalid: Deficit ship ${alloc.shipId} would exit worse (${alloc.cbAfter} < ${original.cbBefore})`
      );
    }
    if (original.cbBefore >= 0 && alloc.cbAfter < 0) {
      throw new Error(
        `Pool invalid: Surplus ship ${alloc.shipId} would exit negative (${alloc.cbAfter} < 0)`
      );
    }
  }

  // Create the pool
  const pool = await poolRepo.createPool(year, allocations);

  return {
    poolId: pool.id,
    year: pool.year,
    members: allocations,
    poolSum: sumCB,
  };
}

