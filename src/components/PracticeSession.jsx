import React, { useMemo, useRef, useState } from "react";
import { getCollections, recordAnswer, addSession } from "../data/storage";
import { pickRandom, shuffle, normalize } from "../utils";

const QUEUE_SIZE = 15;

export default function PracticeSession({ state, setState, mode, scope, onFinish }) {
  const startRef = useRef(Date.now());
  const pool = useMemo(() => {
    const collections = getCollections(state);
    const words = scope === "all" ? Object.values(state.words) : collections[scope];
    return pickRandom(words, Math.min(QUEUE_SIZE, words.length));
  }, []); // eslint-disable-line

  const allWords = useMemo(() => Object.values(state.words), []); // eslint-disable-line

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const current = pool[index];

  function handleAnswer(isCorrect) {
    setState((prev) => recordAnswer(prev, current.id, isCorrect));
    if (isCorrect) setCorrectCount((c) => c + 1);
    if (index + 1 >= pool.length) {
      finish(isCorrect ? correctCount + 1 : correctCount);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function finish(finalCorrect) {
    setDone(true);
    setState((prev) =>
      addSession(prev, {
        start: startRef.current,
        end: Date.now(),
        mode,
        correct: finalCorrect,
        total: pool.length,
      })
    );
  }

  if (pool.length === 0) {
    return (
      <div className="view">
        <p>Pas assez de mots dans cette collection.</p>
        <button className="cta" onClick={() => onFinish()}>Retour</button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((correctCount / pool.length) * 100);
    return (
      <div className="view">
        <h2>Session terminée !</h2>
        <div className="panel result-panel">
          <div className="stat-value big">{pct}%</div>
          <p>{correctCount} / {pool.length} bonnes réponses</p>
        </div>
        <button className="cta" onClick={() => onFinish()}>Retour au tableau de bord</button>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(index / pool.length) * 100}%` }} />
      </div>
      <p className="muted">{index + 1} / {pool.length}</p>

      {mode === "mcq" && (
        <MCQ current={current} allWords={allWords} onAnswer={handleAnswer} />
      )}
      {mode === "typing" && <Typing current={current} onAnswer={handleAnswer} />}
      {mode === "match" && (
        <MatchMode
          pool={pool.slice(index, index + 4).length >= 4 ? pool.slice(index, index + 4) : pool.slice(0, 4)}
          onBatchDone={(results) => {
            // results: array of {id, correct} for the batch
            setState((prev) => {
              let next = prev;
              for (const r of results) next = recordAnswer(next, r.id, r.correct);
              return next;
            });
            const gained = results.filter((r) => r.correct).length;
            const newCorrect = correctCount + gained;
            setCorrectCount(newCorrect);
            const nextIndex = index + results.length;
            if (nextIndex >= pool.length) {
              finish(newCorrect);
            } else {
              setIndex(nextIndex);
            }
          }}
        />
      )}
      {mode === "flashcards" && <Flashcard current={current} onAnswer={handleAnswer} />}
    </div>
  );
}

function MCQ({ current, allWords, onAnswer }) {
  const options = useMemo(() => {
    const distractors = pickRandom(
      allWords.filter((w) => w.id !== current.id),
      3
    ).map((w) => w.fr);
    return shuffle([current.fr, ...distractors]);
  }, [current.id]); // eslint-disable-line

  const [picked, setPicked] = useState(null);

  function pick(opt) {
    if (picked) return;
    setPicked(opt);
    setTimeout(() => onAnswer(opt === current.fr), 700);
  }

  return (
    <div className="panel card-view">
      <h3>{current.en}</h3>
      <div className="option-grid">
        {options.map((opt) => (
          <button
            key={opt}
            className={`option ${
              picked
                ? opt === current.fr
                  ? "correct"
                  : opt === picked
                  ? "incorrect"
                  : ""
                : ""
            }`}
            onClick={() => pick(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Typing({ current, onAnswer }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);

  function submit(e) {
    e.preventDefault();
    if (result) return;
    const ok = normalize(value) === normalize(current.fr);
    setResult(ok);
    setTimeout(() => onAnswer(ok), 900);
  }

  return (
    <div className="panel card-view">
      <h3>{current.en}</h3>
      <form onSubmit={submit}>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Traduction en français"
          disabled={result !== null}
        />
        <button className="cta" type="submit" disabled={result !== null}>Valider</button>
      </form>
      {result !== null && (
        <p className={result ? "success" : "error"}>
          {result ? "Correct !" : `Réponse attendue : ${current.fr}`}
        </p>
      )}
    </div>
  );
}

function MatchMode({ pool, onBatchDone }) {
  const words = pool;
  const [leftOrder] = useState(() => shuffle(words));
  const [rightOrder] = useState(() => shuffle(words));
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matched, setMatched] = useState({});
  const [results, setResults] = useState([]);

  function clickLeft(w) {
    if (matched[w.id]) return;
    setSelectedLeft(w);
  }

  function clickRight(w) {
    if (!selectedLeft || matched[selectedLeft.id]) return;
    const ok = selectedLeft.id === w.id;
    const newMatched = { ...matched, [selectedLeft.id]: ok ? "correct" : "incorrect" };
    setMatched(newMatched);
    const newResults = [...results, { id: selectedLeft.id, correct: ok }];
    setResults(newResults);
    setSelectedLeft(null);
    if (newResults.length === words.length) {
      setTimeout(() => onBatchDone(newResults), 500);
    }
  }

  return (
    <div className="panel card-view">
      <h3>Associe chaque mot à sa traduction</h3>
      <div className="match-grid">
        <div className="match-col">
          {leftOrder.map((w) => (
            <button
              key={w.id}
              className={`option ${selectedLeft?.id === w.id ? "selected" : ""} ${
                matched[w.id] || ""
              }`}
              onClick={() => clickLeft(w)}
              disabled={!!matched[w.id]}
            >
              {w.en}
            </button>
          ))}
        </div>
        <div className="match-col">
          {rightOrder.map((w) => (
            <button
              key={w.id}
              className={`option ${matched[w.id] || ""}`}
              onClick={() => clickRight(w)}
              disabled={!!matched[w.id]}
            >
              {w.fr}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Flashcard({ current, onAnswer }) {
  const [flipped, setFlipped] = useState(false);

  function answer(isCorrect) {
    onAnswer(isCorrect);
    setFlipped(false);
  }

  return (
    <div className="panel card-view">
      <div className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
        <div className="flashcard-inner">
          <div className="flashcard-face front">{current.en}</div>
          <div className="flashcard-face back">{current.fr}</div>
        </div>
      </div>
      <p className="muted center">Clique sur la carte pour la retourner</p>
      {flipped && (
        <div className="flash-actions">
          <button className="option incorrect" onClick={() => answer(false)}>Je ne savais pas</button>
          <button className="option correct" onClick={() => answer(true)}>Je savais !</button>
        </div>
      )}
    </div>
  );
}
