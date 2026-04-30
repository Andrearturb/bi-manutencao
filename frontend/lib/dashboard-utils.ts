import { DashboardItem, FilterState } from "@/lib/types";

const STATUS_ENCERRADOS = [
  "chamado concluido",
  "concluido",
  "solicitacao finalizada",
  "servico finalizado",
];

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
    const date = parseDate(item.dataRequisicao);
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

export type SlaMetrics = {
  percent: number;
  noPrazo: number;
  atrasado: number;
  totalConsiderado: number;
};

function normalizeSlaStatus(value: string | null | undefined): string {
  const normalized = normalize(value);
  if (normalized === "noprazo" || normalized === "no prazo") return "NoPrazo";
  if (normalized === "atrasado") return "Atrasado";
  return "";
}

export function calcSlaMetrics(dados: DashboardItem[]): SlaMetrics {
  let noPrazo = 0;
  let atrasado = 0;

  for (const item of dados) {
    const status = normalizeSlaStatus(item.slaStatus);
    if (status === "NoPrazo") noPrazo += 1;
    if (status === "Atrasado") atrasado += 1;
  }

  const totalConsiderado = noPrazo + atrasado;
  const percent = totalConsiderado === 0 ? 0 : Math.round((noPrazo / totalConsiderado) * 100);

  return {
    percent,
    noPrazo,
    atrasado,
    totalConsiderado,
  };
}

export function calcSlaPercent(dados: DashboardItem[]): number {
  return calcSlaMetrics(dados).percent;
}

export function calcCustoMedio(dados: DashboardItem[]): number {
  const encerrados = dados.filter((item) => STATUS_ENCERRADOS.includes(normalize(item.status)));
  if (encerrados.length === 0) return 0;

  const soma = encerrados.reduce((acc, item) => {
    const value = item.valorAprovado;

    if (typeof value === "number") {
      return Number.isFinite(value) ? acc + value : acc;
    }

    if (typeof value === "string") {
      const cleaned = value.trim();
      if (!cleaned) return acc;

      const normalized = cleaned.includes(",")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned;

      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? acc + parsed : acc;
    }

    // Chamado encerrado sem custo deve entrar no denominador como zero.
    return acc;
  }, 0);

  return Math.round(soma / encerrados.length);
}

export function countStatus(dados: DashboardItem[], statusLabel: string): number {
  const target = normalize(statusLabel);
  return dados.filter((item) => normalize(item.status) === target).length;
}

export function countConcluidos(dados: DashboardItem[]): number {
  return dados.filter((item) => STATUS_ENCERRADOS.includes(normalize(item.status))).length;
}

export function countTotalOs(dados: DashboardItem[]): number {
  return dados.filter((item) => {
    const osStatus = normalize(item.os?.status);
    return osStatus === "pendente" || osStatus === "concluido";
  }).length;
}

export type MonthlyPoint = {
  key: string;
  mes: string;
  monthValue: string;
  yearValue: string;
  total: number;
  concluidos: number;
};

export function monthlySeries(dados: DashboardItem[]): MonthlyPoint[] {
  const byMonth = new Map<string, { total: number; concluidos: number; monthOrder: number }>();

  for (const item of dados) {
    const date = parseDate(item.dataRequisicao);
    if (!date) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthOrder = date.getFullYear() * 100 + (date.getMonth() + 1);
    const current = byMonth.get(key) ?? { total: 0, concluidos: 0, monthOrder };
    current.total += 1;
    if (STATUS_ENCERRADOS.includes(normalize(item.status))) current.concluidos += 1;
    byMonth.set(key, current);
  }

  return [...byMonth.entries()]
    .sort((a, b) => a[1].monthOrder - b[1].monthOrder)
    .map(([key, values]) => {
      const [year, month] = key.split("-");
      const ref = new Date(Number(year), Number(month) - 1, 1);
      const mes = ref.toLocaleString("pt-BR", { month: "short" }).toUpperCase();
      return {
        key,
        mes,
        monthValue: month,
        yearValue: year,
        total: values.total,
        concluidos: values.concluidos,
      };
    });
}
