"use client";

/**
 * Página de custos.
 *
 * Exibe filtros específicos de custos, KPIs resumidos e rankings por fornecedor/loja.
 * Utiliza `useCustosDashboard` para obter dados e handlers.
 */

import Link from "next/link";

import { KpiCard, SelectField } from "@/components/chamados/chamados-cards";
import { useAuth } from "@/components/auth/auth-provider";
import { useCustosDashboard } from "@/lib/hooks/use-custos-dashboard";

/** Tela principal do painel de custos. */
export default function CustosPage() {
  const { token, logout } = useAuth();
  const {
    loading,
    error,
    filters,
    updateFilter,
    tipoOptions,
    fornecedorOptions,
    lojaOptions,
    pracaOptions,
    mesOptions,
    anoOptions,
    totalCustos,
    totalPreventiva,
    totalCorretiva,
    percentualCustosVsRealizado,
    fornecedoresRank,
    lojasRank,
    uploadData,
  } = useCustosDashboard(token);

  if (loading) {
    return <main className="center-message">Carregando painel de custos...</main>;
  }

  if (error) {
    return <main className="center-message error">{error}</main>;
  }

  return (
    <main className="dashboard-shell">
      {/* Sidebar: navegação e informações do usuário */}
      <aside className="sidebar">
        <div>
          <h1 className="brand">Gentil Negócios</h1>
          <button className="menu-highlight">Painéis</button>
          <nav className="menu">
            <Link className="menu-item" href="/chamados">
              Início
            </Link>
            <Link className="menu-item" href="/chamados">
              Chamados Preventivas
            </Link>
            <Link className="menu-item" href="/chamados">
              Chamados Corretivas
            </Link>
            <span className="menu-item active">Custos</span>
          </nav>
          <div className="auth-user-box">
            <button className="auth-logout-btn" type="button" onClick={() => void logout()}>
              Sair
            </button>
          </div>
        </div>
        <small className="update-label">Data de atualização: {uploadData}</small>
      </aside>

      <section className="content">
        {/* Filtros: seleção para visualizar custos filtrados */}
        <header className="filters-grid card custos-filters-grid">
          <SelectField
            label="Tipo de manutenção"
            value={filters.tipoManutencao}
            onChange={(value) => updateFilter("tipoManutencao", value)}
            options={tipoOptions}
            mapLabel={(value) => (value === "corretiva" ? "Corretiva" : "Preventiva")}
          />
          <SelectField
            label="Fornecedor"
            value={filters.fornecedor}
            onChange={(value) => updateFilter("fornecedor", value)}
            options={fornecedorOptions}
          />
          <SelectField label="Loja" value={filters.loja} onChange={(value) => updateFilter("loja", value)} options={lojaOptions} />
          <SelectField label="Praça" value={filters.praca} onChange={(value) => updateFilter("praca", value)} options={pracaOptions} />
          <SelectField label="Mês" value={filters.mes} onChange={(value) => updateFilter("mes", value)} options={mesOptions} mapLabel={monthLabel} />
          <SelectField label="Ano" value={filters.ano} onChange={(value) => updateFilter("ano", value)} options={anoOptions} />
        </header>

        {/* KPIs principais de custos */}
        <section className="kpi-grid custos-main-kpis">
          <KpiCard title="Manutenção preventiva" value={formatCurrency(totalPreventiva)} />
          <KpiCard title="Manutenção corretiva" value={formatCurrency(totalCorretiva)} />
          <KpiCard title="Custo das manutenções" value={formatCurrency(totalCustos)} />
        </section>

        {/* KPIs secundários de comparação */}
        <section className="kpi-grid custos-secondary-kpis">
          <KpiCard title="% Custos x Orçado" value="N/D" subtitle="Sem base de orçamento no momento" />
          <KpiCard
            title="% Custos x Realizado"
            value={percentualCustosVsRealizado == null ? "N/D" : `${percentualCustosVsRealizado.toFixed(2)}%`}
            subtitle="Comparativo com valores de manutenção"
          />
          <KpiCard title="% Desvio" value="N/D" subtitle="Aguardando regra de orçamento" />
        </section>

        {/* Rankings e barras: fornecedores e custos por loja */}
        <section className="custos-data-grid">
          <article className="card rank-table custos-table">
            <h3>Fornecedor</h3>
            <table>
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {fornecedoresRank.slice(0, 20).map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{formatCurrency(row.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="card custos-bars-card">
            <h3>Custos por loja</h3>
            <div className="custos-bars-wrap">
              {lojasRank.slice(0, 20).map((row) => (
                <div className="custos-bar-row" key={row.label}>
                  <span className="custos-bar-label">{row.label}</span>
                  <div className="custos-bar-track">
                    <div
                      className="custos-bar-fill"
                      style={{ width: `${calcWidthPercent(row.valor, lojasRank[0]?.valor ?? 0)}%` }}
                    />
                  </div>
                  <span className="custos-bar-value">{formatCurrency(row.valor)}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

function monthLabel(value: string): string {
  const month = Number(value);
  if (!month || month < 1 || month > 12) return value;

  return new Date(2000, month - 1, 1).toLocaleString("pt-BR", { month: "long" });
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

function calcWidthPercent(value: number, max: number): number {
  if (!max || max <= 0) return 0;
  return Math.max(4, (value / max) * 100);
}
