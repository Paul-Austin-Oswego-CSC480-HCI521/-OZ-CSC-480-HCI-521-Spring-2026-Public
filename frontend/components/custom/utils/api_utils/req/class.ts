import { createClient } from "./client";
import { env } from "next-runtime-env";

const getAuthClient = () => {
  const AUTH_URL =
    env("NEXT_PUBLIC_AUTH_API_URL") || "http://localhost:9084/auth/api";
  return createClient(AUTH_URL);
};

export interface InactiveStudent {
  email: string;
  name?: string;
  classStanding?: string | null;
  team?: string[];
}

export interface StudentClass {
  classID: string;
  semesterStartDate: string;
  semsesterEndDate: string;
  studendAccessEndDate: string;
  isArchived?: boolean;
  students?: unknown[];
  instructors?: string[];
  inactiveStudents?: InactiveStudent[];
}

export interface ClassUser {
  _id?: { $oid: string } | string;
  email: string;
  name: string;
  role: string;
  preferredName?: string;
  team?: string[];
  classID?: string;
  classStanding?: string;
  isArchived?: boolean;
}

export async function createClass(data: StudentClass, instructorEmail: string) {
  const res = await getAuthClient().post(
    `/auth/class/create/${encodeURIComponent(instructorEmail)}`,
    data,
  );
  return res.data as StudentClass | null;
}

export async function getClasses() {
  const res = await getAuthClient().get("/auth/classes");
  return res.data as StudentClass[];
}

export async function getClass(classID: string) {
  const res = await getAuthClient().get(
    `/auth/class/${encodeURIComponent(classID)}`,
  );
  return res.data as StudentClass;
}

export async function updateClass(
  classID: string,
  updates: Partial<
    Pick<
      StudentClass,
      "semesterStartDate" | "semsesterEndDate" | "studendAccessEndDate"
    >
  >,
) {
  const res = await getAuthClient().put(
    `/auth/class/update/${encodeURIComponent(classID)}`,
    updates,
  );
  return res.data as StudentClass;
}

export async function archiveClass(classID: string) {
  const res = await getAuthClient().put(
    `/auth/class/archive/${encodeURIComponent(classID)}`,
  );
  return res.data as StudentClass;
}

export async function getAllUsers() {
  const res = await getAuthClient().get("/auth/users");
  return res.data as ClassUser[];
}

export async function enrollUser(email: string, classID: string) {
  const res = await getAuthClient().put(
    `/auth/users/class/${encodeURIComponent(email)}`,
    classID,
    {
      headers: { "Content-Type": "application/json" },
      transformRequest: [(data) => data],
    },
  );
  return res.data;
}

export async function unenrollUser(email: string) {
  const res = await getAuthClient().delete(
    `/auth/users/class/${encodeURIComponent(email)}`,
  );
  return res.data;
}

export async function promoteToCoInstructor(email: string) {
  const res = await getAuthClient().put(
    `/auth/instructor/create/${encodeURIComponent(email)}`,
  );
  return res.data;
}

export async function demoteFromInstructor(email: string) {
  const res = await getAuthClient().put(
    `/auth/instructor/remove/${encodeURIComponent(email)}`,
  );
  return res.data;
}
