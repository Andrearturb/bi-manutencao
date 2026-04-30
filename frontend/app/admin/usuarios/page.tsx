"use client";

/**
 * Página administrativa de usuários.
 *
 * Permite ao admin principal listar usuários, liberar ou revogar permissão de importação.
 */

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

/** Tela administrativa para gestão de usuários e permissões de importação. */
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
      const message = err instanceof Error ? err.message : "Falha ao carregar usuários.";
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
      const message = err instanceof Error ? err.message : "Falha ao liberar usuário.";
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
      const message = err instanceof Error ? err.message : "Falha ao revogar usuário.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-shell">
      {/* Cabeçalho: navegação administrativa e ações */}
      <header className="admin-header card">
        <div>
          <h1>Painel de usuários</h1>
          <p>Gestão de permissões de importação para {profile?.email ?? "admin"}.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/importacao" className="admin-link-btn">
            Ir para importação
          </Link>
          <Link href="/chamados" className="admin-link-btn">
            Painel
          </Link>
          <button type="button" className="auth-logout-btn" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </header>

      {!isPrincipalAdmin ? (
        <section className="card admin-section">
          {/* Aviso: acesso restrito ao admin principal */}
          <p className="auth-error">Somente o admin principal pode acessar este painel.</p>
        </section>
      ) : (
        <>
          <section className="card admin-section">
            <h2>Liberar novo usuário</h2>
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
                Liberar importação
              </button>
            </div>
            {error ? <p className="auth-error">{error}</p> : null}
          </section>

          <section className="card admin-section">
            <h2>Usuários e permissões</h2>
            {loading ? <p>Carregando usuários...</p> : null}
            {!loading && users.length === 0 ? <p>Nenhum usuário encontrado.</p> : null}
            {!loading && users.length > 0 ? (
              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>E-mail</th>
                      <th>Tipo</th>
                      <th>Importação</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const permissionExists = permissionEmailSet.has(user.email.toLowerCase());
                      return (
                        <tr key={user.email}>
                          <td>{user.email}</td>
                          <td>{user.is_admin_principal ? "Admin principal" : "Usuário"}</td>
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
