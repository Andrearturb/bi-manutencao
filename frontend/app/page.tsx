import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-entry">
      <h1>Painel de Manutencao</h1>
      <p>Modulo inicial: Chamados Corretivos.</p>
      <Link href="/chamados" className="home-entry-link">
        Abrir Dashboard
      </Link>
    </main>
  );
}
