import React, { useMemo, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { getCollections, recordAnswer, addSession } from "../data/storage";
import { pickRandom, shuffle, normalize } from "../utils";
import { colors } from "../theme";

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
      addSession(prev, { start: startRef.current, end: Date.now(), mode, correct: finalCorrect, total: pool.length })
    );
  }

  if (pool.length === 0) {
    return (
      <View style={s.view}>
        <Text>Pas assez de mots dans cette collection.</Text>
        <TouchableOpacity style={s.cta} onPress={() => onFinish()}>
          <Text style={s.ctaText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (done) {
    const pct = Math.round((correctCount / pool.length) * 100);
    return (
      <View style={s.view}>
        <Text style={s.h2}>Session terminée !</Text>
        <View style={[s.panel, { alignItems: "center" }]}>
          <Text style={{ fontSize: 40, fontWeight: "700", color: colors.primary }}>{pct}%</Text>
          <Text>{correctCount} / {pool.length} bonnes réponses</Text>
        </View>
        <TouchableOpacity style={s.cta} onPress={() => onFinish()}>
          <Text style={s.ctaText}>Retour au tableau de bord</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.view}>
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${(index / pool.length) * 100}%` }]} />
      </View>
      <Text style={s.muted}>{index + 1} / {pool.length}</Text>

      {mode === "mcq" && <MCQ current={current} allWords={allWords} onAnswer={handleAnswer} />}
      {mode === "typing" && <Typing current={current} onAnswer={handleAnswer} />}
      {mode === "match" && (
        <MatchMode
          pool={pool.slice(index, index + 4).length >= 4 ? pool.slice(index, index + 4) : pool.slice(0, 4)}
          onBatchDone={(results) => {
            setState((prev) => {
              let next = prev;
              for (const r of results) next = recordAnswer(next, r.id, r.correct);
              return next;
            });
            const gained = results.filter((r) => r.correct).length;
            const newCorrect = correctCount + gained;
            setCorrectCount(newCorrect);
            const nextIndex = index + results.length;
            if (nextIndex >= pool.length) finish(newCorrect);
            else setIndex(nextIndex);
          }}
        />
      )}
      {mode === "flashcards" && <Flashcard current={current} onAnswer={handleAnswer} />}
    </View>
  );
}

function MCQ({ current, allWords, onAnswer }) {
  const options = useMemo(() => {
    const distractors = pickRandom(allWords.filter((w) => w.id !== current.id), 3).map((w) => w.fr);
    return shuffle([current.fr, ...distractors]);
  }, [current.id]); // eslint-disable-line

  const [picked, setPicked] = useState(null);

  function pick(opt) {
    if (picked) return;
    setPicked(opt);
    setTimeout(() => onAnswer(opt === current.fr), 700);
  }

  return (
    <View style={s.panel}>
      <Text style={s.cardTitle}>{current.en}</Text>
      <View style={s.optionGrid}>
        {options.map((opt) => {
          let style = s.option;
          if (picked) {
            if (opt === current.fr) style = [s.option, s.optionCorrect];
            else if (opt === picked) style = [s.option, s.optionIncorrect];
          }
          return (
            <TouchableOpacity key={opt} style={style} onPress={() => pick(opt)}>
              <Text>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Typing({ current, onAnswer }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);

  function submit() {
    if (result !== null) return;
    const ok = normalize(value) === normalize(current.fr);
    setResult(ok);
    setTimeout(() => onAnswer(ok), 900);
  }

  return (
    <View style={s.panel}>
      <Text style={s.cardTitle}>{current.en}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={setValue}
        placeholder="Traduction en français"
        editable={result === null}
        onSubmitEditing={submit}
        autoFocus
      />
      <TouchableOpacity style={s.cta} onPress={submit} disabled={result !== null}>
        <Text style={s.ctaText}>Valider</Text>
      </TouchableOpacity>
      {result !== null && (
        <Text style={result ? s.success : s.error}>
          {result ? "Correct !" : `Réponse attendue : ${current.fr}`}
        </Text>
      )}
    </View>
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
    setMatched({ ...matched, [selectedLeft.id]: ok ? "correct" : "incorrect" });
    const newResults = [...results, { id: selectedLeft.id, correct: ok }];
    setResults(newResults);
    setSelectedLeft(null);
    if (newResults.length === words.length) setTimeout(() => onBatchDone(newResults), 500);
  }

  return (
    <View style={s.panel}>
      <Text style={s.h3}>Associe chaque mot à sa traduction</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1, gap: 8 }}>
          {leftOrder.map((w) => {
            let style = [s.option];
            if (selectedLeft?.id === w.id) style.push(s.optionSelected);
            if (matched[w.id] === "correct") style.push(s.optionCorrect);
            if (matched[w.id] === "incorrect") style.push(s.optionIncorrect);
            return (
              <TouchableOpacity key={w.id} style={style} onPress={() => clickLeft(w)} disabled={!!matched[w.id]}>
                <Text>{w.en}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          {rightOrder.map((w) => {
            let style = [s.option];
            if (matched[w.id] === "correct") style.push(s.optionCorrect);
            if (matched[w.id] === "incorrect") style.push(s.optionIncorrect);
            return (
              <TouchableOpacity key={w.id} style={style} onPress={() => clickRight(w)} disabled={!!matched[w.id]}>
                <Text>{w.fr}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Flashcard({ current, onAnswer }) {
  const [flipped, setFlipped] = useState(false);

  function answer(isCorrect) {
    onAnswer(isCorrect);
    setFlipped(false);
  }

  return (
    <View style={[s.panel, { alignItems: "center" }]}>
      <Pressable style={s.flashcard} onPress={() => setFlipped((f) => !f)}>
        <Text style={s.flashcardText}>{flipped ? current.fr : current.en}</Text>
      </Pressable>
      <Text style={s.muted}>Touche la carte pour la retourner</Text>
      {flipped && (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10, width: "100%" }}>
          <TouchableOpacity style={[s.option, s.optionIncorrect, { flex: 1, alignItems: "center" }]} onPress={() => answer(false)}>
            <Text>Je ne savais pas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.option, s.optionCorrect, { flex: 1, alignItems: "center" }]} onPress={() => answer(true)}>
            <Text>Je savais !</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  view: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  h2: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  h3: { fontSize: 16, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  muted: { color: colors.muted, fontSize: 13, marginBottom: 8 },
  panel: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  option: {
    width: "47%",
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionCorrect: { borderColor: colors.good, backgroundColor: colors.goodBg },
  optionIncorrect: { borderColor: colors.bad, backgroundColor: colors.badBg },
  optionSelected: { borderColor: colors.primary, backgroundColor: "#eef2ff" },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 12 },
  cta: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center" },
  ctaText: { color: "white", fontWeight: "700", fontSize: 16 },
  success: { color: colors.good, fontWeight: "600", marginTop: 10, textAlign: "center" },
  error: { color: colors.bad, fontWeight: "600", marginTop: 10, textAlign: "center" },
  progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 999, marginBottom: 6, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.primary },
  flashcard: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  flashcardText: { fontSize: 26, fontWeight: "700", color: colors.primary },
});
