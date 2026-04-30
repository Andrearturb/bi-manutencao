/** Componentes de gráficos da área de chamados. */

import { type MouseEvent } from "react";

import { type MonthlyPoint } from "@/lib/dashboard-utils";
import { type AnalystSlice } from "@/lib/hooks/use-chamados-dashboard";

type AnalystDonutCardProps = {
  selectedAnalyst: string | null;
  setSelectedAnalyst: (value: string | null | ((prev: string | null) => string | null)) => void;
  donutBackground: string;
  handleDonutClick: (event: MouseEvent<HTMLDivElement>) => void;
  analystSlices: AnalystSlice[];
};

export function AnalystDonutCard({
  selectedAnalyst,
  setSelectedAnalyst,
  donutBackground,
  handleDonutClick,
  analystSlices,
}: AnalystDonutCardProps) {
  return (
    <article className="card donut-card">
      <h3>Chamados por analistas</h3>
      {selectedAnalyst ? (
        <button type="button" className="analyst-filter-pill" onClick={() => setSelectedAnalyst(null)}>
          Analista: {selectedAnalyst} (limpar)
        </button>
      ) : null}

      <div className="donut-wrap">
        <div className="donut multi" style={{ background: donutBackground }} onClick={handleDonutClick}>
          {analystSlices.map((item) => {
            const angle = ((item.mid / 100) * 360 - 90) * (Math.PI / 180);
            const radius = item.pct < 8 ? 46 : 42;
            const x = 50 + Math.cos(angle) * radius;
            const y = 50 + Math.sin(angle) * radius;
            const isActive = selectedAnalyst === item.label;
            const isMuted = Boolean(selectedAnalyst && !isActive);

            return (
              <div key={`slice-${item.label}`}>
                {item.pct >= 8 ? (
                  <button
                    type="button"
                    className={`slice-label ${isMuted ? "muted" : ""}`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => setSelectedAnalyst((prev) => (prev === item.label ? null : item.label))}
                    aria-label={`Filtrar por ${item.label}`}
                  >
                    {item.qtd}
                  </button>
                ) : null}
              </div>
            );
          })}
          <span className="donut-center" />
        </div>
      </div>

      <ul className="analyst-legend">
        {analystSlices.map((analista) => {
          const isActive = selectedAnalyst === analista.label;
          const isMuted = Boolean(selectedAnalyst && !isActive);

          return (
            <li key={analista.label} className={`${isActive ? "active" : ""} ${isMuted ? "muted" : ""}`}>
              <button
                type="button"
                className="legend-item-btn"
                onClick={() => setSelectedAnalyst((prev) => (prev === analista.label ? null : analista.label))}
              >
                <span className="legend-dot" style={{ background: analista.color }} />
                <span className="legend-name" title={analista.label}>
                  {analista.label}
                </span>
                <strong>{analista.qtd}</strong>
              </button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

type MonthlyBarsCardProps = {
  selectedPeriod: string | null;
  setSelectedPeriod: (value: string | null | ((prev: string | null) => string | null)) => void;
  series: MonthlyPoint[];
  maxSeries: number;
};

export function MonthlyBarsCard({ selectedPeriod, setSelectedPeriod, series, maxSeries }: MonthlyBarsCardProps) {
  return (
    <article className="card bars-card">
      <h3>Chamados concluídos x chamados totais</h3>
      {selectedPeriod ? (
        <button type="button" className="period-filter-pill" onClick={() => setSelectedPeriod(null)}>
          Período: {selectedPeriod} (limpar)
        </button>
      ) : null}

      <div className="bars-grid">
        {series.map((item) => {
          const isActive = selectedPeriod === item.key;
          const isMuted = Boolean(selectedPeriod && !isActive);

          return (
            <button
              type="button"
              key={item.key}
              className={`bar-column interactive ${isActive ? "active" : ""} ${isMuted ? "muted" : ""}`}
              onClick={() => setSelectedPeriod((prev) => (prev === item.key ? null : item.key))}
              aria-label={`Filtrar por periodo ${item.key}`}
            >
              <div className="bar-stack">
                <div className="bar total" style={{ height: `${(item.total / maxSeries) * 180}px` }}>
                  <small>{item.total}</small>
                </div>
                <div className="bar concluded" style={{ height: `${(item.concluidos / maxSeries) * 180}px` }}>
                  <small>{item.concluidos}</small>
                </div>
              </div>
              <span>
                {item.mes}/{item.yearValue.slice(2)}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}
