"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  grantImportPermission,
  listImportPermissions,
  listUsersAccess,
  revokeImportPermission,
  type ImportPermissionResponse,
  type UserAccessResponse,
} from "@/lib/api";

export default function AdminUsuariosPage() {
  const { token, profile, logout } = useAuth();

  const [users, setUsers] = useState<UserAccessResponse[]>([]);
  const [permissions, setPermissions] = useState<ImportPermissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [saving, setSaving] = useState(false);

  const isPrincipalAdmin = Boolean(profile?.is_admin_principal);

  const permissionEmailSet = useMemo(
    () => new Set(permissions.map((item) => item.email.toLowerCase())),
    [permissions],
  );

  async function refreshData() {
    if (!token || !isPrincipalAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [usersData, permissionsData] = await Promise.all([
        listUsersAccess(token),
        listImportPermissions(token),
      ]);
      setUsers(usersData);
      setPermissions(permissionsData);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar usuarios.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isPrincipalAdmin]);

  async function handleGrant(email: string) {
    if (!token) return;

    setSaving(true);
    try {
      await grantImportPermission(token, email.toLowerCase());
      await refreshData();
      setEmailInput("");
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao liberar usuario.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(email: string) {
    if (!token) return;

    setSaving(true);
    try {
      await revokeImportPermission(token, email.toLowerCase());
      await refreshData();
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao revogar usuario.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header card">
        <div>
          <h1>Painel de Usuarios</h1>
          <p>Gestao de permissoes de importacao para {profile?.email ?? "admin"}.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/importacao" className="admin-link-btn">
            Ir para Importacao
          </Link>
          <Link href="/chamados" className="admin-link-btn">
            Dashboard
          </Link>
          <button type="button" className="auth-logout-btn" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </header>

      {!isPrincipalAdmin ? (
        <section className="card admin-section">
          <p className="auth-error">Somente o admin principal pode acessar este painel.</p>
        </section>
      ) : (
        <>
          <section className="card admin-section">
            <h2>Liberar novo usuario</h2>
            <div className="permission-form">
              <input
                type="email"
                placeholder="email@empresa.com"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
              />
              <button
                type="button"
                className="home-entry-link"
                disabled={!emailInput.trim() || saving}
                onClick={() => void handleGrant(emailInput.trim())}
              >
                Liberar importacao
              </button>
            </div>
            {error ? <p className="auth-error">{error}</p> : null}
          </section>

          <section className="card admin-section">
            <h2>Usuarios e permissoes</h2>
            {loading ? <p>Carregando usuarios...</p> : null}
            {!loading && users.length === 0 ? <p>Nenhum usuario encontrado.</p> : null}
            {!loading && users.length > 0 ? (
              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>E-mail</th>
                      <th>Tipo</th>
                      <th>Importacao</th>
                      <th>Acao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const permissionExists = permissionEmailSet.has(user.email.toLowerCase());
                      return (
                        <tr key={user.email}>
                          <td>{user.email}</td>
                          <td>{user.is_admin_principal ? "Admin principal" : "Usuario"}</td>
                          <td>{user.can_import ? "Liberado" : "Sem acesso"}</td>
                          <td>
                            {user.is_admin_principal ? (
                              <span className="users-action-muted">N/A</span>
                            ) : permissionExists ? (
                              <button
                                type="button"
                                className="permission-revoke-btn"
                                disabled={saving}
                                onClick={() => void handleRevoke(user.email)}
                              >
                                Revogar
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="home-entry-link users-grant-btn"
                                disabled={saving}
                                onClick={() => void handleGrant(user.email)}
                              >
                                Liberar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </>
      )}
    </main>
  );
}
