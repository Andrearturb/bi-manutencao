/** Cartões e campos reutilizáveis da área de chamados. */

import { FilterState } from "@/lib/types";

type SelectFieldProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  mapLabel?: (value: string) => string;
};

export function SelectField({ label, value, options, onChange, mapLabel }: SelectFieldProps) {
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

/** Cartão principal de KPI com suporte a clique e acessibilidade por teclado. */
export function KpiCard({ title, value, subtitle, onClick }: KpiCardProps) {
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

export function MiniKpi({ title, value, emphasis, onClick }: MiniKpiProps) {
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

export type UpdateFilterFn = <Key extends keyof FilterState>(key: Key, value: FilterState[Key]) => void;
