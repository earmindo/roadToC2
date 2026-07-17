import { IRREGULAR_VERBS } from "./irregularVerbs";
import { COMMON_WORDS } from "./commonWords";

const STORAGE_KEY = "vocabmaster_state_v1";

// Leitner-like boxes: 0 (new) .. 5 (mastered)
const BOX_MASTERED_THRESHOLD = 4;
const MIN_ATTEMPTS_FOR_STATUS = 3;

function defaultStats() {
  return {
    box: 0,
    seen: 0,
    correct: 0,
    incorrect: 0,
    lastSeen: null,
    streak: 0,
  };
}

function buildInitialWords() {
  const all = [...IRREGULAR_VERBS, ...COMMON_WORDS];
  const words = {};
  for (const w of all) {
    words[w.id] = { ...w, custom: false, stats: defaultStats() };
  }
  return words;
}

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const state = {
      words: buildInitialWords(),
      sessions: [], // { start, end, mode, correct, total }
      createdAt: Date.now(),
    };
    saveState(state);
    return state;
  }
  try {
    const parsed = JSON.parse(raw);
    // Merge in any new builtin words added in app updates without wiping user progress
    const builtinAll = [...IRREGULAR_VERBS, ...COMMON_WORDS];
    for (const w of builtinAll) {
      if (!parsed.words[w.id]) {
        parsed.words[w.id] = { ...w, custom: false, stats: defaultStats() };
      }
    }
    return parsed;
  } catch {
    const state = { words: buildInitialWords(), sessions: [], createdAt: Date.now() };
    saveState(state);
    return state;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function addCustomWord(state, en, fr, category = "custom") {
  const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const words = {
    ...state.words,
    [id]: { id, en, fr, category, custom: true, stats: defaultStats() },
  };
  return { ...state, words };
}

export function deleteWord(state, id) {
  const words = { ...state.words };
  delete words[id];
  return { ...state, words };
}

export function recordAnswer(state, id, isCorrect) {
  const words = { ...state.words };
  const w = words[id];
  if (!w) return state;
  const stats = { ...w.stats };
  stats.seen += 1;
  stats.lastSeen = Date.now();
  if (isCorrect) {
    stats.correct += 1;
    stats.streak += 1;
    stats.box = Math.min(5, stats.box + 1);
  } else {
    stats.incorrect += 1;
    stats.streak = 0;
    stats.box = Math.max(0, stats.box - 1);
  }
  words[id] = { ...w, stats };
  return { ...state, words };
}

// Determine the derived collection of a word: mastered / struggling / new
export function getWordStatus(w) {
  if (w.category === "irregularVerbs") return "irregularVerbs";
  const { seen, correct, box } = w.stats;
  if (seen < MIN_ATTEMPTS_FOR_STATUS) return "newWords";
  const rate = correct / seen;
  if (box >= BOX_MASTERED_THRESHOLD && rate >= 0.75) return "mastered";
  if (rate < 0.5 || box <= 1) return "struggling";
  return "newWords";
}

export function getCollections(state) {
  const collections = {
    irregularVerbs: [],
    mastered: [],
    struggling: [],
    newWords: [],
  };
  for (const w of Object.values(state.words)) {
    const status = getWordStatus(w);
    collections[status].push(w);
  }
  return collections;
}

export function getGlobalStats(state) {
  const words = Object.values(state.words);
  let seen = 0, correct = 0, incorrect = 0;
  for (const w of words) {
    seen += w.stats.seen;
    correct += w.stats.correct;
    incorrect += w.stats.incorrect;
  }
  const collections = getCollections(state);
  const totalPracticeMs = state.sessions.reduce(
    (sum, s) => sum + (s.end - s.start), 0
  );
  return {
    totalWords: words.length,
    seen,
    correct,
    incorrect,
    accuracy: seen > 0 ? Math.round((correct / seen) * 100) : 0,
    masteredCount: collections.mastered.length,
    strugglingCount: collections.struggling.length,
    newCount: collections.newWords.length,
    irregularCount: collections.irregularVerbs.length,
    totalPracticeMs,
    sessionsCount: state.sessions.length,
  };
}

export function getWeakestWords(state, limit = 10) {
  const words = Object.values(state.words).filter((w) => w.stats.seen > 0);
  return words
    .map((w) => ({ ...w, rate: w.stats.correct / w.stats.seen }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, limit);
}

export function addSession(state, session) {
  return { ...state, sessions: [...state.sessions, session] };
}
