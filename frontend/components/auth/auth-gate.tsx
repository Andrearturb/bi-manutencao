"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";

/** Garante que o usuário veja a tela correta conforme o estado de autenticação. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, token, error, authMode, isConfigured, loginMicrosoft, loginLocal } = useAuth();
  const [email, setEmail] = useState("admin@local.test");
  const [password, setPassword] = useState("admin123");

  if (!isConfigured) {
    return (
      <main className="center-message error">
        Login Microsoft não configurado. Defina as variáveis NEXT_PUBLIC_AZURE_CLIENT_ID e NEXT_PUBLIC_AZURE_TENANT_ID.
      </main>
    );
  }

  if (loading) {
    return <main className="center-message">Validando acesso corporativo...</main>;
  }

  if (!token) {
    return (
      <main className="auth-entry">
        <section className="auth-card">
          <h1>Acesso ao sistema</h1>
          <p>
            {authMode === "microsoft"
              ? "Entre com seu e-mail Microsoft corporativo para visualizar o sistema."
              : "Use seu login local de desenvolvimento para acessar o sistema."}
          </p>
          {error ? <p className="auth-error">{error}</p> : null}
          {authMode === "microsoft" ? (
            <button className="home-entry-link" type="button" onClick={() => void loginMicrosoft()}>
              Entrar com Microsoft
            </button>
          ) : (
            <form
              className="local-auth-form"
              onSubmit={(event) => {
                event.preventDefault();
                void loginLocal(email, password);
              }}
            >
              <input
                type="email"
                placeholder="e-mail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <input
                type="password"
                placeholder="senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button className="home-entry-link" type="submit">
                Entrar
              </button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
