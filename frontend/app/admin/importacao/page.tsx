"use client";

/**
 * Página administrativa de importação e gerenciamento de permissões.
 *
 * - Upload de planilhas de manutenção (corretiva/preventiva)
 * - Gerenciamento de permissões de importação para usuários
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  grantImportPermission,
  listImportPermissions,
  listUsersAccess,
  revokeImportPermission,
  uploadPlanilhaManutencao,
  type ImportPermissionResponse,
  type UserAccessResponse,
} from "@/lib/api";
import { type TipoManutencao } from "@/lib/types";

/** Tela administrativa para importar planilhas e gerenciar permissões. */
export default function AdminImportacaoPage() {
  const { token, profile, logout } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoManutencao, setTipoManutencao] = useState<TipoManutencao>("corretiva");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [users, setUsers] = useState<UserAccessResponse[]>([]);
  const [permissions, setPermissions] = useState<ImportPermissionResponse[]>([]);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [savingPermission, setSavingPermission] = useState(false);

  const canImport = Boolean(profile?.can_import);
  const isPrincipalAdmin = Boolean(profile?.is_admin_principal);

  const permissionEmailSet = useMemo(
    () => new Set(permissions.map((item) => item.email.toLowerCase())),
    [permissions],
  );

  async function refreshUsersAndPermissions() {
    if (!token || !isPrincipalAdmin) return;

    try {
      const [usersData, permissionsData] = await Promise.all([
        listUsersAccess(token),
        listImportPermissions(token),
      ]);
      setUsers(usersData);
      setPermissions(permissionsData);
      setPermissionsError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar usuários e permissões.";
      setPermissionsError(message);
    }
  }

  useEffect(() => {
    void refreshUsersAndPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isPrincipalAdmin]);

  async function handleUpload() {
    if (!token || !selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadMessage(null);

    try {
      const response = await uploadPlanilhaManutencao(token, selectedFile, tipoManutencao);
      setUploadMessage(response.mensagem ?? "Importação concluída com sucesso.");
      setSelectedFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao importar planilha.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleGrantPermission(email: string) {
    if (!token) return;

    setSavingPermission(true);
    try {
      await grantImportPermission(token, email.toLowerCase());
      setEmailInput("");
      await refreshUsersAndPermissions();
      setPermissionsError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao liberar usuário.";
      setPermissionsError(message);
    } finally {
      setSavingPermission(false);
    }
  }

  async function handleRevokePermission(email: string) {
    if (!token) return;

    setSavingPermission(true);
    try {
      await revokeImportPermission(token, email.toLowerCase());
      await refreshUsersAndPermissions();
      setPermissionsError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao revogar usuário.";
      setPermissionsError(message);
    } finally {
      setSavingPermission(false);
    }
  }

  return (
    <main className="admin-shell">
      {/* Cabeçalho administrativo: ações e vínculo ao dashboard */}
      <header className="admin-header card">
        <div>
          <h1>Área Administrativa</h1>
          <p>Acesso corporativo ativo para {profile?.email ?? "usuário"}.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/chamados" className="admin-link-btn">
            Voltar ao dashboard
          </Link>
          <button type="button" className="auth-logout-btn" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </header>

      <section className="card admin-section">
        {/* Importação: selecionar tipo e enviar arquivo */}
        <h2>Importar planilha</h2>
        {!canImport ? (
          <p className="auth-error">Seu e-mail ainda não possui liberação de importação.</p>
        ) : (
          <>
            <label className="select-field" style={{ maxWidth: 320 }}>
              <span>Tipo de manutenção</span>
              <select
                value={tipoManutencao}
                onChange={(event) => setTipoManutencao(event.target.value as TipoManutencao)}
              >
                <option value="corretiva">Corretiva</option>
                <option value="preventiva">Preventiva</option>
              </select>
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="home-entry-link"
              disabled={!selectedFile || isUploading}
              onClick={() => void handleUpload()}
            >
              {isUploading ? "Importando..." : "Enviar planilha"}
            </button>
            {uploadMessage ? <p className="auth-success">{uploadMessage}</p> : null}
            {uploadError ? <p className="auth-error">{uploadError}</p> : null}
          </>
        )}
      </section>

      <section className="card admin-section">
        {/* Permissões: listagem e controles de liberar/revogar */}
        <h2>Permissões de usuários</h2>
        {!isPrincipalAdmin ? (
          <p className="auth-error">
            Somente o admin principal pode liberar novos e-mails para importar.
          </p>
        ) : (
          <>
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
                disabled={!emailInput.trim() || savingPermission}
                onClick={() => void handleGrantPermission(emailInput.trim())}
              >
                Liberar importação
              </button>
            </div>

            {permissionsError ? <p className="auth-error">{permissionsError}</p> : null}

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
                              disabled={savingPermission}
                              onClick={() => void handleRevokePermission(user.email)}
                            >
                              Revogar
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="home-entry-link users-grant-btn"
                              disabled={savingPermission}
                              onClick={() => void handleGrantPermission(user.email)}
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
          </>
        )}
      </section>
    </main>
  );
}
