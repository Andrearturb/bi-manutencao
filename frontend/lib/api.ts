/**
 * Cliente HTTP simples para chamadas ao backend.
 *
 * Contém helpers tipados para carregar dashboards, autenticação e operações
 * administrativas (listar usuários, permissões e upload de planilhas).
 */
import { DashboardCustosPayload, DashboardManutencaoPayload, DashboardPayload, TipoManutencao } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/** Resposta com os dados do usuário autenticado. */
export type AuthMeResponse = {
  email: string;
  is_admin_principal: boolean;
  can_import: boolean;
};

/** Resposta com o modo de autenticação ativo no backend. */
export type AuthModeResponse = {
  auth_mode: string;
};

/** Resposta com uma permissão de importação. */
export type ImportPermissionResponse = {
  email: string;
  granted_by: string;
};

/** Resposta com acesso consolidado de um usuário. */
export type UserAccessResponse = {
  email: string;
  is_admin_principal: boolean;
  can_import: boolean;
};

/** Monta os headers de autorização para chamadas autenticadas. */
function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Falha na requisição (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function fetchDashboardCorretivas(token: string): Promise<DashboardPayload> {
  return fetchJson<DashboardPayload>(`${API_BASE}/dashboard/manutencao`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
}

export async function fetchDashboardManutencao(token: string): Promise<DashboardManutencaoPayload> {
  return fetchJson<DashboardManutencaoPayload>(`${API_BASE}/dashboard/manutencao`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
}

export async function fetchDashboardCustos(token: string): Promise<DashboardCustosPayload> {
  return fetchJson<DashboardCustosPayload>(`${API_BASE}/dashboard/custos`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
}

export async function fetchAuthMe(token: string): Promise<AuthMeResponse> {
  return fetchJson<AuthMeResponse>(`${API_BASE}/auth/me`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
}

export async function fetchAuthMode(): Promise<AuthModeResponse> {
  return fetchJson<AuthModeResponse>(`${API_BASE}/auth/mode`, { cache: "no-store" });
}

export async function loginLocal(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/local/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Falha no login local.");
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export async function listImportPermissions(token: string): Promise<ImportPermissionResponse[]> {
  const response = await fetch(`${API_BASE}/auth/import-permissions`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Falha ao listar liberações.");
  }

  const data = (await response.json()) as { items: ImportPermissionResponse[] };
  return data.items;
}

export async function listUsersAccess(token: string): Promise<UserAccessResponse[]> {
  const response = await fetch(`${API_BASE}/auth/users`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Falha ao listar usuários.");
  }

  const data = (await response.json()) as { items: UserAccessResponse[] };
  return data.items;
}

export async function grantImportPermission(token: string, email: string): Promise<ImportPermissionResponse> {
  const response = await fetch(`${API_BASE}/auth/import-permissions`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Falha ao liberar e-mail.");
  }

  return response.json() as Promise<ImportPermissionResponse>;
}

export async function revokeImportPermission(token: string, email: string): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/import-permissions/${encodeURIComponent(email)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Falha ao revogar e-mail.");
  }
}

export async function uploadPlanilhaManutencao(
  token: string,
  file: File,
  tipo: TipoManutencao,
): Promise<{ mensagem: string }> {
  const formData = new FormData();
  formData.append("arquivo", file);

  const response = await fetch(`${API_BASE}/importar/manutencao?tipo=${encodeURIComponent(tipo)}`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Falha ao importar planilha.");
  }

  return response.json() as Promise<{ mensagem: string }>;
}
