import {
  workLogPostSchema,
  workLogPostType,
} from "@/types/worklog/worklogTypes";
import { createClient } from "../req/client";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost";
const WORKLOG_PORT = process.env.NEXT_PUBLIC_WORKLOG_PORT;

const client = createClient(API_BASE);
export async function submitWorkLog(data: workLogPostType) {
  const res = await client.post(
    // const res = await axios.post(
    // `${API_BASE}:${WORKLOG_PORT}/worklog/api`,
    `http://localhost:9081/worklog/api`,
    data,
  );
  return res.data;
}
export async function getWorkLog(authorName: string | undefined) {
  try {
    if (authorName) {
      const res = await client.get(
        // `${API_BASE}:${WORKLOG_PORT}/worklog/api/author/${authorName}`,
        `http://localhost:9081/worklog/api/author/${authorName}`,
      );

      return res.data;
    }
    return [];
  } catch (err: any) {
    if (err.response?.status === 404) {
      return [];
    }
    throw err;
  }
}
