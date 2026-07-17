import React from "react";
import { getGlobalStats, getWeakestWords } from "../data/storage";
import { formatDuration } from "../utils";

export default function Dashboard({ state, onNavigate }) {
  const stats = getGlobalStats(state);
  const weakest = getWeakestWords(state, 8);

  return (
    <div className="view">
      <h2>Tableau de bord</h2>

      <div className="stat-grid">
        <StatCard label="Mots au total" value={stats.totalWords} />
        <StatCard label="Précision globale" value={`${stats.accuracy}%`} accent />
        <StatCard label="Maîtrisés" value={stats.masteredCount} tone="good" />
        <StatCard label="À travailler" value={stats.strugglingCount} tone="bad" />
        <StatCard label="Nouveaux" value={stats.newCount} />
        <StatCard label="Verbes irréguliers" value={stats.irregularCount} />
        <StatCard label="Temps de pratique" value={formatDuration(stats.totalPracticeMs)} />
        <StatCard label="Sessions" value={stats.sessionsCount} />
      </div>

      <div className="panel">
        <h3>Points faibles</h3>
        {weakest.length === 0 && <p className="muted">Pas encore assez de données. Commence à pratiquer !</p>}
        {weakest.length > 0 && (
          <table className="weak-table">
            <thead>
              <tr><th>Mot</th><th>Traduction</th><th>Réussite</th></tr>
            </thead>
            <tbody>
              {weakest.map((w) => (
                <tr key={w.id}>
                  <td>{w.en}</td>
                  <td>{w.fr}</td>
                  <td>
                    <span className={`badge ${w.rate < 0.4 ? "bad" : "warn"}`}>
                      {Math.round(w.rate * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="cta" onClick={() => onNavigate("practice-setup")}>
        Commencer une session de pratique
      </button>
    </div>
  );
}

function StatCard({ label, value, tone, accent }) {
  return (
    <div className={`stat-card ${tone || ""} ${accent ? "accent" : ""}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
