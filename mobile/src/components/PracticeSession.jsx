import React, { useMemo, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { getCollections, getDueWords, recordAnswer, recordReview, addSession } from "../data/storage";
import { pickRandom, shuffle, normalize } from "../utils";
import { colors, shadow } from "../theme";
import SpeakButton from "./SpeakButton";

const QUEUE_SIZE = 15;

function buildPool(state, scope) {
  if (scope === "due") return pickRandom(getDueWords(state), QUEUE_SIZE);
  const collections = getCollections(state);
  const words = scope === "all" ? Object.values(state.words) : collections[scope];
  return pickRandom(words, Math.min(QUEUE_SIZE, words.length));
}

export default function PracticeSession({ state, setState, mode, scope, onFinish }) {
  const startRef = useRef(Date.now());
  const pool = useMemo(() => buildPool(state, scope), []); // eslint-disable-line
  const allWords = useMemo(() => Object.values(state.words), []); // eslint-disable-line

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const current = pool[index];

  function haptic(isCorrect) {
    Haptics.notificationAsync(
      isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    ).catch(() => {});
  }

  function handleAnswer(isCorrect) {
    haptic(isCorrect);
    setState((prev) => recordAnswer(prev, current.id, isCorrect));
    if (isCorrect) setCorrectCount((c) => c + 1);
    if (index + 1 >= pool.length) {
      finish(isCorrect ? correctCount + 1 : correctCount);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function handleReview(grade) {
    const isCorrect = grade === "good" || grade === "easy";
    haptic(isCorrect);
    setState((prev) => recordReview(prev, current.id, grade));
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
        <Text style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>🎉</Text>
        <Text style={{ textAlign: "center" }}>
          {scope === "due" ? "Rien à réviser pour l'instant, reviens plus tard !" : "Pas assez de mots dans cette collection."}
        </Text>
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
        <View style={[s.panel, shadow, { alignItems: "center" }]}>
          <Text style={{ fontSize: 44 }}>{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪"}</Text>
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
      {mode === "listening" && <Listening current={current} allWords={allWords} onAnswer={handleAnswer} />}
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
      {mode === "flashcards" && <Flashcard current={current} onReview={handleReview} />}
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
    <View style={[s.panel, shadow]}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>{current.en}</Text>
        <SpeakButton text={current.en} />
      </View>
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

function Listening({ current, allWords, onAnswer }) {
  const options = useMemo(() => {
    const distractors = pickRandom(allWords.filter((w) => w.id !== current.id), 3).map((w) => w.en);
    return shuffle([current.en, ...distractors]);
  }, [current.id]); // eslint-disable-line

  const [picked, setPicked] = useState(null);

  function replay() {
    Speech.stop();
    Speech.speak(current.en, { language: "en-US", pitch: 1, rate: 0.85 });
  }

  React.useEffect(() => {
    replay();
  }, [current.id]); // eslint-disable-line

  function pick(opt) {
    if (picked) return;
    setPicked(opt);
    setTimeout(() => onAnswer(opt === current.en), 700);
  }

  return (
    <View style={[s.panel, shadow]}>
      <Text style={s.muted}>Traduction : {current.fr}</Text>
      <TouchableOpacity style={s.listenBtn} onPress={replay}>
        <Ionicons name="volume-high" size={28} color={colors.primary} />
      </TouchableOpacity>
      <View style={s.optionGrid}>
        {options.map((opt) => {
          let style = s.option;
          if (picked) {
            if (opt === current.en) style = [s.option, s.optionCorrect];
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
    <View style={[s.panel, shadow]}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>{current.en}</Text>
        <SpeakButton text={current.en} />
      </View>
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
    <View style={[s.panel, shadow]}>
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

function Flashcard({ current, onReview }) {
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  function flip() {
    Animated.timing(anim, {
      toValue: flipped ? 0 : 180,
      duration: 350,
      useNativeDriver: true,
    }).start();
    setFlipped((f) => !f);
  }

  function review(grade) {
    onReview(grade);
    anim.setValue(0);
    setFlipped(false);
  }

  const frontInterpolate = anim.interpolate({ inputRange: [0, 180], outputRange: ["0deg", "180deg"] });
  const backInterpolate = anim.interpolate({ inputRange: [0, 180], outputRange: ["180deg", "360deg"] });

  return (
    <View style={[s.panel, shadow, { alignItems: "center" }]}>
      <Pressable onPress={flip} style={{ width: "100%" }}>
        <Animated.View style={[s.flashFace, { transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }] }]}>
          <Text style={s.flashText}>{current.en}</Text>
          <SpeakButton text={current.en} style={{ marginTop: 10 }} />
        </Animated.View>
        <Animated.View
          style={[
            s.flashFace,
            s.flashBack,
            { transform: [{ perspective: 1000 }, { rotateY: backInterpolate }] },
          ]}
        >
          <Text style={[s.flashText, { color: colors.primary }]}>{current.fr}</Text>
        </Animated.View>
      </Pressable>
      <Text style={s.muted}>Touche la carte pour la retourner</Text>
      {flipped && (
        <View style={s.gradeRow}>
          <TouchableOpacity style={[s.gradeBtn, { backgroundColor: colors.badBg }]} onPress={() => review("again")}>
            <Text style={s.gradeText}>Encore</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.gradeBtn, { backgroundColor: colors.warnBg }]} onPress={() => review("hard")}>
            <Text style={s.gradeText}>Difficile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.gradeBtn, { backgroundColor: colors.goodBg }]} onPress={() => review("good")}>
            <Text style={s.gradeText}>Bien</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.gradeBtn, { backgroundColor: colors.primaryLight }]} onPress={() => review("easy")}>
            <Text style={s.gradeText}>Facile</Text>
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
  muted: { color: colors.muted, fontSize: 13, marginBottom: 8, textAlign: "center" },
  panel: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 16 },
  cardHeader: { alignItems: "center", marginBottom: 20, gap: 10 },
  cardTitle: { fontSize: 26, fontWeight: "700", textAlign: "center" },
  listenBtn: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
  },
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
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 12 },
  cta: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center" },
  ctaText: { color: "white", fontWeight: "700", fontSize: 16 },
  success: { color: colors.good, fontWeight: "600", marginTop: 10, textAlign: "center" },
  error: { color: colors.bad, fontWeight: "600", marginTop: 10, textAlign: "center" },
  progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 999, marginBottom: 6, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.primary },
  flashFace: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
  },
  flashBack: { position: "absolute", top: 0 },
  flashText: { fontSize: 26, fontWeight: "700" },
  gradeRow: { flexDirection: "row", gap: 8, marginTop: 14, width: "100%" },
  gradeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  gradeText: { fontWeight: "700", fontSize: 12 },
});
