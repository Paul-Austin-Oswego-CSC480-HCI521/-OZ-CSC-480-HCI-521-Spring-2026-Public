import { atom } from "jotai";

const getSessionId = (): string => {
  if (typeof window === "undefined") return "";
  const key = "csc_480_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
};

export const sessionIdAtom = atom<string>(getSessionId());
