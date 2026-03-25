"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { fetchDashboardCorretivas } from "@/lib/api";
import {
  calcCustoMedio,
  calcSlaMetrics,
  countBy,
  countConcluidos,
  countTotalOs,
  countStatus,
  filterDados,
  monthlySeries,
  parseDate,
  uniqueOptions,
} from "@/lib/dashboard-utils";
import { DashboardItem, DashboardPayload, FilterState } from "@/lib/types";

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
  const [totalModalOpen, setTotalModalOpen] = useState(false);
  const [totalOsModalOpen, setTotalOsModalOpen] = useState(false);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [lojaModal, setLojaModal] = useState<string | null>(null);
  const [subcategoryModal, setSubcategoryModal] = useState<{ categoria: string; subcategoria: string } | null>(null);
  const [statusModal, setStatusModal] = useState<{
    key: "em-aberto" | "em-atendimento" | "nao-aprovado" | "solicitacao-finalizada" | "concluidos";
    titulo: string;
  } | null>(null);
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
      const date = parseDate(item.dataRequisicao);
      if (!date) continue;
      values.add(String(date.getMonth() + 1).padStart(2, "0"));
    }
    return [...values].sort();
  }, [dados]);

  const anoOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of dados) {
      const date = parseDate(item.dataRequisicao);
      if (!date) continue;
      values.add(String(date.getFullYear()));
    }
    return [...values].sort((a, b) => Number(b) - Number(a));
  }, [dados]);

  const baseFiltered = useMemo(() => filterDados(dados, filters), [dados, filters]);

  const analistasRank = useMemo(
    () => countBy(baseFiltered, (item) => item.analistaResponsavel ?? "Sem analista").slice(0, 5),
    [baseFiltered],
  );

  const analystFiltered = useMemo(() => {
    if (!selectedAnalyst) return baseFiltered;

    const norm = (value: string | null | undefined) =>
      (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const target = norm(selectedAnalyst);
    return baseFiltered.filter((item) => norm(item.analistaResponsavel ?? "Sem analista") === target);
  }, [baseFiltered, selectedAnalyst]);

  const series = monthlySeries(analystFiltered);

  const filtered = useMemo(() => {
    if (!selectedPeriod) return analystFiltered;

    return analystFiltered.filter((item) => {
      const date = parseDate(item.dataRequisicao);
      if (!date) return false;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return key === selectedPeriod;
    });
  }, [analystFiltered, selectedPeriod]);

  const totalOsModalItems = useMemo(
    () => filtered.filter((item) => item.os?.status === "pendente" || item.os?.status === "concluido"),
    [filtered],
  );

  const totalChamados = filtered.length;
  const totalOS = countTotalOs(filtered);
  const custoMedio = calcCustoMedio(filtered);
  const slaMetrics = calcSlaMetrics(filtered);

  const statusEmAberto = countStatus(filtered, "Em aberto");
  const statusEmAtendimento = countStatus(filtered, "Em atendimento");
  const statusNaoAprovado = countStatus(filtered, "Nao Aprovado");
  const statusSolicitacaoFinalizada = countStatus(filtered, "Solicitacao Finalizada");
  const statusConcluidos = countConcluidos(filtered);

  const lojasRank = countBy(filtered, (item) => item.loja ?? "Sem loja").slice(0, 8);
  const categoriasRank = countBy(filtered, (item) => item.categoria ?? "Sem categoria").slice(0, 8);
  const subcategoriasByCategoria = useMemo(() => {
    const categories = new Map<string, Map<string, number>>();

    for (const item of filtered) {
      const categoria = (item.categoria ?? "Sem categoria").trim() || "Sem categoria";
      const subcategoria = (item.subcategoria ?? "Sem subcategoria").trim() || "Sem subcategoria";

      if (!categories.has(categoria)) {
        categories.set(categoria, new Map<string, number>());
      }

      const subMap = categories.get(categoria)!;
      subMap.set(subcategoria, (subMap.get(subcategoria) ?? 0) + 1);
    }

    const result = new Map<string, Array<{ label: string; qtd: number }>>();
    for (const [categoria, subMap] of categories.entries()) {
      const list = [...subMap.entries()]
        .map(([label, qtd]) => ({ label, qtd }))
        .sort((a, b) => b.qtd - a.qtd);
      result.set(categoria, list);
    }

    return result;
  }, [filtered]);

  const analystPalette = ["#2b8be8", "#2034a8", "#6a1f8f", "#d86a31", "#0f766e"];
  const analystSlices = useMemo(() => {
    const base = analistasRank.filter((item) => item.qtd > 0);
    const total = base.reduce((acc, item) => acc + item.qtd, 0);
    if (total === 0) return [];

    let accPct = 0;
    return base.map((item, index) => {
      const pct = (item.qtd / total) * 100;
      const start = accPct;
      const end = start + pct;
      accPct = end;

      return {
        ...item,
        start,
        end,
        mid: (start + end) / 2,
        color: analystPalette[index % analystPalette.length],
      };
    });
  }, [analistasRank]);

  const donutBackground =
    analystSlices.length > 0
      ? `conic-gradient(${analystSlices.map((item) => `${item.color} ${item.start}% ${item.end}%`).join(", ")})`
      : "#d7e0ea";

  function handleDonutClick(event: React.MouseEvent<HTMLDivElement>) {
    if (analystSlices.length === 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;

    const outerRadius = rect.width / 2;
    const innerRadius = outerRadius * 0.33;
    const distance = Math.hypot(dx, dy);

    // So considera clique na area do anel.
    if (distance < innerRadius || distance > outerRadius) return;

    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const fromTopClockwise = (angleDeg + 90 + 360) % 360;
    const pct = (fromTopClockwise / 360) * 100;

    const hit = analystSlices.find((slice) => pct >= slice.start && pct < slice.end) ?? analystSlices[analystSlices.length - 1];

    setSelectedAnalyst((prev) => (prev === hit.label ? null : hit.label));
  }

  useEffect(() => {
    if (!selectedAnalyst) return;
    const exists = analistasRank.some((item) => item.label === selectedAnalyst);
    if (!exists) {
      setSelectedAnalyst(null);
    }
  }, [analistasRank, selectedAnalyst]);

  const maxSeries = Math.max(1, ...series.map((item) => item.total));

  const modalItems = useMemo(() => {
    if (!subcategoryModal) return [];

    const categoriaTarget = subcategoryModal.categoria.trim().toLowerCase();
    const subTarget = subcategoryModal.subcategoria.trim().toLowerCase();

    return filtered.filter((item) => {
      const categoria = (item.categoria ?? "Sem categoria").trim().toLowerCase();
      const subcategoria = (item.subcategoria ?? "Sem subcategoria").trim().toLowerCase();
      return categoria === categoriaTarget && subcategoria === subTarget;
    });
  }, [filtered, subcategoryModal]);

  const lojaModalItems = useMemo(() => {
    if (!lojaModal) return [];
    const lojaTarget = lojaModal.trim().toLowerCase();
    return filtered.filter((item) => (item.loja ?? "Sem loja").trim().toLowerCase() === lojaTarget);
  }, [filtered, lojaModal]);

  const statusModalItems = useMemo(() => {
    if (!statusModal) return [];

    const normalize = (value: string | null | undefined) =>
      (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const isConcluido = (value: string | null | undefined) => {
      const status = normalize(value);
      return status === "chamado concluido" || status === "concluido" || status === "solicitacao finalizada";
    };

    return filtered.filter((item) => {
      const status = normalize(item.status);

      if (statusModal.key === "em-aberto") return status === "em aberto";
      if (statusModal.key === "em-atendimento") return status === "em atendimento";
      if (statusModal.key === "nao-aprovado") return status === "nao aprovado";
      if (statusModal.key === "solicitacao-finalizada") return status === "solicitacao finalizada";
      return isConcluido(item.status);
    });
  }, [filtered, statusModal]);

  useEffect(() => {
    if (!selectedPeriod) return;
    const exists = series.some((item) => item.key === selectedPeriod);
    if (!exists) {
      setSelectedPeriod(null);
    }
  }, [series, selectedPeriod]);

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

          <article className="card donut-card">
            <h3>Chamados por Analistas</h3>
            {selectedAnalyst ? (
              <button type="button" className="analyst-filter-pill" onClick={() => setSelectedAnalyst(null)}>
                Analista: {selectedAnalyst} (limpar)
              </button>
            ) : null}
            <div className="donut-wrap">
              <div className="donut multi" style={{ background: donutBackground }} onClick={handleDonutClick}>
                {analystSlices.map((item) => {
                  const angle = ((item.mid / 100) * 360 - 90) * (Math.PI / 180);
                  const radius = item.pct < 8 ? 46 : 42;
                  const x = 50 + Math.cos(angle) * radius;
                  const y = 50 + Math.sin(angle) * radius;
                  const isActive = selectedAnalyst === item.label;
                  const isMuted = Boolean(selectedAnalyst && !isActive);

                  return (
                    <div key={`slice-${item.label}`}>
                      {item.pct >= 8 ? (
                        <button
                          type="button"
                          className={`slice-label ${isMuted ? "muted" : ""}`}
                          style={{ left: `${x}%`, top: `${y}%` }}
                          onClick={() => setSelectedAnalyst((prev) => (prev === item.label ? null : item.label))}
                          aria-label={`Filtrar por ${item.label}`}
                        >
                          {item.qtd}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
                <span className="donut-center" />
              </div>
            </div>
            <ul className="analyst-legend">
              {analystSlices.map((analista) => {
                const isActive = selectedAnalyst === analista.label;
                const isMuted = Boolean(selectedAnalyst && !isActive);
                return (
                  <li
                    key={analista.label}
                    className={`${isActive ? "active" : ""} ${isMuted ? "muted" : ""}`}
                  >
                    <button
                      type="button"
                      className="legend-item-btn"
                      onClick={() => setSelectedAnalyst((prev) => (prev === analista.label ? null : analista.label))}
                    >
                      <span className="legend-dot" style={{ background: analista.color }} />
                      <span className="legend-name" title={analista.label}>{analista.label}</span>
                      <strong>{analista.qtd}</strong>
                    </button>
                  </li>
                );
              })}
            </ul>
          </article>
        </section>

        <article className="card bars-card">
          <h3>Chamados Concluidos x Chamados Totais</h3>
          {selectedPeriod ? (
            <button type="button" className="period-filter-pill" onClick={() => setSelectedPeriod(null)}>
              Periodo: {selectedPeriod} (limpar)
            </button>
          ) : null}
          <div className="bars-grid">
            {series.map((item) => {
              const isActive = selectedPeriod === item.key;
              const isMuted = Boolean(selectedPeriod && !isActive);
              return (
              <button
                type="button"
                key={item.key}
                className={`bar-column interactive ${isActive ? "active" : ""} ${isMuted ? "muted" : ""}`}
                onClick={() => setSelectedPeriod((prev) => (prev === item.key ? null : item.key))}
                aria-label={`Filtrar por periodo ${item.key}`}
              >
                <div className="bar-stack">
                  <div className="bar total" style={{ height: `${(item.total / maxSeries) * 180}px` }}>
                    <small>{item.total}</small>
                  </div>
                  <div className="bar concluded" style={{ height: `${(item.concluidos / maxSeries) * 180}px` }}>
                    <small>{item.concluidos}</small>
                  </div>
                </div>
                <span>{item.mes}/{item.yearValue.slice(2)}</span>
              </button>
            );})}
          </div>
        </article>

        {subcategoryModal ? (
          <ChamadosDetalhesModal
            titulo={`Categoria: ${subcategoryModal.categoria}`}
            subtitulo={`${subcategoryModal.subcategoria} • ${modalItems.length} chamados`}
            items={modalItems}
            onClose={() => setSubcategoryModal(null)}
          />
        ) : null}

        {lojaModal ? (
          <ChamadosDetalhesModal
            titulo={`Loja: ${lojaModal}`}
            subtitulo={`${lojaModalItems.length} chamados`}
            items={lojaModalItems}
            onClose={() => setLojaModal(null)}
          />
        ) : null}

        {statusModal ? (
          <ChamadosDetalhesModal
            titulo={`Status: ${statusModal.titulo}`}
            subtitulo={`${statusModalItems.length} chamados`}
            items={statusModalItems}
            tone={statusToneFromKey(statusModal.key)}
            showMotivoNaoAprovacao={statusModal.key === "nao-aprovado"}
            onClose={() => setStatusModal(null)}
          />
        ) : null}

        {totalModalOpen ? (
          <ChamadosDetalhesModal
            titulo="Total de Chamados"
            subtitulo={`${filtered.length} chamados`}
            items={filtered}
            onClose={() => setTotalModalOpen(false)}
          />
        ) : null}

        {totalOsModalOpen ? (
          <ChamadosDetalhesModal
            titulo="Total de O.S"
            subtitulo={`${totalOsModalItems.length} O.S`}
            items={totalOsModalItems}
            onClose={() => setTotalOsModalOpen(false)}
          />
        ) : null}
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
  subtitle?: string;
  onClick?: () => void;
};

function KpiCard({ title, value, subtitle, onClick }: KpiCardProps) {
  return (
    <article
      className={`card kpi-card ${onClick ? "clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <h2>{title}</h2>
      <p>{value}</p>
      {subtitle ? <small className="kpi-subtitle">{subtitle}</small> : null}
    </article>
  );
}

type MiniKpiProps = {
  title: string;
  value: number;
  emphasis?: boolean;
  onClick?: () => void;
};

function MiniKpi({ title, value, emphasis, onClick }: MiniKpiProps) {
  return (
    <article
      className={`card mini-kpi ${emphasis ? "emphasis" : ""} ${onClick ? "clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
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

type ModalTone = "default" | "aberto" | "atendimento" | "nao-aprovado" | "finalizada" | "concluido";

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

function LojaTable({ rows, onOpenLoja }: { rows: RankRow[]; onOpenLoja: (loja: string) => void }) {
  return (
    <article className="card rank-table loja-table">
      <h3>Loja</h3>
      <table>
        <thead>
          <tr>
            <th>Loja</th>
            <th>QTD</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="loja-row">
              <td>
                <button type="button" className="loja-link" onClick={() => onOpenLoja(row.label)}>
                  {row.label}
                </button>
              </td>
              <td>{row.qtd}</td>
              <td>{row.pct.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

type CategoryTableProps = {
  rows: RankRow[];
  subRowsByCategory: Map<string, Array<{ label: string; qtd: number }>>;
  expandedCategory: string | null;
  onToggleCategory: (category: string) => void;
  onOpenSubcategory: (categoria: string, subcategoria: string) => void;
};

function CategoryTable({ rows, subRowsByCategory, expandedCategory, onToggleCategory, onOpenSubcategory }: CategoryTableProps) {
  return (
    <article className="card rank-table category-table">
      <h3>Categoria</h3>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>QTD</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isExpanded = expandedCategory === row.label;
            const subRows = subRowsByCategory.get(row.label) ?? [];

            return (
              <Fragment key={row.label}>
                <tr className={`category-row ${isExpanded ? "expanded" : ""}`}>
                  <td>
                    <button type="button" className="category-toggle" onClick={() => onToggleCategory(row.label)}>
                      <span className="chevron">{isExpanded ? "▾" : "▸"}</span>
                      <span>{row.label}</span>
                    </button>
                  </td>
                  <td>{row.qtd}</td>
                  <td>{row.pct.toFixed(2)}%</td>
                </tr>

                {isExpanded
                  ? subRows.map((sub) => (
                      <tr key={`${row.label}-${sub.label}`} className="subcategory-row">
                        <td>
                          <button
                            type="button"
                            className="subcategory-link"
                            onClick={() => onOpenSubcategory(row.label, sub.label)}
                          >
                            {sub.label}
                          </button>
                        </td>
                        <td>{sub.qtd}</td>
                        <td />
                      </tr>
                    ))
                  : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}

function formatValorAprovado(value: DashboardItem["valorAprovado"]): string {
  if (typeof value === "number") {
    return Number.isFinite(value) ? `R$ ${value.toLocaleString("pt-BR")}` : "-";
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(parsed) ? `R$ ${parsed.toLocaleString("pt-BR")}` : "-";
  }
  return "-";
}

function ChamadosDetalhesModal({
  titulo,
  subtitulo,
  items,
  onClose,
  tone = "default",
  showMotivoNaoAprovacao = false,
}: {
  titulo: string;
  subtitulo: string;
  items: DashboardItem[];
  onClose: () => void;
  tone?: ModalTone;
  showMotivoNaoAprovacao?: boolean;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <article className="modal-card" onClick={(event) => event.stopPropagation()}>
        <header className={`modal-header tone-${tone}`}>
          <div>
            <h3>{titulo}</h3>
            <p>{subtitulo}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>Fechar</button>
        </header>

        <div className="modal-table-wrap">
          <table className="modal-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Status</th>
                {showMotivoNaoAprovacao ? <th>Motivo Nao Aprovacao</th> : null}
                <th>SLA</th>
                <th>Loja</th>
                <th>Praca</th>
                <th>Categoria</th>
                <th>Subcategoria</th>
                <th>Analista</th>
                <th>Requisitante</th>
                <th>Fornecedor</th>
                <th>Descricao</th>
                <th>Solucao</th>
                <th>Data Req.</th>
                <th>Data Concl.</th>
                <th>Valor</th>
                <th>OS Status</th>
                <th>OS URL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.ticket ?? "sem-ticket"}-${index}`}>
                  <td>{item.ticket ?? "-"}</td>
                  <td>{item.status ?? "-"}</td>
                  {showMotivoNaoAprovacao ? <td>{item.motivoNaoAprovacao ?? "-"}</td> : null}
                  <td>{item.slaStatus ?? "-"}</td>
                  <td>{item.loja ?? "-"}</td>
                  <td>{item.praca ?? "-"}</td>
                  <td>{item.categoria ?? "-"}</td>
                  <td>{item.subcategoria ?? "-"}</td>
                  <td>{item.analistaResponsavel ?? "-"}</td>
                  <td>{item.requisitante ?? "-"}</td>
                  <td>{item.fornecedor ?? "-"}</td>
                  <td>{item.descricaoServico ?? "-"}</td>
                  <td>{item.solucao ?? "-"}</td>
                  <td>{item.dataRequisicao ? new Date(item.dataRequisicao).toLocaleDateString("pt-BR") : "-"}</td>
                  <td>{item.dataConclusao ? new Date(item.dataConclusao).toLocaleDateString("pt-BR") : "-"}</td>
                  <td>{formatValorAprovado(item.valorAprovado)}</td>
                  <td>{item.os?.status ?? "-"}</td>
                  <td>
                    {item.os?.url ? (
                      <a href={item.os.url} target="_blank" rel="noreferrer" className="os-link">PDF</a>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

function statusToneFromKey(key: "em-aberto" | "em-atendimento" | "nao-aprovado" | "solicitacao-finalizada" | "concluidos"): ModalTone {
  if (key === "em-aberto") return "aberto";
  if (key === "em-atendimento") return "atendimento";
  if (key === "nao-aprovado") return "nao-aprovado";
  if (key === "solicitacao-finalizada") return "finalizada";
  return "concluido";
}

function monthLabel(value: string): string {
  const month = Number(value);
  if (!month || month < 1 || month > 12) return value;

  const date = new Date(2000, month - 1, 1);
  return date.toLocaleString("pt-BR", { month: "long" });
}
