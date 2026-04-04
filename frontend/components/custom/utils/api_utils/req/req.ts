import axios from "axios";
import { createClient } from "./client";
import { env } from "next-runtime-env";

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
  };
}

export async function logout() {
  const AUTH_URL = env("NEXT_PUBLIC_AUTH_API_URL") || "http://localhost:9084/auth/api";
  try {
    await axios.post(`${AUTH_URL}/auth/logout`, {}, { withCredentials: true });
  } catch {
    // logout best-effort — continue clearing local state even if it fails
  }
}