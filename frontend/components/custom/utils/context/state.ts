import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { workLogPostType } from "@/types/worklog/worklogTypes";

export const userAtom = atom((get) => {
  const token = get(tokenAtom);
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as string,
      name: payload.name as string,
      classID: payload.classID as string,
      preferredName: (payload.preferredName as string | undefined) ?? "",
      team: (payload.team as string[] | undefined) ?? [],
    };
  } catch {
    return null;
  }
});

export const worklogEditAtom = atom<{
  mode: "new" | "resubmit";
  weekNumber: string;
  tasks?: any[];
  previousSubmissions?: any[];
} | null>(null);

export const pendingWorklogAtom = atom<workLogPostType | null>(null);

export const tokenAtom = atomWithStorage<string | null>(
  "csc_480_token",
  null,
);
