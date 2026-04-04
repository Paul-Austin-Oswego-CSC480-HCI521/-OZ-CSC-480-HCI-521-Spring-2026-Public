import {
  workLogPostSchema,
  workLogPostType,
} from "@/types/worklog/worklogTypes";
import { createClient } from "../req/client";
import axios from "axios";
import { env } from "next-runtime-env";

const API_BASE = env("NEXT_PUBLIC_BASE_URL") || "http://localhost";
const WORKLOG_PORT = env("NEXT_PUBLIC_WORKLOG_PORT") || "9081";

const client = createClient(API_BASE);
export async function submitWorkLog(data: workLogPostType) {
  const res = await client.post(
    // const res = await axios.post(
    `${API_BASE}:${WORKLOG_PORT}/worklog/api`,
    // `http://localhost:9081/worklog/api`,
    data,
  );
  return res.data;
}
export async function getWorkLog(authorName: string | undefined) {
  if (!authorName) return [];
  try {
    const res = await client.get(
      `${API_BASE}:${WORKLOG_PORT}/worklog/api/author/${encodeURIComponent(authorName)}`,
    );
    const data = res.data;
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err.response?.status === 404) {
      return [];
    }
    throw err;
  }
}

export async function getAllWorkLogs() {
  try {
    const res = await client.get(`${API_BASE}:${WORKLOG_PORT}/worklog/api`);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404) {
      return [];
    }
    throw err;
  }
}
