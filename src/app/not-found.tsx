import Link from "next/link";

export default function NotFound() {
  return (
    <main className="gate" style={{ position: "relative", minHeight: "100svh" }}>
      <div className="gate-card">
        <p className="gate-kicker">Mislaid</p>
        <h1 className="gate-names">This page is not on the list.</h1>
        <p className="gate-meta">The invitation itself is still where you left it.</p>
        <Link className="btn btn-solid seal" href="/">Return to the evening</Link>
      </div>
    </main>
  );
}
