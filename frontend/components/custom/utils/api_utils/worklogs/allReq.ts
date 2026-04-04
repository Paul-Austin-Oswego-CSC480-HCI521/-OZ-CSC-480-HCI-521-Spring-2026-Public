import { workLogPostType } from "@/types/worklog/worklogTypes";
import { createClient } from "../req/client";
import { env } from "next-runtime-env";

const WORKLOG_API_URL = env("NEXT_PUBLIC_WORKLOGS_API_URL") || "http://localhost:9081/worklog/api";

const client = createClient(WORKLOG_API_URL);

export async function submitWorkLog(data: workLogPostType) {
  const res = await client.post(`${WORKLOG_API_URL}`, data);
  return res.data;
}

export async function getWorkLog(authorName: string | undefined) {
  if (!authorName) return [];
  try {
    const res = await client.get(`${WORKLOG_API_URL}/author/${authorName}`);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404) return [];
    throw err;
  }
}

export async function getAllWorkLogs() {
  try {
    const res = await client.get(`${WORKLOG_API_URL}`);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404) return [];
    throw err;
  }
}