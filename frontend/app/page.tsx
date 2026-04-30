/**
 * Página inicial de entrada do aplicativo.
 * Mostra um link rápido para abrir o dashboard principal de chamados.
 */
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-entry">
      <h1>Painel de Manutenção</h1>
      <p>Módulo inicial: chamados corretivos.</p>
      <Link href="/chamados" className="home-entry-link">
        Abrir dashboard
      </Link>
    </main>
  );
}
