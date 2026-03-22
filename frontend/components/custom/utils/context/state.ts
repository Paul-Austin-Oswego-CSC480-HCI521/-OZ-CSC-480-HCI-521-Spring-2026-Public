import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

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

export const userAtom = atom<{
  id: string;
  email: string;
  role: string;
} | null>(null);

export const tokenAtom = atomWithStorage<string | null>("csc_480_token", null);

export const sessionIdAtom = atom<string>(getSessionId());
