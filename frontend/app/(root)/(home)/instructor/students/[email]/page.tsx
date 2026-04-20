"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import { getClasses } from "@/components/custom/utils/api_utils/req/class";
import {
  getWorklogsForClass,
  updateWorklog,
} from "@/components/custom/utils/api_utils/worklogs/allReq";
import { getUsersFromClass } from "@/components/custom/utils/api_utils/req/req";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  FileText,
  Mail,
  AlertTriangle,
} from "lucide-react";
import getWorklogDate from "@/components/custom/utils/func/getDate";
import { fmtDate, fmtDateTime } from "@/components/custom/utils/func/formatDate";
import { cn } from "@/lib/utils";

const SEMESTER_START = new Date("2026-01-26T00:00:00");
const ACCENT_GREEN = "#1E4B35";

type WeekStatus = "submitted" | "late" | "missing" | "current" | "upcoming";

interface WeekRow {
  week: number;
  dueDate: Date;
  dueDateStr: string;
  status: WeekStatus;
  lateDays?: number;
  overdueDays?: number;
  daysUntilDue?: number;
  logs: any[];
  reviewed: boolean;
}

function buildWeekRows(studentLogs: any[], currentWeek: number): WeekRow[] {
  const now = new Date();

  const logsByWeek = new Map<number, any[]>();
  studentLogs.forEach((log) => {
    const w = parseInt(String(log.worklogName));
    if (isNaN(w)) return;
    if (!logsByWeek.has(w)) logsByWeek.set(w, []);
    logsByWeek.get(w)!.push(log);
  });
  logsByWeek.forEach((logs) =>
    logs.sort(
      (a, b) =>
        new Date(b.dateSubmitted).getTime() -
        new Date(a.dateSubmitted).getTime(),
    ),
  );

  const totalWeeks = currentWeek + 1; // include "next" upcoming week
  const rows: WeekRow[] = [];

  for (let w = totalWeeks; w >= 1; w--) {
    const dueDate = new Date(SEMESTER_START);
    dueDate.setDate(dueDate.getDate() + w * 7);
    dueDate.setHours(23, 59, 0, 0);
    const dueDateStr = dueDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const logs = logsByWeek.get(w) ?? [];
    const latest = logs[0] ?? null;
    const reviewed = latest?.reviewed === true;
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (w > currentWeek) {
      rows.push({
        week: w,
        dueDate,
        dueDateStr,
        status: "upcoming",
        daysUntilDue,
        logs,
        reviewed,
      });
    } else if (w === currentWeek) {
      if (latest) {
        const submitted = new Date(latest.dateSubmitted);
        const diff = Math.floor(
          (submitted.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        rows.push({
          week: w,
          dueDate,
          dueDateStr,
          status: diff > 0 ? "late" : "submitted",
          lateDays: diff > 0 ? diff : undefined,
          logs,
          reviewed,
        });
      } else {
        rows.push({
          week: w,
          dueDate,
          dueDateStr,
          status: "current",
          daysUntilDue,
          logs,
          reviewed,
        });
      }
    } else if (latest) {
      const submitted = new Date(latest.dateSubmitted);
      const diff = Math.floor(
        (submitted.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      rows.push({
        week: w,
        dueDate,
        dueDateStr,
        status: diff > 0 ? "late" : "submitted",
        lateDays: diff > 0 ? diff : undefined,
        logs,
        reviewed,
      });
    } else {
      const overdueDays = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      rows.push({
        week: w,
        dueDate,
        dueDateStr,
        status: "missing",
        overdueDays: overdueDays > 0 ? overdueDays : 0,
        logs,
        reviewed,
      });
    }
  }

  return rows;
}

function WeekBadgeIcon({ status }: { status: WeekStatus }) {
  const base = "h-10 w-10 rounded-lg flex items-center justify-center shrink-0";
  if (status === "submitted" || status === "late") {
    return (
      <div className={cn(base, "bg-green-100")}>
        <CheckCircle2 className="h-5 w-5 text-green-700" />
      </div>
    );
  }
  if (status === "missing") {
    return (
      <div className={cn(base, "bg-red-100")}>
        <XCircle className="h-5 w-5 text-red-600" />
      </div>
    );
  }
  if (status === "current") {
    return (
      <div className={cn(base, "bg-amber-200")}>
        <div className="h-4 w-4 rounded-full bg-amber-600" />
      </div>
    );
  }
  return (
    <div className={cn(base, "bg-gray-100")}>
      <FileText className="h-5 w-5 text-gray-500" />
    </div>
  );
}

function StatusBadge({ row }: { row: WeekRow }) {
  const base =
    "text-xs font-semibold px-2.5 py-1 rounded-md inline-flex items-center tracking-wide";
  if (row.status === "submitted")
    return (
      <span className={cn(base, "bg-green-100 text-green-800")}>
        SUBMITTED ON TIME
      </span>
    );
  if (row.status === "late")
    return (
      <span className={cn(base, "bg-orange-100 text-orange-800")}>
        SUBMITTED LATE ({row.lateDays} DAYS)
      </span>
    );
  if (row.status === "missing")
    return (
      <span
        className={cn(base, "bg-red-50 text-red-700 border border-red-200")}
      >
        Overdue ({row.overdueDays} days)
      </span>
    );
  if (row.status === "current")
    return (
      <span className={cn(base, "bg-amber-500 text-white")}>CURRENT WEEK</span>
    );
  return (
    <span className={cn(base, "bg-gray-100 text-gray-700")}>UPCOMING</span>
  );
}

function ReviewToggle({
  log,
  classID,
}: {
  log: any;
  classID?: string;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => {
      const id = typeof log._id === "object" ? log._id.$oid : log._id;
      const stripZ = (v: string) => (v ? v.replace("Z", "") : v);
      const body = {
        authorName: log.authorName,
        worklogName: log.worklogName,
        dateCreated: stripZ(log.dateCreated),
        dateSubmitted: stripZ(log.dateSubmitted),
        collaborators: log.collaborators ?? [],
        taskList: (log.taskList ?? []).map((t: any) => ({
          ...t,
          dueDate: t.dueDate ? stripZ(t.dueDate) : t.dueDate,
          creationDate: t.creationDate
            ? stripZ(t.creationDate)
            : t.creationDate,
        })),
        reviewed: !log.reviewed,
      };
      return updateWorklog(id, body, classID);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs-for-class"] });
    },
  });

  const reviewed = log.reviewed === true;

  return (
    <Button
      type="button"
      variant={reviewed ? "default" : "outline"}
      size="sm"
      disabled={mutation.isPending}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
      className={cn(
        "text-xs cursor-pointer",
        reviewed && "bg-green-600 hover:bg-green-700 text-white",
      )}
    >
      {reviewed ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Reviewed
        </>
      ) : (
        "Review"
      )}
    </Button>
  );
}

function WeekRowItem({
  row,
  classID,
}: {
  row: WeekRow;
  classID?: string;
}) {
  const [open, setOpen] = useState(false);
  const hasSubmissions = row.logs.length > 0;
  const latestLog = row.logs[0] ?? null;
  const isCurrent = row.status === "current";
  const isMissing = row.status === "missing";
  const deadlineHint =
    isCurrent && row.daysUntilDue !== undefined && row.daysUntilDue >= 0
      ? row.daysUntilDue === 0
        ? "Due today."
        : row.daysUntilDue === 1
          ? "Deadline in 1 day."
          : `Deadline in ${row.daysUntilDue} days.`
      : null;

  return (
    <Collapsible open={open && hasSubmissions} onOpenChange={(o) => hasSubmissions && setOpen(o)}>
      <div
        className={cn(
          "rounded-xl border bg-white transition-colors overflow-hidden",
          isCurrent && "bg-amber-50 border-amber-300",
          isMissing && "bg-red-50/50 border-red-200",
        )}
      >
        <CollapsibleTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-3 p-3 sm:p-4",
              hasSubmissions && "cursor-pointer hover:bg-black/[0.02]",
            )}
          >
            <WeekBadgeIcon status={row.status} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-1">
                <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                  Week {row.week}
                </h3>
                <StatusBadge row={row} />
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-6 gap-1 text-xs sm:text-sm text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  Due: {row.dueDateStr}
                  {deadlineHint && (
                    <span className="ml-2 text-red-600 font-medium">
                      {deadlineHint}
                    </span>
                  )}
                </span>
                {latestLog?.dateSubmitted && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    Submitted: {fmtDate(latestLog.dateSubmitted)}
                  </span>
                )}
              </div>
            </div>
            <div
              className="flex items-center gap-2 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {hasSubmissions && latestLog ? (
                <ReviewToggle log={latestLog} classID={classID} />
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
              {hasSubmissions ? (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    open ? "" : "-rotate-90",
                  )}
                />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-3 sm:px-4 py-3 space-y-3 bg-white">
            {row.logs.map((log: any, li: number) => (
              <div
                key={li}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    Submission {row.logs.length - li}
                    {li === 0 && (
                      <span
                        className="ml-2 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "rgba(30, 75, 53, 0.1)",
                          color: ACCENT_GREEN,
                        }}
                      >
                        Latest
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDateTime(log.dateSubmitted)} ·{" "}
                    {log.taskList?.length ?? 0} task(s)
                  </p>
                </div>
                {(log.taskList ?? []).map((task: any, ti: number) => (
                  <div
                    key={ti}
                    className="border rounded-md px-3 py-2 text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">
                        Task {ti + 1}: {task.taskName || "Untitled"}
                      </p>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          task.status === "complete"
                            ? "bg-green-100 text-green-700"
                            : task.status === "in-progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700",
                        )}
                      >
                        {task.status === "complete"
                          ? "Completed"
                          : task.status === "in-progress"
                            ? "In Progress"
                            : "Not Started"}
                      </span>
                    </div>
                    {task.goal && (
                      <p className="text-xs text-muted-foreground">
                        {task.goal}
                      </p>
                    )}
                    {task.reflection && (
                      <p className="text-xs text-muted-foreground italic">
                        &quot;{task.reflection}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function StudentHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const userInfo = useAtomValue(userAtom);
  const emailParam = decodeURIComponent(String(params?.email ?? ""));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: classesData } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
    enabled: userInfo?.role === "instructor",
  });
  const activeClass =
    (classesData ?? []).find((c: any) => !c.isArchived) ?? null;
  const activeClassID = activeClass?.classID ?? "";

  const { data: worklogsData } = useQuery({
    queryKey: ["worklogs-for-class", activeClassID],
    queryFn: () => getWorklogsForClass(activeClassID),
    enabled: !!activeClassID,
  });
  const { data: usersData } = useQuery({
    queryKey: ["users-from-class", activeClassID],
    queryFn: () => getUsersFromClass(activeClassID),
    enabled: !!activeClassID,
  });

  if (!mounted || !userInfo)
    return <p className="p-4 sm:p-10">Loading...</p>;
  if (userInfo.role !== "instructor")
    return (
      <h1 className="p-4 sm:p-10">
        Sorry you do not have access to this page
      </h1>
    );
  if (!activeClassID) return <p className="p-4 sm:p-10">No active class.</p>;

  const student = (usersData ?? []).find((u: any) => u.email === emailParam);
  if (!student) {
    return (
      <div className="p-4 sm:p-6 md:p-10">
        <Link href="/instructor">
          <Button variant="ghost" className="mb-4 gap-2 cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <p className="text-muted-foreground">
          Student not found in active class.
        </p>
      </div>
    );
  }

  const studentLogs = (worklogsData ?? []).filter(
    (l: any) => l.authorName === emailParam && !l.isDraft,
  );

  const worklogInfo = getWorklogDate(SEMESTER_START);
  const currentWeek = worklogInfo ? parseInt(worklogInfo.weekNumber) - 1 : 0;
  const rows = buildWeekRows(studentLogs, currentWeek);

  // Completion stats: weeks 1..currentWeek count as eligible
  const eligibleRows = rows.filter((r) => r.week <= currentWeek);
  const submittedCount = eligibleRows.filter(
    (r) => r.status === "submitted" || r.status === "late",
  ).length;
  const totalEligible = eligibleRows.length || 1;
  const completionPct = Math.round((submittedCount / totalEligible) * 100);

  const initials = (student.name || student.email || "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const teamList: string[] = (student.team ?? []).filter(
    (t: string) => t && t.toLowerCase() !== "unassigned",
  );

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full">
      {/* Top nav */}
      <div className="flex items-center gap-3 mb-4 text-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-muted-foreground">·</span>
        <Link
          href="/instructor"
          className="text-muted-foreground hover:text-foreground"
        >
          Manage Class
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{student.name}</span>
      </div>

      {/* Hero */}
      <Card className="mb-6 border-0 shadow-sm bg-emerald-50/60 overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full flex items-center justify-center shrink-0 text-2xl sm:text-3xl font-bold text-white shadow-sm"
                style={{ backgroundColor: ACCENT_GREEN }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight"
                  style={{ color: ACCENT_GREEN }}
                >
                  {student.name}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Mail className="h-3.5 w-3.5" />
                  {student.email}
                </p>
                {teamList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {teamList.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-white border rounded-md px-2 py-0.5 text-zinc-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {student.classStanding && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {student.classStanding}
                  </p>
                )}
              </div>
            </div>

            <Card
              className="border-0 shadow-sm shrink-0 w-full md:w-64 text-white"
              style={{ backgroundColor: ACCENT_GREEN }}
            >
              <CardContent className="p-4">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-white/80">
                  Overall Completion
                </p>
                <p className="text-3xl sm:text-4xl font-bold mt-1">
                  {completionPct}%
                </p>
                <div className="h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-300"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <p className="text-xs text-white/80 mt-2">
                  {submittedCount} out of {totalEligible} log
                  {totalEligible === 1 ? "" : "s"} submitted
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Work Logs */}
      <div className="mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
          Weekly Work Logs
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Review and manage student progress.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No weeks to display.</p>
            </CardContent>
          </Card>
        ) : (
          rows.map((row) => (
            <WeekRowItem
              key={row.week}
              row={row}
              classID={activeClassID}
            />
          ))
        )}
      </div>
    </div>
  );
}
