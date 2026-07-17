import React, { useState } from "react";
import { addCustomWord } from "../data/storage";

export default function AddWord({ state, setState }) {
  const [en, setEn] = useState("");
  const [fr, setFr] = useState("");
  const [msg, setMsg] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!en.trim() || !fr.trim()) return;
    setState(addCustomWord(state, en.trim(), fr.trim()));
    setMsg(`"${en}" ajouté !`);
    setEn("");
    setFr("");
    setTimeout(() => setMsg(""), 2000);
  }

  return (
    <div className="view">
      <h2>Ajouter un mot</h2>
      <form className="panel" onSubmit={submit}>
        <label>
          Mot en anglais
          <input value={en} onChange={(e) => setEn(e.target.value)} placeholder="ex: umbrella" />
        </label>
        <label>
          Traduction en français
          <input value={fr} onChange={(e) => setFr(e.target.value)} placeholder="ex: parapluie" />
        </label>
        <button className="cta" type="submit">Ajouter</button>
        {msg && <p className="success">{msg}</p>}
      </form>
    </div>
  );
}
