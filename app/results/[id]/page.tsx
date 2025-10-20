'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type ApiOk = { summary: any; history: any[] };
type ApiErr = { error: string };

export default function ResultsPage() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<ApiOk | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/simulations/${id}/results`, { cache: 'no-store' });
        if (!res.ok) {
          const j: ApiErr = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          if (!cancelled) setErr(j?.error || `HTTP ${res.status}`);
          return;
        }
        const j: ApiOk = await res.json();
        if (!cancelled) setData(j);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Network error');
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (err) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Résultats</h2>
          </div>
        </header>
        <main className="py-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-red-600">Introuvables : {err}</p>
              <div className="mt-4 space-x-3">
                <button className="px-4 py-2 border rounded-lg" onClick={() => router.push('/simulate')}>Nouvelle simulation</button>
                <button className="px-4 py-2 border rounded-lg" onClick={() => location.reload()}>Réessayer</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data?.summary) return <main className="p-8">Chargement…</main>;

  const { summary, history } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Résultats</h2>
          <a className="text-blue-600 hover:underline" href={`/api/simulations/${summary.id}/export`}>Exporter CSV</a>
        </div>
      </header>

      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Résumé */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p>
              Règles: <b>{summary.ruleset}</b> • Tours: <b>{summary.turns}</b> • Fromages restants: <b>{summary.cheesesRemaining}</b>
            </p>
            <ul className="mt-4 grid md:grid-cols-2 gap-4">
              {summary.perMouse.map((pm: any, i: number) => (
                <li key={i} className="p-4 rounded-lg bg-gray-50">
                  <b>🐭 {pm.name}</b>
                  <div className="text-sm text-gray-700 mt-1">
                    Fromages: {pm.eaten} • Santé finale: {pm.finalHealth} • Moral final: {pm.finalMood}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Timeline brute (peut être remplacée par des charts plus tard) */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline (extrait)</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-800">
              {JSON.stringify(history.slice(0, 6), null, 2)}
              {history.length > 6 ? '\n…' : ''}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
