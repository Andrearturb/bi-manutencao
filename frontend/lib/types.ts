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

export type FilterState = {
  status: string;
  loja: string;
  praca: string;
  categoria: string;
  mes: string;
  ano: string;
};
