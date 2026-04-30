"use client";

import Link from "next/link";
export default function AdminImportacaoPage() {
  return (
    <main className="admin-shell">
      <header className="admin-header card">
        <div>
          <h1>Área desativada</h1>
          <p>O acesso administrativo foi removido desta interface.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/chamados" className="admin-link-btn">
            Voltar ao dashboard
          </Link>
        </div>
      </header>

      <section className="card admin-section">
        <p>Esta área não está mais disponível.</p>
      </section>
    </main>
  );
}
