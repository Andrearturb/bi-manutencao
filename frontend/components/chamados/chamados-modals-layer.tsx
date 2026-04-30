/** Camada de modais reutilizáveis do painel de chamados. */

import { type Dispatch, type SetStateAction } from "react";

import { ChamadosDetalhesModal, statusToneFromKey } from "@/components/chamados/chamados-detalhes-modal";
import { type DashboardItem } from "@/lib/types";
import { type StatusModalState, type SubcategoryModalState } from "@/lib/hooks/use-chamados-dashboard";

type ChamadosModalsLayerProps = {
  subcategoryModal: SubcategoryModalState;
  setSubcategoryModal: Dispatch<SetStateAction<SubcategoryModalState>>;
  modalItems: DashboardItem[];
  lojaModal: string | null;
  setLojaModal: Dispatch<SetStateAction<string | null>>;
  lojaModalItems: DashboardItem[];
  statusModal: StatusModalState;
  setStatusModal: Dispatch<SetStateAction<StatusModalState>>;
  statusModalItems: DashboardItem[];
  totalModalOpen: boolean;
  setTotalModalOpen: Dispatch<SetStateAction<boolean>>;
  filtered: DashboardItem[];
  totalOsModalOpen: boolean;
  setTotalOsModalOpen: Dispatch<SetStateAction<boolean>>;
  totalOsModalItems: DashboardItem[];
};

export function ChamadosModalsLayer({
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
  filtered,
  totalOsModalOpen,
  setTotalOsModalOpen,
  totalOsModalItems,
}: ChamadosModalsLayerProps) {
  return (
    <>
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
          titulo="Total de chamados"
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
    </>
  );
}
