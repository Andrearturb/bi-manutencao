"use client";

import {
  KpiCard,
  MiniKpi,
  SelectField,
} from "@/components/chamados/chamados-cards";
import { AnalystDonutCard, MonthlyBarsCard } from "@/components/chamados/chamados-charts";
import { ChamadosModalsLayer } from "@/components/chamados/chamados-modals-layer";
import { CategoryTable, LojaTable } from "@/components/chamados/chamados-rank-tables";
import { useChamadosDashboard } from "@/lib/hooks/use-chamados-dashboard";

export default function ChamadosPage() {
  const {
    loading,
    error,
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
    statusEmAberto,
    statusEmAtendimento,
    statusNaoAprovado,
    statusSolicitacaoFinalizada,
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
  } = useChamadosDashboard();

  if (loading) {
    return <main className="center-message">Carregando painel...</main>;
  }

  if (error) {
    return <main className="center-message error">{error}</main>;
  }

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div>
          <h1 className="brand">Gentil Negocios</h1>
          <button className="menu-highlight">Paineis</button>
          <nav className="menu">
            <a className="menu-item" href="#">Inicio</a>
            <a className="menu-item" href="#">Chamados Preventivas</a>
            <a className="menu-item active" href="#">Chamados Corretivas</a>
            <a className="menu-item" href="#">Custos</a>
            <a className="menu-item" href="#">Monitoramento</a>
          </nav>
        </div>
        <small className="update-label">Data de atualizacao: {uploadData}</small>
      </aside>

      <section className="content">
        <header className="filters-grid card">
          <SelectField label="Status do Chamado" value={filters.status} onChange={(value) => updateFilter("status", value)} options={statusOptions} />
          <SelectField label="Loja" value={filters.loja} onChange={(value) => updateFilter("loja", value)} options={lojaOptions} />
          <SelectField label="Praca" value={filters.praca} onChange={(value) => updateFilter("praca", value)} options={pracaOptions} />
          <SelectField label="Categoria" value={filters.categoria} onChange={(value) => updateFilter("categoria", value)} options={categoriaOptions} />
          <SelectField label="Mes" value={filters.mes} onChange={(value) => updateFilter("mes", value)} options={mesOptions} mapLabel={(val) => monthLabel(val)} />
          <SelectField label="Ano" value={filters.ano} onChange={(value) => updateFilter("ano", value)} options={anoOptions} />
        </header>

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

        <section className="kpi-grid status-kpis">
          <MiniKpi title="Em aberto" value={statusEmAberto} onClick={() => setStatusModal({ key: "em-aberto", titulo: "Em aberto" })} />
          <MiniKpi title="Em atendimento" value={statusEmAtendimento} onClick={() => setStatusModal({ key: "em-atendimento", titulo: "Em atendimento" })} />
          <MiniKpi title="Nao Aprovado" value={statusNaoAprovado} onClick={() => setStatusModal({ key: "nao-aprovado", titulo: "Nao Aprovado" })} />
          <MiniKpi title="Solicitacao Finalizada" value={statusSolicitacaoFinalizada} onClick={() => setStatusModal({ key: "solicitacao-finalizada", titulo: "Solicitacao Finalizada" })} />
          <MiniKpi title="Concluidos" value={statusConcluidos} emphasis onClick={() => setStatusModal({ key: "concluidos", titulo: "Concluidos" })} />
        </section>

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

        <MonthlyBarsCard
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          series={series}
          maxSeries={maxSeries}
        />

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
