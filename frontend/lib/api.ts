import { DashboardCustosPayload, DashboardManutencaoPayload, DashboardPayload, TipoManutencao } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type AuthMeResponse = {
  email: string;
  is_admin_principal: boolean;
  can_import: boolean;
};

export type AuthModeResponse = {
  auth_mode: string;
};

export type ImportPermissionResponse = {
  email: string;
  granted_by: string;
};

export type UserAccessResponse = {
  email: string;
  is_admin_principal: boolean;
  can_import: boolean;
};

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchDashboardCorretivas(token: string): Promise<DashboardPayload> {
  const response = await fetch(`${API_BASE}/dashboard/manutencao`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar dashboard (${response.status})`);
  }

  return response.json() as Promise<DashboardPayload>;
}

export async function fetchDashboardManutencao(token: string): Promise<DashboardManutencaoPayload> {
  const response = await fetch(`${API_BASE}/dashboard/manutencao`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar dashboard manutencao (${response.status})`);
  }

  return response.json() as Promise<DashboardManutencaoPayload>;
}

export async function fetchDashboardCustos(token: string): Promise<DashboardCustosPayload> {
  const response = await fetch(`${API_BASE}/dashboard/custos`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar dashboard custos (${response.status})`);
  }

  return response.json() as Promise<DashboardCustosPayload>;
}

export async function fetchAuthMe(token: string): Promise<AuthMeResponse> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Falha ao validar acesso (${response.status})`);
  }

  return response.json() as Promise<AuthMeResponse>;
}

export async function fetchAuthMode(): Promise<AuthModeResponse> {
  const response = await fetch(`${API_BASE}/auth/mode`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Falha ao obter modo de autenticacao (${response.status})`);
  }

  return response.json() as Promise<AuthModeResponse>;
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
    throw new Error(text || `Falha no login local (${response.status})`);
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
    throw new Error(`Falha ao listar liberacoes (${response.status})`);
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
    throw new Error(`Falha ao listar usuarios (${response.status})`);
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
    throw new Error(text || `Falha ao liberar e-mail (${response.status})`);
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
    throw new Error(text || `Falha ao revogar e-mail (${response.status})`);
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
    throw new Error(text || `Falha ao importar planilha (${response.status})`);
  }

  return response.json() as Promise<{ mensagem: string }>;
}
