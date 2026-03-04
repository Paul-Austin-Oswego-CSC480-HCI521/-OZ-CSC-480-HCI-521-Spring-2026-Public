import {
  workLogPostSchema,
  workLogPostType,
} from "@/types/worklog/worklogTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function submitWorkLog(data: workLogPostType) {
  const res = await fetch(`${API_BASE}/api/worklogs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to submit work log");
  }

  return res.json();
}
