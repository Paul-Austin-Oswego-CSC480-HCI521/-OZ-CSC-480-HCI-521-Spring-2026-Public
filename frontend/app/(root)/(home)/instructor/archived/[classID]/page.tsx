"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import {
  getClass,
  StudentClass,
} from "@/components/custom/utils/api_utils/req/class";
import { getWorklogsForClass } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Archive,
  ArrowLeft,
  Calendar,
  ChevronDown,
  Mail,
  User as UserIcon,
} from "lucide-react";

const BRAND_GREEN = "#1E4B35";

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
  const rawClassID = (params?.classID as string) ?? "";
  const classID = decodeURIComponent(rawClassID);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: classData } = useQuery({
    queryKey: ["class", classID],
    queryFn: () => getClass(classID),
    enabled: !!classID && userInfo?.role === "instructor",
  });

  const { data: worklogs, isLoading: worklogsLoading } = useQuery({
    queryKey: ["worklogs-for-class", classID],
    queryFn: () => getWorklogsForClass(classID),
    enabled: !!classID && userInfo?.role === "instructor",
  });

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
      <Link href="/instructor/archived">
        <button className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
          Back to archived classes
        </button>
      </Link>

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

      {worklogsLoading && (
        <p className="text-sm text-muted-foreground">Loading worklogs...</p>
      )}

      {!worklogsLoading && grouped.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Archive className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No worklogs were submitted in this class.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {grouped.map((g) => (
          <Card key={g.email} className="overflow-hidden p-0 gap-0">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-muted/40">
                  <div className="flex items-center gap-2">
                    <Mail
                      className="h-4 w-4"
                      style={{ color: BRAND_GREEN }}
                    />
                    <span
                      className="font-semibold"
                      style={{ color: BRAND_GREEN }}
                    >
                      {g.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({g.items.length} submission
                      {g.items.length === 1 ? "" : "s"})
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="divide-y border-t">
                  {g.items.map((w, i) => (
                    <Collapsible key={`${w.worklogName ?? i}-${i}`}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-muted/40">
                          <div>
                            <p className="text-sm font-medium">
                              Week {w.worklogName ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {w.taskList?.length ?? 0} task
                              {(w.taskList?.length ?? 0) === 1 ? "" : "s"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              Submitted: {fmtDate(w.dateSubmitted)}
                            </p>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-3 bg-muted/30">
                          {(w.taskList ?? []).length === 0 && (
                            <p className="text-xs text-muted-foreground py-3">
                              No tasks recorded.
                            </p>
                          )}
                          {(w.taskList ?? []).map((t: any, idx: number) => {
                            const collabs = (t.collaborators ?? []).filter(
                              (c: string) => c && c.trim() !== "",
                            );
                            return (
                              <div
                                key={idx}
                                className="rounded-md border bg-white p-3 space-y-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className="text-sm font-semibold"
                                    style={{ color: BRAND_GREEN }}
                                  >
                                    {t.taskName || "(untitled task)"}
                                  </p>
                                  <span
                                    className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${
                                      t.status === "complete"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : t.status === "in-progress"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-slate-200 text-slate-700"
                                    }`}
                                  >
                                    {t.status?.replace("-", " ") ?? "—"}
                                  </span>
                                </div>
                                {t.goal && (
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                                      Main goal
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap">
                                      {t.goal}
                                    </p>
                                  </div>
                                )}
                                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                                      Deadline
                                    </p>
                                    <p>{fmtDate(t.dueDate)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                                      Created
                                    </p>
                                    <p>{fmtDate(t.creationDate)}</p>
                                  </div>
                                </div>
                                {t.reflection && (
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                                      Reflection
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap">
                                      {t.reflection}
                                    </p>
                                  </div>
                                )}
                                {collabs.length > 0 && (
                                  <div>
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                                      Collaborators
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {collabs.map((c: string) => (
                                        <span
                                          key={c}
                                          className="text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded"
                                        >
                                          {c}
                                        </span>
                                      ))}
                                    </div>
                                    {t.collabDescription && (
                                      <p className="text-sm mt-1 whitespace-pre-wrap">
                                        {t.collabDescription}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}
