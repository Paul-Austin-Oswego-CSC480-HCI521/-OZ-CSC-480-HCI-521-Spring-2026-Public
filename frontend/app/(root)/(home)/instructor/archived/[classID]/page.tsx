"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import {
  ClassUser,
  getAllUsers,
  getClass,
  StudentClass,
} from "@/components/custom/utils/api_utils/req/class";
import { getWorklogsForClass } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/custom/ui/Breadcrumbs";
import {
  Archive,
  Calendar,
  CheckCircle2,
  CircleDot,
  LayoutGrid,
  User as UserIcon,
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
  if (t.includes("usab")) return "bg-emerald-100 text-emerald-800";
  if (t.includes("require")) return "bg-green-100 text-green-800";
  if (t.includes("qa")) return "bg-amber-100 text-amber-800";
  if (t.includes("front")) return "bg-orange-100 text-orange-800";
  if (t.includes("back")) return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-800";
}

type Worklog = {
  _id?: { $oid: string } | string;
  worklogName?: string;
  authorName: string;
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
    enabled: !!classID && userInfo?.role === "instructor",
  });

  const { data: allUsers } = useQuery({
    queryKey: ["all-users"],
    queryFn: getAllUsers,
    enabled: !!classID && userInfo?.role === "instructor",
  });

  const { data: worklogs, isLoading: worklogsLoading } = useQuery({
    queryKey: ["worklogs-for-class", classID],
    queryFn: () => getWorklogsForClass(classID),
    enabled: !!classID && userInfo?.role === "instructor",
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
      const key = w.authorName ?? "unknown";
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
  if (userInfo.role !== "instructor") {
    return (
      <h1 className="p-4 sm:p-10">
        Sorry you do not have access to this page
      </h1>
    );
  }

  const cls: StudentClass | undefined = classData;
  const totalWorklogs = grouped.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full">
      <Breadcrumbs
        items={[
          { label: "Archived Classes", href: "/instructor/archived" },
          { label: classID },
        ]}
      />
      <div className="mb-4 sm:mb-5">
        <h1
          className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1 flex items-center gap-2.5 flex-wrap"
          style={{ color: BRAND_GREEN }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 bg-white shadow-sm"
            style={{ borderColor: BRAND_GREEN }}
          >
            <Archive
              className="h-5 w-5"
              style={{ color: BRAND_GREEN }}
              aria-hidden
            />
          </span>
          {classID}
          <span className="text-[11px] font-bold uppercase tracking-wide bg-amber-300 text-amber-900 px-2 py-0.5 rounded">
            Archived
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground pl-0 sm:pl-[46px]">
          Worklog history for an archived class. Former students appear by
          email.
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4 sm:p-5 grid sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Semester</p>
              <p className="font-medium">
                {fmtDate(cls?.semesterStartDate)} —{" "}
                {fmtDate(cls?.semsesterEndDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Student access ended</p>
              <p className="font-medium">
                {fmtDate(cls?.studendAccessEndDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                Authors with worklogs
              </p>
              <p className="font-medium">
                {grouped.length} ({totalWorklogs} submissions)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4 overflow-hidden p-0 gap-0">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: BRAND_AMBER_TINT }}
        >
          <div
            className="flex items-center gap-2 font-semibold"
            style={{ color: BRAND_GREEN }}
          >
            <LayoutGrid className="h-4 w-4" />
            Class Roster
            <span className="text-xs font-normal text-muted-foreground">
              ({grouped.length})
            </span>
          </div>
        </div>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-amber-50/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Last Name</th>
                <th className="px-4 py-2.5 text-left">First Name</th>
                <th className="px-4 py-2.5 text-left">Email</th>
                <th className="px-4 py-2.5 text-left">Class</th>
                <th className="px-4 py-2.5 text-left">Teams</th>
                <th className="px-4 py-2.5 text-left">Submissions</th>
              </tr>
            </thead>
            <tbody>
              {worklogsLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Loading students...
                  </td>
                </tr>
              )}
              {!worklogsLoading && grouped.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <Archive className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No students submitted worklogs in this class.
                    </p>
                  </td>
                </tr>
              )}
              {!worklogsLoading &&
                grouped.map((g) => {
                  const user = userByEmail.get(g.email);
                  const { first, last } = splitName(user?.name);
                  const pref =
                    user?.preferredName?.trim()?.split(/\s+/)[0] ?? "";
                  const teams = (user?.team ?? []).filter(
                    (t) => t && t.toLowerCase() !== "unassigned",
                  );
                  const ok = teams.length > 0;
                  return (
                    <tr
                      key={g.email}
                      className="border-t cursor-pointer hover:bg-muted/40"
                      onClick={() =>
                        router.push(
                          `/instructor/students/${encodeURIComponent(g.email)}?classID=${encodeURIComponent(classID)}`,
                        )
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {ok ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <CircleDot className="h-4 w-4 text-amber-500" />
                          )}
                          <span className="font-medium">{last || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {first || "—"}
                        {pref && pref.toLowerCase() !== first.toLowerCase() && (
                          <span className="text-muted-foreground">
                            {" "}
                            ({pref})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{g.email}</td>
                      <td className="px-4 py-3">
                        {user?.classStanding ? (
                          <span className="text-xs whitespace-pre-line">
                            {user.classStanding.replace(" ", "\n")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {teams.length === 0 && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {teams.map((t) => (
                            <span
                              key={t}
                              className={`text-[11px] font-medium px-2 py-0.5 rounded ${teamChipClasses(t)}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {g.items.length}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
