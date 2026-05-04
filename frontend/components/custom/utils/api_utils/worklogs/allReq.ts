import { workLogPostType } from "@/types/worklog/worklogTypes";
import { createClient } from "../req/client";
import { env } from "next-runtime-env";

const WORKLOG_API_URL = env("NEXT_PUBLIC_WORKLOGS_API_URL") || "http://localhost:9081/worklog/api";

const client = createClient(WORKLOG_API_URL);

export async function submitWorkLog(data: workLogPostType) {
  const res = await client.post(`${WORKLOG_API_URL}`, data);
  return res.data;
}

export async function getWorkLog(authorEmail: string | undefined) {
  if (!authorEmail) return [];
  try {
    const all = await getAllWorkLogs();
    return (all ?? []).filter((l: any) => l.authorEmail === authorEmail);
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

export async function getWorklogsForClass(classID: string) {
  try {
    const res = await client.get(`${WORKLOG_API_URL}/class/${encodeURIComponent(classID)}`);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404) return [];
    throw err;
  }
}

export async function updateWorklog(id: string, data: any, classID?: string) {
  const url = classID
    ? `${WORKLOG_API_URL}/id/${id}?classID=${encodeURIComponent(classID)}`
    : `${WORKLOG_API_URL}/id/${id}`;
  const res = await client.put(url, data);
  return res.data;
}

export async function saveDraft(data: workLogPostType) {
  const res = await client.put(`${WORKLOG_API_URL}/draft`, data);
  return res.data;
}

export async function deleteWorklog(id: string) {
  const res = await client.delete(`${WORKLOG_API_URL}/id/${id}`);
  return res.data;
}

export async function getDrafts() {
  try {
    const res = await client.get(`${WORKLOG_API_URL}/draft`);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404) return [];
    throw err;
  }
}

export async function getDraftForWeek(
  authorEmail: string | undefined,
  worklogName: string | undefined,
) {
  if (!authorEmail || !worklogName) return null;
  try {
    const all = await getDrafts();
    return (
      (all ?? []).find(
        (d: any) =>
          d.authorEmail === authorEmail &&
          String(d.worklogName) === String(worklogName),
      ) ?? null
    );
  } catch {
    return null;
  }
}