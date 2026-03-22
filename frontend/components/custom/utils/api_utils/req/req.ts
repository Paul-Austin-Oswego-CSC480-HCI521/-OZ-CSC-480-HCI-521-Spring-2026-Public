import axios from "axios";
import { createClient } from "./client";

export async function googleSignIn(credential: string, role?: string) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const AUTHPORT = process.env.NEXT_PUBLIC_AUTH_PORT;
  const client = createClient(BASE_URL || "http://localhost");
  const res = await client.post(`${BASE_URL}:${AUTHPORT}/auth/api/auth/login`, {
    token_id: credential,
    role,
  });
  const data = await res.data;

  // return data;
  console.log(data);

  return data as {
    token: string;
    role: string;
    email: string;
    name: string;
    id: string;
  };
}
