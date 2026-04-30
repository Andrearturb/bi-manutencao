"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchDashboardCustos } from "@/lib/api";
import { type DashboardCustoItem, type DashboardCustosPayload } from "@/lib/types";

type CustosFilterState = {
  tipoManutencao: string;
  fornecedor: string;
  loja: string;
  praca: string;
  mes: string;
  ano: string;
};

type RankValor = {
  label: string;
  valor: number;
};

const DEFAULT_FILTERS: CustosFilterState = {
  tipoManutencao: "todos",
  fornecedor: "todos",
  loja: "todos",
  praca: "todos",
  mes: "todos",
  ano: "todos",
};

const EMPTY_DASHBOARD: DashboardCustosPayload = {
  dadosCustos: [],
  uploadCustos: {},
};

const CONTA_RAZAO_CORRETIVA = "41140014";
const CONTA_RAZAO_PREVENTIVA = "41140026";

export function useCustosDashboard(token: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardCustosPayload>(EMPTY_DASHBOARD);
  const [filters, setFilters] = useState<CustosFilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!token) {
        if (!active) return;
        setDashboard(EMPTY_DASHBOARD);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const custosPayload = await fetchDashboardCustos(token);

        if (!active) return;
        setDashboard(custosPayload);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Falha ao carregar painel de custos.";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [token]);

  function updateFilter<Key extends keyof CustosFilterState>(key: Key, value: CustosFilterState[Key]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const dadosCustos = dashboard.dadosCustos ?? [];

  const tipoOptions = ["corretiva", "preventiva"];

  const fornecedorOptions = useMemo(
    () => buildSortedOptions(dadosCustos.map((item) => item.fornecedor)),
    [dadosCustos],
  );
  const lojaOptions = useMemo(
    () => buildSortedOptions(dadosCustos.map((item) => item.loja)),
    [dadosCustos],
  );
  const pracaOptions = useMemo(
    () => buildSortedOptions(dadosCustos.map((item) => item.praca)),
    [dadosCustos],
  );

  const mesOptions = useMemo(() => {
    const months = new Set<string>();
    for (const item of dadosCustos) {
      const date = parseDate(item.competencia) ?? parseDate(item.data_documento);
      if (!date) continue;
      months.add(String(date.getMonth() + 1));
    }
    return Array.from(months).sort((a, b) => Number(a) - Number(b));
  }, [dadosCustos]);

  const anoOptions = useMemo(() => {
    const years = new Set<string>();
    for (const item of dadosCustos) {
      const date = parseDate(item.competencia) ?? parseDate(item.data_documento);
      if (!date) continue;
      years.add(String(date.getFullYear()));
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [dadosCustos]);

  const filteredSemTipo = useMemo(() => {
    return dadosCustos.filter((item) => {
      if (filters.fornecedor !== "todos" && safeText(item.fornecedor) !== filters.fornecedor) return false;
      if (filters.loja !== "todos" && safeText(item.loja) !== filters.loja) return false;
      if (filters.praca !== "todos" && safeText(item.praca) !== filters.praca) return false;

      const date = parseDate(item.competencia) ?? parseDate(item.data_documento);

      if (filters.mes !== "todos") {
        const month = date ? String(date.getMonth() + 1) : "";
        if (month !== filters.mes) return false;
      }

      if (filters.ano !== "todos") {
        const year = date ? String(date.getFullYear()) : "";
        if (year !== filters.ano) return false;
      }

      return true;
    });
  }, [dadosCustos, filters]);

  const filtered = useMemo(() => {
    if (filters.tipoManutencao === "todos") return filteredSemTipo;

    return filteredSemTipo.filter((item) => {
      const tipo = resolveTipoByContaRazao(item.conta_razao);
      return tipo === filters.tipoManutencao;
    });
  }, [filteredSemTipo, filters.tipoManutencao]);

  const totalCustos = useMemo(
    () => filtered.reduce((acc, item) => acc + (typeof item.valor === "number" ? item.valor : 0), 0),
    [filtered],
  );

  const totalPreventiva = useMemo(() => {
    return filteredSemTipo
      .filter((item) => resolveTipoByContaRazao(item.conta_razao) === "preventiva")
      .reduce((acc, item) => acc + (typeof item.valor === "number" ? item.valor : 0), 0);
  }, [filteredSemTipo]);

  const totalCorretiva = useMemo(() => {
    return filteredSemTipo
      .filter((item) => resolveTipoByContaRazao(item.conta_razao) === "corretiva")
      .reduce((acc, item) => acc + (typeof item.valor === "number" ? item.valor : 0), 0);
  }, [filteredSemTipo]);

  const baseRealizado = totalPreventiva + totalCorretiva;
  const percentualCustosVsRealizado = baseRealizado > 0 ? (totalCustos / baseRealizado) * 100 : null;

  const fornecedoresRank = useMemo(() => rankBy(filtered, (item) => item.fornecedor), [filtered]);
  const lojasRank = useMemo(() => rankBy(filtered, (item) => item.loja), [filtered]);

  const uploadData = dashboard.uploadCustos?.uploadData
    ? new Date(dashboard.uploadCustos.uploadData).toLocaleString("pt-BR")
    : "Sem atualizacao";

  return {
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
  };
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function safeText(value?: string | null): string {
  return value?.trim() || "(Em branco)";
}

function buildSortedOptions(values: Array<string | null | undefined>): string[] {
  const normalized = values
    .map((value) => safeText(value))
    .filter((value) => value !== "(Em branco)");

  return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function rankBy(items: DashboardCustoItem[], getLabel: (item: DashboardCustoItem) => string | null | undefined): RankValor[] {
  const totals = new Map<string, number>();

  for (const item of items) {
    const label = safeText(getLabel(item));
    const valor = typeof item.valor === "number" ? item.valor : 0;
    totals.set(label, (totals.get(label) ?? 0) + valor);
  }

  return Array.from(totals.entries())
    .map(([label, valor]) => ({ label, valor }))
    .sort((a, b) => b.valor - a.valor);
}

function resolveTipoByContaRazao(contaRazao?: string | null): "corretiva" | "preventiva" | null {
  const conta = contaRazao?.trim();
  if (!conta) return null;
  if (conta === CONTA_RAZAO_CORRETIVA) return "corretiva";
  if (conta === CONTA_RAZAO_PREVENTIVA) return "preventiva";
  return null;
}
