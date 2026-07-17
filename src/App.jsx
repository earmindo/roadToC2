import React, { useEffect, useState } from "react";
import { loadState, saveState } from "./data/storage";
import Dashboard from "./components/Dashboard";
import Collections from "./components/Collections";
import AddWord from "./components/AddWord";
import PracticeSetup from "./components/PracticeSetup";
import PracticeSession from "./components/PracticeSession";

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [view, setView] = useState("dashboard");
  const [practiceConfig, setPracticeConfig] = useState(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  function goTo(v) {
    setView(v);
  }

  function startPractice(mode, scope) {
    setPracticeConfig({ mode, scope });
    setView("practice-session");
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧠 VocabMaster</h1>
        <nav>
          <button className={view === "dashboard" ? "active" : ""} onClick={() => goTo("dashboard")}>Tableau de bord</button>
          <button className={view === "collections" ? "active" : ""} onClick={() => goTo("collections")}>Collections</button>
          <button className={view.startsWith("practice") ? "active" : ""} onClick={() => goTo("practice-setup")}>Pratiquer</button>
          <button className={view === "add-word" ? "active" : ""} onClick={() => goTo("add-word")}>Ajouter</button>
        </nav>
      </header>

      <main>
        {view === "dashboard" && <Dashboard state={state} onNavigate={goTo} />}
        {view === "collections" && <Collections state={state} setState={setState} />}
        {view === "add-word" && <AddWord state={state} setState={setState} />}
        {view === "practice-setup" && (
          <PracticeSetup state={state} onStart={startPractice} />
        )}
        {view === "practice-session" && practiceConfig && (
          <PracticeSession
            key={`${practiceConfig.mode}-${practiceConfig.scope}-${Date.now()}`}
            state={state}
            setState={setState}
            mode={practiceConfig.mode}
            scope={practiceConfig.scope}
            onFinish={() => goTo("dashboard")}
          />
        )}
      </main>
    </div>
  );
}
