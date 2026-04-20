"use client";
import { useQuery } from "@tanstack/react-query";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useAtomValue, useSetAtom } from "jotai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { userAtom } from "@/components/custom/utils/context/state";
import { worklogEditAtom } from "@/components/custom/utils/context/state"; // adjust path
import getWorklogDate from "../../utils/func/getDate";
import { fmtDate } from "../../utils/func/formatDate";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Circle,
  FileText,
  Hourglass,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

type WorklogStatus = "submitted" | "late" | "missing" | "current" | "upcoming";

interface WeekEntry {
  week: number;
  dueDate: string;
  submittedDate?: string;
  status: WorklogStatus;
  lateByDays?: number;
  overdueDays?: number;
  taskList?: any[];
  isCurrent?: boolean;
}

/** LakerTracks palette (Figma): forest #1E4B35, peach #FED59A, accent orange #B45309 */
const forest = "#1E4B35";
const accentOrange = "#B45309";
const submittedGreen = "#166534";
const rowOrangeIcon = "#ea580c";

function getStatusIcon(status: WorklogStatus) {
  switch (status) {
    case "submitted":
    case "late":
      return (
        <CheckCircle2
          className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
          style={{ color: submittedGreen }}
        />
      );
    case "missing":
      return (
        <XCircle className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-red-600" />
      );
    case "current":
      return (
        <Circle
          className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-white"
          style={{ color: rowOrangeIcon, fill: rowOrangeIcon }}
        />
      );
    case "upcoming":
      return (
        <FileText className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-zinc-400" />
      );
  }
}

function getStatusBadge(entry: WeekEntry) {
  const base =
    "text-xs font-medium px-2.5 py-1 rounded-full border inline-flex items-center gap-1";
  switch (entry.status) {
    case "submitted":
      return (
        <span
          className={cn(
            base,
            "border-emerald-200 bg-emerald-50 text-emerald-900",
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Submitted on time
        </span>
      );
    case "late":
      return (
        <span
          className={cn(
            base,
            "border-[#B45309] bg-transparent font-semibold text-[#B45309]",
          )}
        >
          <Clock className="h-3.5 w-3.5" aria-hidden />
          Submitted late ({entry.lateByDays} days)
        </span>
      );
    case "missing":
      return (
        <span
          className={cn(
            base,
            "border-red-500 bg-transparent font-semibold uppercase tracking-wide text-red-600",
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          Overdue ({entry.overdueDays} days)
        </span>
      );
    case "current":
      return (
        <span
          className={cn(
            base,
            "border-transparent font-semibold uppercase tracking-wide text-white",
          )}
          style={{ backgroundColor: accentOrange }}
        >
          Current Week
        </span>
      );
    case "upcoming":
      return (
        <span
          className={cn(
            base,
            "border-zinc-200 bg-zinc-200/90 font-medium text-zinc-700",
          )}
        >
          Upcoming
        </span>
      );
  }
}

function buildWeekEntries(worklogs: any[]): WeekEntry[] {
  const semesterStart = new Date("2026-01-26T00:00:00");
  const now = new Date();
  const worklogInfo = getWorklogDate(semesterStart);
  const currentWeek = worklogInfo ? parseInt(worklogInfo.weekNumber) - 1 : 0;

  const submittedMap = new Map<number, any>();
  worklogs.forEach((log: any) => {
    const week = parseInt(log.worklogName);
    if (!isNaN(week)) submittedMap.set(week, log);
  });

  const totalWeeks = currentWeek + 1;
  const entries: WeekEntry[] = [];

  for (let w = totalWeeks; w >= 1; w--) {
    const dueDate = new Date(semesterStart);
    dueDate.setDate(dueDate.getDate() + w * 7);
    dueDate.setHours(23, 59, 0, 0);
    const dueDateStr = dueDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const log = submittedMap.get(w);

    if (w > currentWeek) {
      entries.push({
        week: w,
        dueDate: dueDateStr,
        submittedDate: log
          ? fmtDate(log.dateSubmitted)
          : undefined,
        status: "upcoming",
        taskList: log?.taskList,
      });
    } else if (w === currentWeek) {
      if (log) {
        entries.push({
          week: w,
          dueDate: dueDateStr,
          submittedDate: fmtDate(log.dateSubmitted),
          status: "submitted",
          isCurrent: true,
          taskList: log.taskList,
        });
      } else {
        entries.push({ week: w, dueDate: dueDateStr, status: "current", isCurrent: true });
      }
    } else if (log) {
      const submitted = new Date(log.dateSubmitted);
      const diffDays = Math.floor(
        (submitted.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      entries.push({
        week: w,
        dueDate: dueDateStr,
        submittedDate: fmtDate(log.dateSubmitted),
        status: diffDays > 0 ? "late" : "submitted",
        lateByDays: diffDays > 0 ? diffDays : undefined,
        taskList: log.taskList,
      });
    } else {
      const overdueDays = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (overdueDays < 0) {
        // Due date hasn't passed yet — treat as current
        entries.push({ week: w, dueDate: dueDateStr, status: "current" });
      } else {
        entries.push({
          week: w,
          dueDate: dueDateStr,
          status: "missing",
          overdueDays,
        });
      }
    }
  }

  return entries;
}

export const Notification = () => {
  const router = useRouter();
  const userInfo = useAtomValue(userAtom);
  const worklogEdit = useAtomValue(worklogEditAtom);
  const setWorklogEdit = useSetAtom(worklogEditAtom);
  const { data, isLoading, error } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  if (isLoading) return <p className="p-4 sm:p-10">Loading...</p>;
  if (error) return (
    <div className="p-4 sm:p-10">
      <p className="text-red-600 font-medium">Failed to load worklogs</p>
      <p className="text-sm text-muted-foreground mt-1">{(error as any)?.message}</p>
    </div>
  );

  const worklogs = data ?? [];
  const entries = buildWeekEntries(worklogs);

  const semesterStart = new Date("2026-01-26T00:00:00");
  const worklogInfo = getWorklogDate(semesterStart);
  const currentWeekNum = worklogInfo ? parseInt(worklogInfo.weekNumber) - 1 : 0;
  const currentWeekEntry = entries.find((e) => e.week === currentWeekNum);

  const pastEntries = entries.filter((e) => e.status !== "upcoming");
  const total = pastEntries.length;
  const submitted = pastEntries.filter(
    (e) => e.status === "submitted" || e.status === "late",
  ).length;
  const late = pastEntries.filter((e) => e.status === "late").length;
  const missing = pastEntries.filter((e) => e.status === "missing").length;

  const currentWeekPrimaryLabel =
    currentWeekNum > 0 && currentWeekEntry
      ? currentWeekEntry.status === "submitted" ||
        currentWeekEntry.status === "late"
        ? "Review Current Week Work Log"
        : worklogEdit?.weekNumber === String(currentWeekNum) &&
            worklogEdit.mode === "new"
          ? "Continue Current Week Work Log"
          : "Create Current Week Work Log"
      : null;

  const handleWeekClick = (entry: WeekEntry) => {
    const hasSubmission = entry.status === "submitted" || entry.status === "late" || entry.submittedDate;
    if (hasSubmission) {
      router.push(`/worklogs/review?week=${entry.week}`);
    } else {
      setWorklogEdit({
        mode: "new",
        weekNumber: String(entry.week),
      });
      router.push(`/worklogs?week=${entry.week}&mode=new`);
    }
  };

  const handlePrimaryCurrentWeek = () => {
    if (!currentWeekNum || !currentWeekEntry) return;
    handleWeekClick(currentWeekEntry);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4 mb-4 sm:mb-5">
        <div>
          <h1
            className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1 flex items-center gap-2.5"
            style={{ color: forest }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 bg-white shadow-sm"
              style={{ borderColor: forest }}
            >
              <FileText
                className="h-5 w-5"
                style={{ color: forest }}
                aria-hidden
              />
            </span>
            Weekly Work Log
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground pl-0 sm:pl-[46px]">
            Manage and review your work log progress records.
          </p>
        </div>
      </div>

      {/* Summary cards — green / orange / red (Figma) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5 w-full max-w-3xl">
        <Card className="overflow-hidden rounded-xl border border-zinc-200/80 py-0 shadow-sm">
          <CardContent className="border-l-4 border-l-[#166534] bg-emerald-50/60 p-2.5 text-center sm:px-3 sm:py-2.5">
            <p className="mb-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#166534] sm:h-4 sm:w-4" />
              Submitted
            </p>
            <p className="text-lg font-bold tabular-nums text-[#166534] sm:text-2xl">
              {submitted}
              <span className="text-sm font-normal text-muted-foreground sm:text-lg">
                /{total}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-xl border border-zinc-200/80 py-0 shadow-sm">
          <CardContent
            className="border-l-4 p-2.5 text-center sm:px-3 sm:py-2.5"
            style={{
              borderLeftColor: accentOrange,
              backgroundColor: "rgba(254, 213, 154, 0.35)",
            }}
          >
            <p className="mb-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[#B45309] sm:h-4 sm:w-4" />
              Late
            </p>
            <p
              className="text-lg font-bold tabular-nums sm:text-2xl"
              style={{ color: accentOrange }}
            >
              {late}
              <span className="text-sm font-normal text-muted-foreground sm:text-lg">
                /{total}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-xl border border-zinc-200/80 py-0 shadow-sm">
          <CardContent className="border-l-4 border-l-red-600 bg-red-50/50 p-2.5 text-center sm:px-3 sm:py-2.5">
            <p className="mb-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
              <Hourglass className="h-3.5 w-3.5 shrink-0 text-red-600 sm:h-4 sm:w-4" />
              Missing
            </p>
            <p className="text-lg font-bold tabular-nums text-red-700 sm:text-2xl">
              {missing}
              <span className="text-sm font-normal text-muted-foreground sm:text-lg">
                /{total}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {currentWeekPrimaryLabel && (
        <div className="mb-4 sm:mb-5 flex justify-end">
          <Button
            type="button"
            className="rounded-xl border-0 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            style={{ backgroundColor: forest }}
            onClick={handlePrimaryCurrentWeek}
          >
            {currentWeekPrimaryLabel}
          </Button>
        </div>
      )}

      {/* Work log list */}
      <div className="rounded-2xl border border-zinc-200/90 bg-zinc-100/80 p-3 shadow-sm sm:p-4 md:p-5">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-lg font-bold sm:text-xl" style={{ color: forest }}>
            Work Log Status
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Track your submission progress for each week.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {entries.map((entry) => {
            const isDraftCurrent = entry.status === "current";
            const rowSubmitted =
              entry.status === "submitted" || entry.status === "late";

            return (
            <div
              key={entry.week}
              onClick={() => handleWeekClick(entry)}
              className={cn(
                "flex cursor-pointer gap-3 rounded-lg border border-zinc-200/90 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:gap-4 sm:p-6",
                isDraftCurrent &&
                  "border-l-4 border-l-[#B45309] bg-[rgba(254,213,154,0.9)] shadow-md",
                rowSubmitted &&
                  !isDraftCurrent &&
                  "border-l-4 border-l-[#166534]",
                entry.status === "missing" &&
                  "border-l-4 border-l-red-600 bg-red-50/40 hover:bg-red-50/60",
                entry.status === "upcoming" && "border-l-4 border-l-zinc-300",
              )}
            >
              <div className="shrink-0 pt-0.5">
                {getStatusIcon(entry.status)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <h3 className="text-base font-bold text-zinc-900 sm:text-lg">
                    Week {entry.week}
                  </h3>
                  {getStatusBadge(entry)}
                </div>
                <div className="flex flex-col sm:flex-row sm:gap-6 gap-1 text-xs sm:text-sm text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    Due: {entry.dueDate}
                  </span>
                  {entry.submittedDate && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      Submitted: {entry.submittedDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
