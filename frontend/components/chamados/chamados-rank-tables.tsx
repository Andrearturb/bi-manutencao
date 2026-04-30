/** Tabelas de ranking reutilizáveis para o painel de chamados. */

import { Fragment } from "react";

import { type RankRow } from "@/lib/hooks/use-chamados-dashboard";

type LojaTableProps = {
  rows: RankRow[];
  onOpenLoja: (loja: string) => void;
};

export function LojaTable({ rows, onOpenLoja }: LojaTableProps) {
  return (
    <article className="card rank-table loja-table">
      <h3>Loja</h3>
      <table>
        <thead>
          <tr>
            <th>Loja</th>
            <th>Qtd.</th>
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

export function CategoryTable({
  rows,
  subRowsByCategory,
  expandedCategory,
  onToggleCategory,
  onOpenSubcategory,
}: CategoryTableProps) {
  return (
    <article className="card rank-table category-table">
      <h3>Categoria</h3>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Qtd.</th>
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
