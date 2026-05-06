"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { isInstructorRole, userAtom } from "@/components/custom/utils/context/state";
import {
  ClassUser,
  getAllUsers,
  getClass,
  StudentClass,
} from "@/components/custom/utils/api_utils/req/class";
import { getWorklogsForClass } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/custom/ui/Breadcrumbs";
import {
  Archive,
  Calendar,
  CheckCircle2,
  CircleDot,
  LayoutGrid,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";

const BRAND_GREEN = "#1E4B35";
const BRAND_AMBER_TINT = "#FCEBD3";

type SplitName = { first: string; last: string };

function splitName(full: string | undefined): SplitName {
  if (!full) return { first: "", last: "" };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

function teamChipClasses(team: string): string {
  const t = team.toLowerCase();
  if (t.includes("usab")) return "bg-[#B0C6DB] text-zinc-900";
  if (t.includes("require")) return "bg-[#A1D2B5] text-zinc-900";
  if (t.includes("qa") || t.includes("qualit") || t.includes("assur"))
    return "bg-[#FAE18A] text-zinc-900";
  if (t.includes("front")) return "bg-[#EDB970] text-zinc-900";
  if (t.includes("back")) return "bg-[#BDCABF] text-zinc-900";
  return "bg-slate-100 text-slate-800";
}

type Worklog = {
  _id?: { $oid: string } | string;
  worklogName?: string;
  authorName: string;
  authorEmail?: string;
  dateCreated?: string;
  dateSubmitted?: string;
  collaborators?: string[];
  taskList?: any[];
  isDraft?: boolean;
};

function fmtDate(s: string | undefined): string {
  if (!s) return "—";
  try {
    const cleaned = s.replace(/\[[^\]]+\]$/, "");
    const d = new Date(cleaned);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString();
  } catch {
    return s;
  }
}

export default function ArchivedClassDetailPage() {
  const userInfo = useAtomValue(userAtom);
  const params = useParams();
  const router = useRouter();
  const rawClassID = (params?.classID as string) ?? "";
  const classID = decodeURIComponent(rawClassID);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: classData } = useQuery({
    queryKey: ["class", classID],
    queryFn: () => getClass(classID),
    enabled: !!classID && isInstructorRole(userInfo?.role),
  });

  const { data: allUsers } = useQuery({
    queryKey: ["all-users"],
    queryFn: getAllUsers,
    enabled: !!classID && isInstructorRole(userInfo?.role),
  });

  const { data: worklogs, isLoading: worklogsLoading } = useQuery({
    queryKey: ["worklogs-for-class", classID],
    queryFn: () => getWorklogsForClass(classID),
    enabled: !!classID && isInstructorRole(userInfo?.role),
  });

  const userByEmail = useMemo(() => {
    const m = new Map<string, ClassUser>();
    (allUsers ?? []).forEach((u) => {
      if (u.email) m.set(u.email, u);
    });
    return m;
  }, [allUsers]);

  const grouped = useMemo(() => {
    const list: Worklog[] = (worklogs ?? []) as Worklog[];
    const submitted = list.filter((w) => !w.isDraft);
    const map = new Map<string, Worklog[]>();
    for (const w of submitted) {
      const key = w.authorEmail ?? "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return Array.from(map.entries())
      .map(([email, items]) => ({
        email,
        items: items.sort((a, b) =>
          (a.worklogName ?? "").localeCompare(b.worklogName ?? ""),
        ),
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
  }, [worklogs]);

  if (!mounted || !userInfo) return <p className="p-4 sm:p-10">Loading...</p>;
  if (!isInstructorRole(userInfo.role)) {
    return (
      <h1 className="p-4 sm:p-10">
        Sorry you do not have access to this page
      </h1>
    );
  }
  if (!classData) return <p className="p-4 sm:p-10">Loading...</p>;
  if (!(classData.instructors ?? []).includes(userInfo.email)) {
    return (
      <h1 className="p-4 sm:p-10">
        Sorry you do not have access to this page
      </h1>
    );
  }

  const cls: StudentClass | undefined = classData;

  const instructorRows = (cls?.instructors ?? []).map((email) => {
    const u = userByEmail.get(email);
    return { email, name: u?.name ?? email };
  });

  const studentRows = cls?.inactiveStudents ?? [];

  return (
    <div className="w-full">
      <div className="bg-gray-100 px-4 sm:px-6 md:px-10 py-6 border-b">
        <Breadcrumbs
          items={[
            { label: "Archived Classes", href: "/instructor/archived" },
            { label: classID },
          ]}
        />
        <div className="flex items-start gap-3 mt-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 bg-white shadow-sm"
            style={{ borderColor: BRAND_GREEN }}
          >
            <Archive
              className="h-6 w-6"
              style={{ color: BRAND_GREEN }}
              aria-hidden
            />
          </span>
          <div>
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight"
              style={{ color: BRAND_GREEN }}
            >
              Archived Classes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View work logs from previous classes.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-10 space-y-6">
        <div className="border-2 rounded-lg px-4 py-3 bg-white inline-block">
          <p
            className="text-xl sm:text-2xl font-bold"
            style={{ color: "#111" }}
          >
            {classID}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <Calendar className="h-4 w-4" />
            {fmtDate(cls?.semesterStartDate)} — {fmtDate(cls?.semsesterEndDate)}
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold">
            Instructors ({instructorRows.length})
          </h2>
          <Card className="overflow-hidden p-0 gap-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left">
                    <span className="inline-flex items-center gap-1">
                      Last Name <ChevronDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <span className="inline-flex items-center gap-1">
                      First Name <ChevronDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <span className="inline-flex items-center gap-1">
                      Email <ChevronDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {instructorRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      No instructors.
                    </td>
                  </tr>
                ) : (
                  instructorRows.map((inst, idx) => {
                    const { first, last } = splitName(inst.name);
                    const isYou = inst.email === userInfo.email;
                    return (
                      <tr key={inst.email} className="border-t">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium">
                              {last || inst.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {first || "—"}
                          {isYou && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-amber-300 text-amber-900 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {inst.email}
                        </td>
                        <td className="px-4 py-3">
                          {idx === 0 ? "Instructor" : "Co-Instructor"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold">
            Class Roster ({studentRows.length})
          </h2>
          <Card className="overflow-hidden p-0 gap-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left">
                    <span className="inline-flex items-center gap-1">
                      Last Name <ChevronDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <span className="inline-flex items-center gap-1">
                      First Name <ChevronDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <span className="inline-flex items-center gap-1">
                      Email <ChevronDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <span className="inline-flex items-center gap-1">
                      Class <ChevronDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <span className="inline-flex items-center gap-1">
                      Team <ChevronDown className="h-3 w-3" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center"
                    >
                      <Archive className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No students were enrolled in this class.
                      </p>
                    </td>
                  </tr>
                ) : (
                  studentRows.map((s) => {
                    const { first, last } = splitName(s.name);
                    const teams = (s.team ?? []).filter(
                      (t) => t && t.toLowerCase() !== "unassigned",
                    );
                    return (
                      <tr
                        key={s.email}
                        className="border-t cursor-pointer hover:bg-muted/40"
                        onClick={() =>
                          router.push(
                            `/instructor/students/${encodeURIComponent(s.email)}?classID=${encodeURIComponent(classID)}`,
                          )
                        }
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium">
                              {last || s.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{first || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {s.email}
                        </td>
                        <td className="px-4 py-3">
                          {s.classStanding || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {teams.length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            ) : (
                              teams.map((t) => (
                                <span
                                  key={t}
                                  className={`text-[11px] font-medium px-2 py-0.5 rounded ${teamChipClasses(t)}`}
                                >
                                  {t}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
