import { atom } from "jotai";

const generateId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

const getSessionId = (): string => {
  if (typeof window === "undefined") return "";
  const key = "csc_480_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = generateId();
    localStorage.setItem(key, id);
  }
  return id;
};

export const sessionIdAtom = atom<string>(getSessionId());
