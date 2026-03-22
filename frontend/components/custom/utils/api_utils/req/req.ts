import { createClient } from "./client";

export async function googleSignIn(credential: string, role?: string) {
  const client = createClient(
    `${process.env.NEXT_PUBLIC_BASE_URL}:${process.env.NEXT_PUBLIC_AUTH_PORT}`,
  );
  const res = await client.post("/api/auth/login", { credential, role });
  console.log(res);
  return res.data as {
    token: string;
    user: { id: string; email: string; role: string };
  };
}
