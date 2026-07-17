import React, { useState } from "react";
import { getCollections } from "../data/storage";

const MODES = [
  { key: "mcq", label: "QCM", desc: "Choisis la bonne traduction parmi 4 propositions." },
  { key: "typing", label: "Écriture", desc: "Écris la traduction toi-même." },
  { key: "match", label: "Association", desc: "Relie les mots à leur traduction." },
  { key: "flashcards", label: "Flashcards", desc: "Retourne la carte, comme Anki." },
];

const SCOPES = {
  all: "Tous les mots",
  irregularVerbs: "Verbes irréguliers",
  struggling: "Mots à travailler",
  newWords: "Nouveaux mots",
  mastered: "Mots maîtrisés",
};

export default function PracticeSetup({ state, onStart }) {
  const [mode, setMode] = useState("mcq");
  const [scope, setScope] = useState("all");
  const collections = getCollections(state);

  function availableCount() {
    if (scope === "all") return Object.values(state.words).length;
    return collections[scope].length;
  }

  return (
    <div className="view">
      <h2>Nouvelle session</h2>

      <div className="panel">
        <h3>Mode</h3>
        <div className="mode-grid">
          {MODES.map((m) => (
            <button
              key={m.key}
              className={`mode-card ${mode === m.key ? "active" : ""}`}
              onClick={() => setMode(m.key)}
            >
              <strong>{m.label}</strong>
              <span className="muted">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Collection</h3>
        <select value={scope} onChange={(e) => setScope(e.target.value)}>
          {Object.entries(SCOPES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <p className="muted">{availableCount()} mot(s) disponible(s)</p>
      </div>

      <button
        className="cta"
        disabled={availableCount() < (mode === "mcq" ? 4 : 1)}
        onClick={() => onStart(mode, scope)}
      >
        Démarrer
      </button>
      {availableCount() < 4 && mode === "mcq" && (
        <p className="muted">Le QCM nécessite au moins 4 mots dans cette collection.</p>
      )}
    </div>
  );
}
