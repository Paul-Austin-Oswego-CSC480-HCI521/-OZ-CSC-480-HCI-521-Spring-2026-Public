import {
  workLogPostSchema,
  workLogPostType,
} from "@/types/worklog/worklogTypes";
import { createClient } from "../req/client";
import axios from "axios";
import { env } from "next-runtime-env";

const API_BASE = env("NEXT_PUBLIC_BASE_URL") || "http://localhost";
const WORKLOG_PORT = env("NEXT_PUBLIC_WORKLOG_PORT");

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
  try {
    const res = await client.get(
      `${API_BASE}:${WORKLOG_PORT}/worklog/api/author/${authorName}`,
      // `http://localhost:9081/worklog/api/author/${authorName}`,
    );

    return res.data;

    return [];
  } catch (err: any) {
    if (err.response?.status === 404) {
      return err;
    }
    throw err;
  }
}

export async function getAllWorkLogs() {
  try {
    const res = await client.get(`http://localhost:9081/worklog/api`);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404) {
      return err;
    }
    throw err;
  }
}
