import { DashboardItem } from "@/lib/types";

export type ModalTone = "default" | "aberto" | "atendimento" | "nao-aprovado" | "finalizada" | "concluido";

export type StatusModalKey =
  | "em-aberto"
  | "em-atendimento"
  | "nao-aprovado"
  | "solicitacao-finalizada"
  | "concluidos";

type ChamadosDetalhesModalProps = {
  titulo: string;
  subtitulo: string;
  items: DashboardItem[];
  onClose: () => void;
  tone?: ModalTone;
  showMotivoNaoAprovacao?: boolean;
};

function formatValorAprovado(value: DashboardItem["valorAprovado"]): string {
  // Backend can send currency as number or localized string; normalize both for a stable UI.
  if (typeof value === "number") {
    return Number.isFinite(value) ? `R$ ${value.toLocaleString("pt-BR")}` : "-";
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(parsed) ? `R$ ${parsed.toLocaleString("pt-BR")}` : "-";
  }

  return "-";
}

export function statusToneFromKey(key: StatusModalKey): ModalTone {
  // Keeps visual mapping in one place so status cards and modal styles stay in sync.
  if (key === "em-aberto") return "aberto";
  if (key === "em-atendimento") return "atendimento";
  if (key === "nao-aprovado") return "nao-aprovado";
  if (key === "solicitacao-finalizada") return "finalizada";
  return "concluido";
}

export function ChamadosDetalhesModal({
  titulo,
  subtitulo,
  items,
  onClose,
  tone = "default",
  showMotivoNaoAprovacao = false,
}: ChamadosDetalhesModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <article className="modal-card" onClick={(event) => event.stopPropagation()}>
        <header className={`modal-header tone-${tone}`}>
          <div>
            <h3>{titulo}</h3>
            <p>{subtitulo}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            Fechar
          </button>
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
                  <td>{item.os?.url ? <a href={item.os.url} target="_blank" rel="noreferrer" className="os-link">PDF</a> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
