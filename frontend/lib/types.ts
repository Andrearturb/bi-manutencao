export type DashboardItem = {
  ticket?: string | null;
  status?: string | null;
  motivoNaoAprovacao?: string | null;
  colunaDRaw?: string | null;
  slaStatus?: string | null;
  loja?: string | null;
  praca?: string | null;
  categoria?: string | null;
  subcategoria?: string | null;
  analistaResponsavel?: string | null;
  requisitante?: string | null;
  fornecedor?: string | null;
  descricaoServico?: string | null;
  solucao?: string | null;
  os?: {
    status?: string | null;
    url?: string | null;
  } | null;
  dataRequisicao?: string | null;
  dataConclusao?: string | null;
  valorAprovado?: number | string | null;
  localAtendimento?: string | null;
  statusAssinatura?: string | null;
  statusOrdemServico?: string | null;
  createdOn?: string | null;
};

export type DashboardPayload = {
  dados: DashboardItem[];
  sla: {
    noPrazo?: number;
    atrasado?: number;
    total?: number;
    totalConsiderado?: number;
  };
  upload: {
    uploadData?: string;
    nomeArquivo?: string;
    totalRegistros?: number;
  };
};

export type DashboardManutencaoPayload = {
  dadosCorretivas: DashboardItem[];
  dadosPreventivas: DashboardItem[];
  uploadCorretivas: DashboardPayload["upload"];
  uploadPreventivas: DashboardPayload["upload"];
};

export type TipoManutencao = "corretiva" | "preventiva";
export type EscopoPainel = TipoManutencao | "ambas";

export type DashboardCustoItem = {
  divisao?: string | null;
  numero_documento?: string | null;
  conta_razao?: string | null;
  data_documento?: string | null;
  conta_lancto_contrap?: string | null;
  tipo_documento?: string | null;
  data_entrada?: string | null;
  conta_contra_partida?: string | null;
  atribuicao?: string | null;
  nome_1?: string | null;
  loja?: string | null;
  praca?: string | null;
  competencia?: string | null;
  fornecedor?: string | null;
  descricao?: string | null;
  valor?: number | null;
};

export type DashboardCustosPayload = {
  dadosCustos: DashboardCustoItem[];
  uploadCustos: DashboardPayload["upload"];
};

export type FilterState = {
  status: string;
  loja: string;
  praca: string;
  categoria: string;
  mes: string;
  ano: string;
};
