import { DashboardPayload } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function fetchDashboardCorretivas(): Promise<DashboardPayload> {
  const response = await fetch(`${API_BASE}/dashboard/manutencao`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar dashboard (${response.status})`);
  }

  return response.json() as Promise<DashboardPayload>;
}
