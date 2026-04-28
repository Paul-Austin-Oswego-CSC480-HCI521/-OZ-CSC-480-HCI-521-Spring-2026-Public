import axios from "axios";
import { createClient } from "./client";
import { env } from "next-runtime-env";
import { getDefaultStore } from "jotai";
import { tokenAtom } from "../../context/state";

export async function googleSignIn(credential: string, role?: string) {
  const AUTH_URL = env("NEXT_PUBLIC_AUTH_API_URL") || "http://localhost:9084/auth/api";
  const client = createClient(AUTH_URL);

  const res = await client.post("/auth/login", {
    token_id: credential,
    role,
  });

  return res.data as {
    token: string;
    role: string;
    email: string;
    name: string;
    id: string;
    classID : string
  };
}

export async function getUsersFromClass(classID : string) {
  const AUTH_URL = env("NEXT_PUBLIC_AUTH_API_URL") || "http://localhost:9084/auth/api";
  const client = createClient(AUTH_URL);
  const res = await client.get(`/auth/users/class/${classID}`);
  return res.data;
}

export async function logout() {
  const AUTH_URL = env("NEXT_PUBLIC_AUTH_API_URL") || "http://localhost:9084/auth/api";
  try {
    await axios.post(`${AUTH_URL}/auth/logout`, {}, { withCredentials: true });
  } catch {
    // logout best-effort — continue clearing local state even if it fails
  }
}

function authClient() {
  const AUTH_URL =
    env("NEXT_PUBLIC_AUTH_API_URL") || "http://localhost:9084/auth/api";
  return createClient(AUTH_URL);
}

export async function updatePreferredName(email: string, preferredName: string) {
  const res = await authClient().put(
    `/auth/user/updatePreferredName/${encodeURIComponent(email)}/${encodeURIComponent(preferredName)}`,
  );
  return res.data;
}

export async function addUserTeam(email: string, team: string) {
  const res = await authClient().put(
    `/auth/user/addTeam/${encodeURIComponent(email)}/${encodeURIComponent(team)}`,
  );
  return res.data;
}

export async function removeUserTeam(email: string, team: string) {
  const res = await authClient().put(
    `/auth/user/removeTeam/${encodeURIComponent(email)}/${encodeURIComponent(team)}`,
  );
  return res.data;
}

export async function updateUserStanding(email: string, classStanding: string) {
  const res = await authClient().put(
    `/auth/user/updateStanding/${encodeURIComponent(email)}/${encodeURIComponent(classStanding)}`,
  );
  return res.data;
}

export async function refreshToken() {
  const AUTH_URL =
    env("NEXT_PUBLIC_AUTH_API_URL") || "http://localhost:9084/auth/api";
  const res = await axios.post(
    `${AUTH_URL}/auth/refresh`,
    {},
    { withCredentials: true },
  );
  const newToken = res.data.token as string;
  if (newToken) {
    localStorage.setItem("csc_480_token", JSON.stringify(newToken));
    getDefaultStore().set(tokenAtom, newToken);
    document.cookie = `token=${newToken}; path=/;`;
  }
  return newToken;
}