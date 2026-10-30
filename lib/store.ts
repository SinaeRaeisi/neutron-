"use client";
import { useEffect, useState } from "react";
import type { Attempt, Question, Quiz } from "./types";
import { quizzes as demoQuizzes } from "./data";

const KEY = "neutron.state.v1";

interface State {
  attempts: Attempt[];
  customQuestions: Question[];
  customQuizzes: Quiz[];
}

const EMPTY: State = { attempts: [], customQuestions: [], customQuizzes: [] };

function safeLoad(): State {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<State>;
    return {
      attempts: Array.isArray(p.attempts) ? p.attempts : [],
      customQuestions: Array.isArray(p.customQuestions) ? p.customQuestions : [],
      customQuizzes: Array.isArray(p.customQuizzes) ? p.customQuizzes : [],
    };
  } catch { return EMPTY; }
}

function save(s: State) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("neutron:change"));
}

export function getAttempts(): Attempt[] { return safeLoad().attempts; }
export function addAttempt(a: Attempt) {
  const s = safeLoad(); s.attempts = [a, ...s.attempts]; save(s);
}

export function getCustomQuestions(): Question[] { return safeLoad().customQuestions; }
export function addCustomQuestion(q: Question) {
  const s = safeLoad(); s.customQuestions = [q, ...s.customQuestions]; save(s);
}

export function getCustomQuizzes(): Quiz[] { return safeLoad().customQuizzes; }
export function addCustomQuiz(q: Quiz) {
  const s = safeLoad(); s.customQuizzes = [q, ...s.customQuizzes]; save(s);
}

export function getAllQuizzes(): Quiz[] {
  return [...demoQuizzes, ...getCustomQuizzes()];
}

export function useNeutronStore<T>(selector: () => T, emptyValue: T): T {
  const [value, setValue] = useState<T>(emptyValue);
  useEffect(() => {
    const sync = () => {
      try { setValue(selector()); } catch { setValue(emptyValue); }
    };
    sync();
    window.addEventListener("neutron:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("neutron:change", sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}