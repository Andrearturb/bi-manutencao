"use client";

/**
 * Página principal dos chamados.
 *
 * Estrutura geral:
 * - Sidebar: navegação e informações do usuário
 * - Header de filtros: campos para restringir dados do dashboard
 * - KPIs: cartões com métricas principais
 * - Tabelas/Gráficos: rankings e visualizações por analista/mês
 * - Modais: camadas de detalhe/exportação abertas pelos KPIs
 *
 * Dados e handlers são providos por `useChamadosDashboard`.
 */

import Link from "next/link";

import {
  KpiCard,
  MiniKpi,
  SelectField,
} from "@/components/chamados/chamados-cards";
import { useAuth } from "@/components/auth/auth-provider";
import { AnalystDonutCard, MonthlyBarsCard } from "@/components/chamados/chamados-charts";
import { ChamadosModalsLayer } from "@/components/chamados/chamados-modals-layer";
import { CategoryTable, LojaTable } from "@/components/chamados/chamados-rank-tables";
import { useChamadosDashboard } from "@/lib/hooks/use-chamados-dashboard";
import { type EscopoPainel } from "@/lib/types";

export default function ChamadosPage() {
  const { token, logout } = useAuth();

  const {
    loading,
    error,
    escopoPainel,
    setEscopoPainel,
    filters,
    updateFilter,
    statusOptions,
    lojaOptions,
    pracaOptions,
    categoriaOptions,
    mesOptions,
    anoOptions,
    totalChamados,
    totalOS,
    custoMedio,
    slaMetrics,
    statusAbertoLabel,
    statusEmAberto,
    statusEmAtendimento,
    statusNaoAprovado,
    statusSolicitacaoFinalizada,
    statusFinalizadoLabel,
    statusConcluidos,
    lojasRank,
    categoriasRank,
    subcategoriasByCategoria,
    expandedCategory,
    setExpandedCategory,
    selectedAnalyst,
    setSelectedAnalyst,
    donutBackground,
    handleDonutClick,
    analystSlices,
    selectedPeriod,
    setSelectedPeriod,
    series,
    maxSeries,
    subcategoryModal,
    setSubcategoryModal,
    modalItems,
    lojaModal,
    setLojaModal,
    lojaModalItems,
    statusModal,
    setStatusModal,
    statusModalItems,
    totalModalOpen,
    setTotalModalOpen,
    totalOsModalOpen,
    setTotalOsModalOpen,
    totalOsModalItems,
    filtered,
    uploadData,
  } = useChamadosDashboard(token);

  if (loading) {
    return <main className="center-message">Carregando painel...</main>;
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
            <button type="button" className={`menu-item menu-button ${escopoPainel === "ambas" ? "active" : ""}`} onClick={() => setEscopoPainel("ambas")}>Início</button>
            <button type="button" className={`menu-item menu-button ${escopoPainel === "preventiva" ? "active" : ""}`} onClick={() => setEscopoPainel("preventiva")}>Chamados preventivos</button>
            <button type="button" className={`menu-item menu-button ${escopoPainel === "corretiva" ? "active" : ""}`} onClick={() => setEscopoPainel("corretiva")}>Chamados corretivos</button>
            <Link className="menu-item" href="/custos">
              Custos
            </Link>
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
        {/* Filtros: seleção de dados do dashboard */}
        <header className="filters-grid card">
          <label className="select-field">
            <span>Tipo de manutenção</span>
            <select
              value={escopoPainel}
              onChange={(event) => setEscopoPainel(event.target.value as EscopoPainel)}
            >
              <option value="corretiva">Corretiva</option>
              <option value="preventiva">Preventiva</option>
              <option value="ambas">Ambas</option>
            </select>
          </label>
          <SelectField label="Status do Chamado" value={filters.status} onChange={(value) => updateFilter("status", value)} options={statusOptions} />
          <SelectField label="Loja" value={filters.loja} onChange={(value) => updateFilter("loja", value)} options={lojaOptions} />
          <SelectField label="Praça" value={filters.praca} onChange={(value) => updateFilter("praca", value)} options={pracaOptions} />
          <SelectField label="Categoria" value={filters.categoria} onChange={(value) => updateFilter("categoria", value)} options={categoriaOptions} />
          <SelectField label="Mês" value={filters.mes} onChange={(value) => updateFilter("mes", value)} options={mesOptions} mapLabel={(val) => monthLabel(val)} />
          <SelectField label="Ano" value={filters.ano} onChange={(value) => updateFilter("ano", value)} options={anoOptions} />
        </header>

        {/* KPIs principais: visão resumida */}
        <section className="kpi-grid top-kpis">
          <KpiCard title="Total de Chamados" value={String(totalChamados)} onClick={() => setTotalModalOpen(true)} />
          <KpiCard title="Total de O.S" value={String(totalOS)} onClick={() => setTotalOsModalOpen(true)} />
          <KpiCard title="Custo Medio Servico" value={`R$ ${custoMedio.toLocaleString("pt-BR")}`} />
          <KpiCard
            title="SLA %"
            value={`${slaMetrics.percent}%`}
            subtitle={`No prazo ${slaMetrics.noPrazo} / ${slaMetrics.totalConsiderado} considerados`}
          />
        </section>

        {/* KPIs de status: acesso rápido por status */}
        <section className="kpi-grid status-kpis">
          <MiniKpi
            title={statusAbertoLabel}
            value={statusEmAberto}
            onClick={() => setStatusModal({ key: "em-aberto", titulo: statusAbertoLabel })}
          />
          <MiniKpi title="Em atendimento" value={statusEmAtendimento} onClick={() => setStatusModal({ key: "em-atendimento", titulo: "Em atendimento" })} />
          <MiniKpi title="Não aprovado" value={statusNaoAprovado} onClick={() => setStatusModal({ key: "nao-aprovado", titulo: "Não aprovado" })} />
          <MiniKpi
            title={statusFinalizadoLabel}
            value={statusSolicitacaoFinalizada}
            onClick={() => setStatusModal({ key: "solicitacao-finalizada", titulo: statusFinalizadoLabel })}
          />
          <MiniKpi title="Concluídos" value={statusConcluidos} emphasis onClick={() => setStatusModal({ key: "concluidos", titulo: "Concluídos" })} />
        </section>

        {/* Rankings e visualizações: tabelas e cartões analíticos */}
        <section className="data-grid">
          <LojaTable rows={lojasRank} onOpenLoja={(loja) => setLojaModal(loja)} />
          <CategoryTable
            rows={categoriasRank}
            subRowsByCategory={subcategoriasByCategoria}
            expandedCategory={expandedCategory}
            onToggleCategory={(category) => setExpandedCategory((prev) => (prev === category ? null : category))}
            onOpenSubcategory={(categoria, subcategoria) => setSubcategoryModal({ categoria, subcategoria })}
          />

          <AnalystDonutCard
            selectedAnalyst={selectedAnalyst}
            setSelectedAnalyst={setSelectedAnalyst}
            donutBackground={donutBackground}
            handleDonutClick={handleDonutClick}
            analystSlices={analystSlices}
          />
        </section>

        {/* Série mensal de barras */}
        <MonthlyBarsCard
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          series={series}
          maxSeries={maxSeries}
        />

        {/* Camada de modais de detalhe e listagens */}
        <ChamadosModalsLayer
          subcategoryModal={subcategoryModal}
          setSubcategoryModal={setSubcategoryModal}
          modalItems={modalItems}
          lojaModal={lojaModal}
          setLojaModal={setLojaModal}
          lojaModalItems={lojaModalItems}
          statusModal={statusModal}
          setStatusModal={setStatusModal}
          statusModalItems={statusModalItems}
          totalModalOpen={totalModalOpen}
          setTotalModalOpen={setTotalModalOpen}
          filtered={filtered}
          totalOsModalOpen={totalOsModalOpen}
          setTotalOsModalOpen={setTotalOsModalOpen}
          totalOsModalItems={totalOsModalItems}
        />
      </section>
    </main>
  );
}

function monthLabel(value: string): string {
  const month = Number(value);
  if (!month || month < 1 || month > 12) return value;

  const date = new Date(2000, month - 1, 1);
  return date.toLocaleString("pt-BR", { month: "long" });
}
