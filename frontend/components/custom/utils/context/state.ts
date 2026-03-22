import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const userAtom = atom((get) => {
  const token = get(tokenAtom);
  if (!token) return null;
  const payload = JSON.parse(atob(token.split(".")[1]));
  console.log(payload);
  return {
    id: payload.id as string,
    email: payload.email as string,
    role: payload.role as string,
    name: payload.name as string,
  };
});
export const tokenAtom = atomWithStorage<string | null>("csc_480_token", null);
