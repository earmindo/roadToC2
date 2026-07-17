import React, { useState } from "react";
import { getCollections, deleteWord } from "../data/storage";

const LABELS = {
  irregularVerbs: "Verbes irréguliers",
  mastered: "Mots maîtrisés",
  struggling: "Mots à travailler",
  newWords: "Nouveaux mots",
};

export default function Collections({ state, setState }) {
  const [active, setActive] = useState("irregularVerbs");
  const collections = getCollections(state);
  const list = collections[active];

  return (
    <div className="view">
      <h2>Collections</h2>
      <div className="tabs">
        {Object.keys(LABELS).map((key) => (
          <button
            key={key}
            className={`tab ${active === key ? "active" : ""}`}
            onClick={() => setActive(key)}
          >
            {LABELS[key]} <span className="count">{collections[key].length}</span>
          </button>
        ))}
      </div>

      <div className="word-list">
        {list.length === 0 && <p className="muted">Aucun mot dans cette collection.</p>}
        {list.map((w) => (
          <div className="word-row" key={w.id}>
            <div className="word-main">
              <strong>{w.en}</strong>
              {w.extra && <span className="muted"> ({w.extra.past} · {w.extra.participle})</span>}
              <div className="muted">{w.fr}</div>
            </div>
            <div className="word-meta">
              <span className="badge">{w.stats.seen} vues</span>
              <span className="badge">
                {w.stats.seen ? Math.round((w.stats.correct / w.stats.seen) * 100) : 0}%
              </span>
              {w.custom && (
                <button
                  className="icon-btn"
                  title="Supprimer"
                  onClick={() => setState(deleteWord(state, w.id))}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
