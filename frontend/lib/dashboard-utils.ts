import { DashboardItem, FilterState } from "@/lib/types";

const STATUS_CONCLUIDO = ["concluido", "concluido", "solicitacao finalizada"];

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function filterDados(dados: DashboardItem[], filter: FilterState): DashboardItem[] {
  return dados.filter((item) => {
    const date = parseDate(item.dataRequisicao ?? item.dataConclusao);
    const mes = date ? String(date.getMonth() + 1).padStart(2, "0") : "";
    const ano = date ? String(date.getFullYear()) : "";

    const statusOk = filter.status === "todos" || normalize(item.status) === normalize(filter.status);
    const lojaOk = filter.loja === "todos" || (item.loja ?? "") === filter.loja;
    const pracaOk = filter.praca === "todos" || (item.praca ?? "") === filter.praca;
    const categoriaOk = filter.categoria === "todos" || (item.categoria ?? "") === filter.categoria;
    const mesOk = filter.mes === "todos" || mes === filter.mes;
    const anoOk = filter.ano === "todos" || ano === filter.ano;

    return statusOk && lojaOk && pracaOk && categoriaOk && mesOk && anoOk;
  });
}

export function uniqueOptions(dados: DashboardItem[], getter: (item: DashboardItem) => string | null | undefined): string[] {
  return Array.from(
    new Set(
      dados
        .map(getter)
        .map((value) => (value ?? "").trim())
        .filter((value) => value.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function countBy(dados: DashboardItem[], getter: (item: DashboardItem) => string): Array<{ label: string; qtd: number; pct: number }> {
  const total = dados.length || 1;
  const map = new Map<string, number>();

  for (const item of dados) {
    const key = getter(item).trim() || "Sem informação";
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([label, qtd]) => ({ label, qtd, pct: (qtd / total) * 100 }))
    .sort((a, b) => b.qtd - a.qtd);
}

export function calcSlaPercent(dados: DashboardItem[]): number {
  const considerados = dados.filter((item) => {
    const status = item.slaStatus ?? "";
    return status === "NoPrazo" || status === "Atrasado";
  });

  if (considerados.length === 0) return 0;

  const noPrazo = considerados.filter((item) => item.slaStatus === "NoPrazo").length;
  return Math.round((noPrazo / considerados.length) * 100);
}

export function calcCustoMedio(dados: DashboardItem[]): number {
  const valores = dados
    .map((item) => item.valorAprovado)
    .filter((value): value is number => typeof value === "number");

  if (valores.length === 0) return 0;
  const soma = valores.reduce((acc, cur) => acc + cur, 0);
  return Math.round(soma / valores.length);
}

export function countStatus(dados: DashboardItem[], statusLabel: string): number {
  const target = normalize(statusLabel);
  return dados.filter((item) => normalize(item.status) === target).length;
}

export function countConcluidos(dados: DashboardItem[]): number {
  return dados.filter((item) => STATUS_CONCLUIDO.includes(normalize(item.status))).length;
}

export function monthlySeries(dados: DashboardItem[]): Array<{ mes: string; total: number; concluidos: number }> {
  const byMonth = new Map<string, { total: number; concluidos: number; monthOrder: number }>();

  for (const item of dados) {
    const date = parseDate(item.dataRequisicao ?? item.dataConclusao);
    if (!date) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthOrder = date.getFullYear() * 100 + (date.getMonth() + 1);
    const current = byMonth.get(key) ?? { total: 0, concluidos: 0, monthOrder };
    current.total += 1;
    if (STATUS_CONCLUIDO.includes(normalize(item.status))) current.concluidos += 1;
    byMonth.set(key, current);
  }

  return [...byMonth.entries()]
    .sort((a, b) => a[1].monthOrder - b[1].monthOrder)
    .map(([key, values]) => {
      const [year, month] = key.split("-");
      const ref = new Date(Number(year), Number(month) - 1, 1);
      const mes = ref.toLocaleString("pt-BR", { month: "short" }).toUpperCase();
      return {
        mes,
        total: values.total,
        concluidos: values.concluidos,
      };
    });
}
