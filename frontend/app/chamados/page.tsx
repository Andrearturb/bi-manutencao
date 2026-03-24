"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchDashboardCorretivas } from "@/lib/api";
import {
  calcCustoMedio,
  calcSlaPercent,
  countBy,
  countConcluidos,
  countStatus,
  filterDados,
  monthlySeries,
  parseDate,
  uniqueOptions,
} from "@/lib/dashboard-utils";
import { DashboardPayload, FilterState } from "@/lib/types";

const DEFAULT_FILTERS: FilterState = {
  status: "todos",
  loja: "todos",
  praca: "todos",
  categoria: "todos",
  mes: "todos",
  ano: "todos",
};

export default function ChamadosPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchDashboardCorretivas();
        setDashboard(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar o dashboard.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const dados = dashboard?.dados ?? [];

  const statusOptions = useMemo(() => uniqueOptions(dados, (item) => item.status), [dados]);
  const lojaOptions = useMemo(() => uniqueOptions(dados, (item) => item.loja), [dados]);
  const pracaOptions = useMemo(() => uniqueOptions(dados, (item) => item.praca), [dados]);
  const categoriaOptions = useMemo(() => uniqueOptions(dados, (item) => item.categoria), [dados]);

  const mesOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of dados) {
      const date = parseDate(item.dataRequisicao ?? item.dataConclusao);
      if (!date) continue;
      values.add(String(date.getMonth() + 1).padStart(2, "0"));
    }
    return [...values].sort();
  }, [dados]);

  const anoOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of dados) {
      const date = parseDate(item.dataRequisicao ?? item.dataConclusao);
      if (!date) continue;
      values.add(String(date.getFullYear()));
    }
    return [...values].sort((a, b) => Number(b) - Number(a));
  }, [dados]);

  const filtered = useMemo(() => filterDados(dados, filters), [dados, filters]);

  const totalChamados = filtered.length;
  const totalOS = new Set(filtered.map((item) => item.ticket).filter(Boolean)).size;
  const custoMedio = calcCustoMedio(filtered);
  const slaPercent = calcSlaPercent(filtered);

  const statusEmAberto = countStatus(filtered, "Em aberto");
  const statusEmAtendimento = countStatus(filtered, "Em atendimento");
  const statusNaoAprovado = countStatus(filtered, "Nao Aprovado");
  const statusSolicitacaoFinalizada = countStatus(filtered, "Solicitacao Finalizada");
  const statusConcluidos = countConcluidos(filtered);

  const lojasRank = countBy(filtered, (item) => item.loja ?? "Sem loja").slice(0, 8);
  const categoriasRank = countBy(filtered, (item) => item.categoria ?? "Sem categoria").slice(0, 8);
  const analistasRank = countBy(filtered, (item) => item.analistaResponsavel ?? "Sem analista").slice(0, 5);
  const topAnalista = analistasRank[0];

  const series = monthlySeries(filtered);
  const maxSeries = Math.max(1, ...series.map((item) => item.total));

  const uploadData = dashboard?.upload?.uploadData
    ? new Date(dashboard.upload.uploadData).toLocaleString("pt-BR")
    : "Sem data";

  function updateFilter<Key extends keyof FilterState>(key: Key, value: FilterState[Key]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

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
          <KpiCard title="Total de Chamados" value={String(totalChamados)} />
          <KpiCard title="Total de O.S" value={String(totalOS)} />
          <KpiCard title="Custo Medio Servico" value={`R$ ${custoMedio.toLocaleString("pt-BR")}`} />
          <KpiCard title="SLA %" value={`${slaPercent}%`} />
        </section>

        <section className="kpi-grid status-kpis">
          <MiniKpi title="Em aberto" value={statusEmAberto} />
          <MiniKpi title="Em atendimento" value={statusEmAtendimento} />
          <MiniKpi title="Nao Aprovado" value={statusNaoAprovado} />
          <MiniKpi title="Solicitacao Finalizada" value={statusSolicitacaoFinalizada} />
          <MiniKpi title="Concluidos" value={statusConcluidos} emphasis />
        </section>

        <section className="data-grid">
          <RankTable title="Loja" rows={lojasRank} />
          <RankTable title="Categoria" rows={categoriasRank} />

          <article className="card donut-card">
            <h3>Chamados por Analistas</h3>
            <div className="donut-wrap">
              <div
                className="donut"
                style={{ ["--pct" as string]: `${Math.round((topAnalista?.pct ?? 0) * 100) / 100}` }}
              >
                <span>{topAnalista?.qtd ?? 0}</span>
              </div>
            </div>
            <ul className="analyst-list">
              {analistasRank.map((analista) => (
                <li key={analista.label}>
                  <span>{analista.label}</span>
                  <strong>{analista.qtd}</strong>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <article className="card bars-card">
          <h3>Chamados Concluidos x Chamados Totais</h3>
          <div className="bars-grid">
            {series.map((item) => (
              <div key={item.mes} className="bar-column">
                <div className="bar-stack">
                  <div className="bar total" style={{ height: `${(item.total / maxSeries) * 180}px` }}>
                    <small>{item.total}</small>
                  </div>
                  <div className="bar concluded" style={{ height: `${(item.concluidos / maxSeries) * 180}px` }}>
                    <small>{item.concluidos}</small>
                  </div>
                </div>
                <span>{item.mes}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  mapLabel?: (value: string) => string;
};

function SelectField({ label, value, options, onChange, mapLabel }: SelectFieldProps) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="todos">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {mapLabel ? mapLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

type KpiCardProps = {
  title: string;
  value: string;
};

function KpiCard({ title, value }: KpiCardProps) {
  return (
    <article className="card kpi-card">
      <h2>{title}</h2>
      <p>{value}</p>
    </article>
  );
}

type MiniKpiProps = {
  title: string;
  value: number;
  emphasis?: boolean;
};

function MiniKpi({ title, value, emphasis }: MiniKpiProps) {
  return (
    <article className={`card mini-kpi ${emphasis ? "emphasis" : ""}`}>
      <h4>{title}</h4>
      <p>{value}</p>
    </article>
  );
}

type RankRow = {
  label: string;
  qtd: number;
  pct: number;
};

function RankTable({ title, rows }: { title: string; rows: RankRow[] }) {
  return (
    <article className="card rank-table">
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>{title}</th>
            <th>QTD</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.qtd}</td>
              <td>{row.pct.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

function monthLabel(value: string): string {
  const month = Number(value);
  if (!month || month < 1 || month > 12) return value;

  const date = new Date(2000, month - 1, 1);
  return date.toLocaleString("pt-BR", { month: "long" });
}
