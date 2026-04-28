"use client";
import { useQuery } from "@tanstack/react-query";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useAtomValue, useSetAtom } from "jotai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { userAtom } from "@/components/custom/utils/context/state";
import { worklogEditAtom } from "@/components/custom/utils/context/state";
import getWorklogDate from "../../utils/func/getDate";
import { fmtDate } from "../../utils/func/formatDate";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  FileText,
  Hourglass,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type WorklogStatus =
  | "submitted"
  | "late"
  | "missing"
  | "current"
  | "upcoming";

interface WeekEntry {
  week: number;
  dueDate: Date;
  dueDateStr: string;
  submittedDate?: string;
  status: WorklogStatus;
  lateByDays?: number;
  overdueDays?: number;
  daysUntilDue?: number;
  hasDraft?: boolean;
}

const accentGreen = "#1E4B35";
const SEMESTER_START = new Date("2026-01-26T00:00:00");

function calendarDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function buildWeekEntries(
  worklogs: {
    worklogName?: string | number;
    dateSubmitted?: string;
    isDraft?: boolean;
  }[],
): WeekEntry[] {
  const now = new Date();
  const worklogInfo = getWorklogDate(SEMESTER_START);
  const currentWeek = worklogInfo ? parseInt(worklogInfo.weekNumber) - 1 : 0;

  const submittedMap = new Map<number, { dateSubmitted?: string }>();
  const draftWeeks = new Set<number>();
  worklogs.forEach((log) => {
    const week = parseInt(String(log.worklogName));
    if (isNaN(week)) return;
    if (log.isDraft) {
      draftWeeks.add(week);
    } else {
      submittedMap.set(week, log);
    }
  });

  const totalWeeks = currentWeek + 1;
  const entries: WeekEntry[] = [];

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

    const log = submittedMap.get(w);
    const daysUntilDue = calendarDaysBetween(now, dueDate);

    const hasDraft = draftWeeks.has(w);

    if (w > currentWeek) {
      entries.push({
        week: w,
        dueDate,
        dueDateStr,
        status: "upcoming",
        daysUntilDue,
        hasDraft,
      });
    } else if (w === currentWeek) {
      if (log && log.dateSubmitted) {
        const submitted = new Date(log.dateSubmitted);
        const diffDays = calendarDaysBetween(dueDate, submitted);
        entries.push({
          week: w,
          dueDate,
          dueDateStr,
          submittedDate: fmtDate(log.dateSubmitted),
          status: diffDays > 0 ? "late" : "submitted",
          lateByDays: diffDays > 0 ? diffDays : undefined,
          hasDraft,
        });
      } else {
        entries.push({
          week: w,
          dueDate,
          dueDateStr,
          status: "current",
          daysUntilDue,
          hasDraft,
        });
      }
    } else if (log && log.dateSubmitted) {
      const submitted = new Date(log.dateSubmitted);
      const diffDays = calendarDaysBetween(dueDate, submitted);
      entries.push({
        week: w,
        dueDate,
        dueDateStr,
        submittedDate: fmtDate(log.dateSubmitted),
        status: diffDays > 0 ? "late" : "submitted",
        lateByDays: diffDays > 0 ? diffDays : undefined,
        hasDraft,
      });
    } else {
      const overdueDays = calendarDaysBetween(dueDate, now);
      entries.push({
        week: w,
        dueDate,
        dueDateStr,
        status: "missing",
        overdueDays: overdueDays > 0 ? overdueDays : 0,
        hasDraft,
      });
    }
  }

  return entries;
}

function WeekIcon({ entry }: { entry: WeekEntry }) {
  const common = "h-10 w-10 rounded-lg flex items-center justify-center shrink-0";
  switch (entry.status) {
    case "submitted":
    case "late":
      return (
        <div className={cn(common, "bg-green-100")}>
          <CheckCircle2 className="h-5 w-5 text-green-700" />
        </div>
      );
    case "missing":
      return (
        <div className={cn(common, "bg-red-100")}>
          <XCircle className="h-5 w-5 text-red-600" />
        </div>
      );
    case "current":
      return (
        <div className={cn(common, "bg-amber-200")}>
          <div className="h-4 w-4 rounded-full bg-amber-600" />
        </div>
      );
    case "upcoming":
      return (
        <div className={cn(common, "bg-gray-100")}>
          <FileText className="h-5 w-5 text-gray-500" />
        </div>
      );
  }
}

function StatusBadge({ entry }: { entry: WeekEntry }) {
  const base =
    "text-xs font-semibold px-2.5 py-1 rounded-md inline-flex items-center tracking-wide";
  switch (entry.status) {
    case "submitted":
      return (
        <span className={cn(base, "bg-green-100 text-green-800")}>
          SUBMITTED ON TIME
        </span>
      );
    case "late":
      return (
        <span className={cn(base, "bg-orange-100 text-orange-800")}>
          SUBMITTED LATE ({entry.lateByDays} DAYS)
        </span>
      );
    case "missing":
      return (
        <span
          className={cn(base, "bg-red-50 text-red-700 border border-red-200")}
        >
          Overdue ({entry.overdueDays} days)
        </span>
      );
    case "current":
      return (
        <span className={cn(base, "bg-amber-500 text-white")}>
          CURRENT WEEK
        </span>
      );
    case "upcoming":
      return (
        <span className={cn(base, "bg-gray-100 text-gray-700")}>
          UPCOMING
        </span>
      );
  }
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
  if (error)
    return (
      <div className="p-4 sm:p-10">
        <p className="text-red-600 font-medium">Failed to load worklogs</p>
        <p className="text-sm text-muted-foreground mt-1">
          {(error as Error)?.message}
        </p>
      </div>
    );

  const worklogs = data ?? [];
  const entries = buildWeekEntries(worklogs);

  const worklogInfo = getWorklogDate(SEMESTER_START);
  const currentWeekNum = worklogInfo
    ? parseInt(worklogInfo.weekNumber) - 1
    : 0;
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
        ? "Review Current Week's Work Log"
        : worklogEdit?.weekNumber === String(currentWeekNum) &&
            worklogEdit.mode === "new"
          ? "Continue Current Week's Work Log"
          : "Continue Current Week's Work Log"
      : null;

  const handleWeekClick = (entry: WeekEntry) => {
    const hasSubmission =
      entry.status === "submitted" ||
      entry.status === "late" ||
      entry.submittedDate;
    if (hasSubmission || entry.hasDraft) {
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
      {/* Header */}
      <div className="mb-4 sm:mb-5">
        <h1
          className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1 flex items-center gap-2.5"
          style={{ color: accentGreen }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 bg-white shadow-sm"
            style={{ borderColor: accentGreen }}
          >
            <FileText
              className="h-5 w-5"
              style={{ color: accentGreen }}
              aria-hidden
            />
          </span>
          Weekly Work Log
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground pl-0 sm:pl-[46px]">
          Manage and review your work log progress records.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5 w-full md:w-3/4">
        <Card className="border border-l-4 border-l-green-500 py-0 shadow-none rounded-xl overflow-hidden">
          <CardContent className="p-2.5 sm:py-3 sm:px-4 text-center bg-green-50">
            <p className="text-xs sm:text-sm text-green-900 flex items-center justify-center gap-1.5 mb-1 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-700 shrink-0" />
              Submitted
            </p>
            <p className="text-lg sm:text-2xl font-bold text-green-900 tabular-nums">
              {submitted}
              <span className="text-green-700/60 text-sm sm:text-lg font-normal">
                /{total}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="border border-l-4 border-l-orange-400 py-0 shadow-none rounded-xl overflow-hidden">
          <CardContent className="p-2.5 sm:py-3 sm:px-4 text-center bg-orange-50">
            <p className="text-xs sm:text-sm text-orange-900 flex items-center justify-center gap-1.5 mb-1 font-medium">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 shrink-0" />
              Late
            </p>
            <p className="text-lg sm:text-2xl font-bold text-orange-900 tabular-nums">
              {late}
              <span className="text-orange-700/60 text-sm sm:text-lg font-normal">
                /{total}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="border border-l-4 border-l-red-500 py-0 shadow-none rounded-xl overflow-hidden">
          <CardContent className="p-2.5 sm:py-3 sm:px-4 text-center bg-red-50">
            <p className="text-xs sm:text-sm text-red-900 flex items-center justify-center gap-1.5 mb-1 font-medium">
              <Hourglass className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 shrink-0" />
              Missing
            </p>
            <p className="text-lg sm:text-2xl font-bold text-red-900 tabular-nums">
              {missing}
              <span className="text-red-700/60 text-sm sm:text-lg font-normal">
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
            variant="outline"
            className="rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
            style={{ borderColor: accentGreen, color: accentGreen }}
            onClick={handlePrimaryCurrentWeek}
          >
            {currentWeekPrimaryLabel}
          </Button>
        </div>
      )}

      {/* Work log list */}
      <div>
        <div className="mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
            Work Log Status
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track your submission progress for each week.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {entries.map((entry) => {
            const isCurrent = entry.status === "current";
            const isMissing = entry.status === "missing";
            const isSubmittedStatus =
              entry.status === "submitted" || entry.status === "late";
            const showDraftLabel = !isSubmittedStatus;
            const deadlineText =
              isCurrent && entry.daysUntilDue !== undefined && entry.daysUntilDue >= 0
                ? entry.daysUntilDue === 0
                  ? "Due today."
                  : entry.daysUntilDue === 1
                    ? "Deadline in 1 day."
                    : `Deadline in ${entry.daysUntilDue} days.`
                : null;

            const borderLeftColor =
              entry.status === "submitted"
                ? "border-l-green-500"
                : entry.status === "late"
                  ? "border-l-orange-400"
                  : entry.status === "missing"
                    ? "border-l-red-500"
                    : entry.status === "current"
                      ? "border-l-amber-400"
                      : "border-l-gray-300";

            return (
              <div
                key={entry.week}
                onClick={() => handleWeekClick(entry)}
                className={cn(
                  "flex gap-3 items-center rounded-xl border border-l-4 bg-white p-4 sm:p-5 min-h-[88px] sm:min-h-[100px] transition-colors cursor-pointer hover:bg-gray-50",
                  borderLeftColor,
                  isCurrent && "bg-amber-50 border-amber-300 hover:bg-amber-100",
                  isMissing && "bg-red-50/50 border-red-200 hover:bg-red-50",
                )}
              >
                <WeekIcon entry={entry} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                      Week {entry.week}
                    </h3>
                    <StatusBadge entry={entry} />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-6 gap-1 text-xs sm:text-sm text-zinc-600">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      Due: {entry.dueDateStr}
                      {deadlineText && (
                        <span className="ml-2 text-red-600 font-medium">
                          {deadlineText}
                        </span>
                      )}
                    </span>
                    {entry.submittedDate && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        Submitted: {entry.submittedDate}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-gray-500">
                  {showDraftLabel && entry.hasDraft && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                      Draft saved
                    </span>
                  )}
                  {showDraftLabel && !entry.hasDraft && (
                    <span className="text-sm text-gray-600">Draft</span>
                  )}
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
