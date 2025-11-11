import type { RouteRepositoryPort } from "../ports/RouteRepositoryPort.js";

export async function setBaseline(repo: RouteRepositoryPort, routeId: number) {
  await repo.setBaseline(routeId);
  return { message: `Route ${routeId} set as baseline.` };
}