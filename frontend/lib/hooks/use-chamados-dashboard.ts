import { type MouseEvent, useEffect, useMemo, useState } from "react";

import { type StatusModalKey } from "@/components/chamados/chamados-detalhes-modal";
import { fetchDashboardManutencao } from "@/lib/api";
import {
  calcCustoMedio,
  calcSlaMetrics,
  countBy,
  countConcluidos,
  countStatus,
  countTotalOs,
  filterDados,
  monthlySeries,
  parseDate,
  uniqueOptions,
} from "@/lib/dashboard-utils";
import { type DashboardManutencaoPayload, type DashboardPayload, type EscopoPainel, type FilterState } from "@/lib/types";

const DEFAULT_FILTERS: FilterState = {
  status: "todos",
  loja: "todos",
  praca: "todos",
  categoria: "todos",
  mes: "todos",
  ano: "todos",
};

export type RankRow = {
  label: string;
  qtd: number;
  pct: number;
};

export type AnalystSlice = RankRow & {
  start: number;
  end: number;
  mid: number;
  color: string;
};

export type SubcategoryModalState = { categoria: string; subcategoria: string } | null;
export type StatusModalState = { key: StatusModalKey; titulo: string } | null;

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function useChamadosDashboard(token: string | null) {
  // UI state (filters, interactions and modal visibility)
  const [dashboardManutencao, setDashboardManutencao] = useState<DashboardManutencaoPayload | null>(null);
  const [escopoPainel, setEscopoPainel] = useState<EscopoPainel>("corretiva");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [totalModalOpen, setTotalModalOpen] = useState(false);
  const [totalOsModalOpen, setTotalOsModalOpen] = useState(false);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [lojaModal, setLojaModal] = useState<string | null>(null);
  const [subcategoryModal, setSubcategoryModal] = useState<SubcategoryModalState>(null);
  const [statusModal, setStatusModal] = useState<StatusModalState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        if (!token) {
          setError("Sessao nao encontrada.");
          setDashboardManutencao(null);
          return;
        }

        const data = await fetchDashboardManutencao(token);
        setDashboardManutencao(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar o dashboard.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token]);

  const dashboard = useMemo<DashboardPayload>(() => {
    const emptyPayload: DashboardPayload = {
      dados: [],
      sla: {},
      upload: {},
    };

    if (!dashboardManutencao) return emptyPayload;

    if (escopoPainel === "corretiva") {
      return {
        dados: dashboardManutencao.dadosCorretivas ?? [],
        sla: {},
        upload: dashboardManutencao.uploadCorretivas ?? {},
      };
    }

    if (escopoPainel === "preventiva") {
      return {
        dados: dashboardManutencao.dadosPreventivas ?? [],
        sla: {},
        upload: dashboardManutencao.uploadPreventivas ?? {},
      };
    }

    const dadosCorretivo = dashboardManutencao.dadosCorretivas ?? [];
    const dadosPreventivo = dashboardManutencao.dadosPreventivas ?? [];
    const uploadCorretivo = dashboardManutencao.uploadCorretivas ?? {};
    const uploadPreventivo = dashboardManutencao.uploadPreventivas ?? {};

    return {
      dados: [...dadosCorretivo, ...dadosPreventivo],
      sla: {},
      upload: {
        uploadData: uploadCorretivo.uploadData ?? uploadPreventivo.uploadData,
        nomeArquivo:
          uploadCorretivo.nomeArquivo && uploadPreventivo.nomeArquivo
            ? `${uploadCorretivo.nomeArquivo} | ${uploadPreventivo.nomeArquivo}`
            : (uploadCorretivo.nomeArquivo ?? uploadPreventivo.nomeArquivo),
        totalRegistros: (uploadCorretivo.totalRegistros ?? 0) + (uploadPreventivo.totalRegistros ?? 0),
      },
    };
  }, [dashboardManutencao, escopoPainel]);

  // Filter options and data slices
  const dados = dashboard?.dados ?? [];

  const statusOptions = useMemo(() => {
    const options = uniqueOptions(dados, (item) => item.status);

    const prioridadePorEscopo: Record<EscopoPainel, string[]> = {
      corretiva: [
        "Em aberto",
        "Em atendimento",
        "Nao Aprovado",
        "Solicitacao Finalizada",
      ],
      preventiva: [
        "Backlog",
        "Em atendimento",
        "Nao Aprovado",
        "Servico Finalizado",
      ],
      ambas: [
        "Em aberto",
        "Backlog",
        "Em atendimento",
        "Nao Aprovado",
        "Solicitacao Finalizada",
        "Servico Finalizado",
      ],
    };

    const prioridade = prioridadePorEscopo[escopoPainel].map(normalize);

    return [...options].sort((a, b) => {
      const aNorm = normalize(a);
      const bNorm = normalize(b);

      const idxA = prioridade.indexOf(aNorm);
      const idxB = prioridade.indexOf(bNorm);

      const temA = idxA !== -1;
      const temB = idxB !== -1;
      if (temA && temB) return idxA - idxB;
      if (temA) return -1;
      if (temB) return 1;

      return a.localeCompare(b, "pt-BR");
    });
  }, [dados, escopoPainel]);
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

    const target = normalize(selectedAnalyst);
    return baseFiltered.filter((item) => normalize(item.analistaResponsavel ?? "Sem analista") === target);
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

  // KPI values shown on cards
  const totalChamados = filtered.length;
  const totalOS = countTotalOs(filtered);
  const custoMedio = calcCustoMedio(filtered);
  const slaMetrics = calcSlaMetrics(filtered);

  const statusEmAberto = filtered.filter((item) => {
    const status = normalize(item.status);
    return status === "em aberto" || status === "backlog";
  }).length;
  const statusEmAtendimento = countStatus(filtered, "Em atendimento");
  const statusNaoAprovado = countStatus(filtered, "Nao Aprovado");
  const statusSolicitacaoFinalizada = filtered.filter((item) => {
    const status = normalize(item.status);
    return status === "solicitacao finalizada" || status === "servico finalizado";
  }).length;
  const statusConcluidos = countConcluidos(filtered);
  const statusAbertoLabel =
    escopoPainel === "preventiva"
      ? "Backlog"
      : escopoPainel === "corretiva"
        ? "Em aberto"
        : "Em aberto / Backlog";
  const statusFinalizadoLabel =
    escopoPainel === "preventiva"
      ? "Servico Finalizado"
      : escopoPainel === "corretiva"
        ? "Solicitacao Finalizada"
        : "Finalizados";

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
  const analystSlices = useMemo<AnalystSlice[]>(() => {
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

  // Interaction handler for ring selection in the analyst donut chart
  function handleDonutClick(event: MouseEvent<HTMLDivElement>) {
    if (analystSlices.length === 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;

    const outerRadius = rect.width / 2;
    const innerRadius = outerRadius * 0.33;
    const distance = Math.hypot(dx, dy);

    // Consider only clicks on the ring area.
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
    if (!exists) setSelectedAnalyst(null);
  }, [analistasRank, selectedAnalyst]);

  useEffect(() => {
    if (!selectedPeriod) return;
    const exists = series.some((item) => item.key === selectedPeriod);
    if (!exists) setSelectedPeriod(null);
  }, [series, selectedPeriod]);

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

    const isConcluido = (value: string | null | undefined) => {
      const status = normalize(value);
      return (
        status === "chamado concluido" ||
        status === "concluido" ||
        status === "solicitacao finalizada" ||
        status === "servico finalizado"
      );
    };

    return filtered.filter((item) => {
      const status = normalize(item.status);

      if (statusModal.key === "em-aberto") return status === "em aberto" || status === "backlog";
      if (statusModal.key === "em-atendimento") return status === "em atendimento";
      if (statusModal.key === "nao-aprovado") return status === "nao aprovado";
      if (statusModal.key === "solicitacao-finalizada") {
        return status === "solicitacao finalizada" || status === "servico finalizado";
      }
      return isConcluido(item.status);
    });
  }, [filtered, statusModal]);

  const uploadData = dashboard?.upload?.uploadData
    ? new Date(dashboard.upload.uploadData).toLocaleString("pt-BR")
    : "Sem data";

  function updateFilter<Key extends keyof FilterState>(key: Key, value: FilterState[Key]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  // View model consumed by the page component
  return {
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
  };
}
