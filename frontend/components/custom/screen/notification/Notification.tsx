"use client";
import { useQuery } from "@tanstack/react-query";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useAtomValue, useSetAtom } from "jotai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { userAtom } from "@/components/custom/utils/context/state";
import { worklogEditAtom } from "@/components/custom/utils/context/state"; // adjust path
import getWorklogDate from "../../utils/func/getDate";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Circle,
  FileText,
  Hourglass,
} from "lucide-react";
import { cn } from "@/lib/utils";

type WorklogStatus = "submitted" | "late" | "missing" | "current" | "upcoming";

interface WeekEntry {
  week: number;
  dueDate: string;
  submittedDate?: string;
  status: WorklogStatus;
  lateByDays?: number;
  overdueDays?: number;
  taskList?: any[];
}

const accentGreen = "#1E4B35";

function getStatusIcon(status: WorklogStatus) {
  switch (status) {
    case "submitted":
      return (
        <CheckCircle2
          className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
          style={{ color: accentGreen }}
        />
      );
    case "late":
      return (
        <CheckCircle2
          className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
          style={{ color: accentGreen }}
        />
      );
    case "missing":
      return (
        <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 shrink-0" />
      );
    case "current":
      return (
        <Circle
          className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
          style={{ color: accentGreen, fill: accentGreen }}
        />
      );
    case "upcoming":
      return (
        <FileText
          className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
          style={{ color: accentGreen }}
        />
      );
  }
}

function getStatusBadge(entry: WeekEntry) {
  const base =
    "text-xs font-medium px-2.5 py-1 rounded-md border inline-flex items-center";
  switch (entry.status) {
    case "submitted":
      return null;
    case "late":
      return (
        <span className={cn(base, "border-red-200 bg-red-50 text-red-800")}>
          Submitted Late ({entry.lateByDays} days)
        </span>
      );
    case "missing":
      return (
        <span className={cn(base, "border-red-200 bg-red-50 text-red-800")}>
          Overdue ({entry.overdueDays} days)
        </span>
      );
    case "current":
      return (
        <span
          className={cn(base, "border-[#1E4B35]/35 bg-[#1E4B35] text-white")}
        >
          Current Week
        </span>
      );
    case "upcoming":
      return (
        <span
          className={cn(
            base,
            "border-[#1E4B35]/30 bg-[#1E4B35]/10 text-[#1E4B35]",
          )}
        >
          Upcoming
        </span>
      );
  }
}

function buildWeekEntries(worklogs: any[]): WeekEntry[] {
  const semesterStart = new Date("2026-01-26T00:00:00-05:00");
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
          ? new Date(log.dateSubmitted).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : undefined,
        status: "upcoming",
        taskList: log?.taskList,
      });
    } else if (w === currentWeek) {
      if (log) {
        entries.push({
          week: w,
          dueDate: dueDateStr,
          submittedDate: new Date(log.dateSubmitted).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            },
          ),
          status: "submitted",
          taskList: log.taskList,
        });
      } else {
        entries.push({ week: w, dueDate: dueDateStr, status: "current" });
      }
    } else if (log) {
      const submitted = new Date(log.dateSubmitted);
      const diffDays = Math.floor(
        (submitted.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      entries.push({
        week: w,
        dueDate: dueDateStr,
        submittedDate: submitted.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
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
  const { data, isLoading } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  if (isLoading) return <p className="p-4 sm:p-10">Loading...</p>;

  const worklogs = data ?? [];
  const entries = buildWeekEntries(worklogs);

  const semesterStart = new Date("2026-01-26T00:00:00-05:00");
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1 flex items-center gap-2.5">
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
            Weekly Work Logs
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground pl-0 sm:pl-[46px]">
            Track and submit your weekly progress
          </p>
        </div>
        {currentWeekPrimaryLabel && (
          <Button
            type="button"
            className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 border-0"
            style={{ backgroundColor: accentGreen }}
            onClick={handlePrimaryCurrentWeek}
          >
            {currentWeekPrimaryLabel}
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
        <Card
          className="border-2 py-0 shadow-none rounded-xl overflow-hidden"
          style={{ borderColor: `${accentGreen}33` }}
        >
          <CardContent className="p-2.5 sm:py-2.5 sm:px-3 text-center bg-[rgba(109,155,129,0.08)]">
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
                style={{ color: accentGreen }}
              />
              Submitted
            </p>
            <p
              className="text-lg sm:text-2xl font-bold tabular-nums"
              style={{ color: accentGreen }}
            >
              {submitted}
              <span className="text-muted-foreground text-sm sm:text-lg font-normal">
                /{total}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card
          className="border-2 py-0 shadow-none rounded-xl overflow-hidden"
          style={{ borderColor: `${accentGreen}33` }}
        >
          <CardContent className="p-2.5 sm:py-2.5 sm:px-3 text-center bg-[rgba(109,155,129,0.08)]">
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1.5 mb-1">
              <Clock
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
                style={{ color: accentGreen }}
              />
              Late
            </p>
            <p
              className="text-lg sm:text-2xl font-bold tabular-nums"
              style={{ color: accentGreen }}
            >
              {late}
              <span className="text-muted-foreground text-sm sm:text-lg font-normal">
                /{total}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card
          className="border-2 py-0 shadow-none rounded-xl overflow-hidden"
          style={{ borderColor: `${accentGreen}33` }}
        >
          <CardContent className="p-2.5 sm:py-2.5 sm:px-3 text-center bg-[rgba(109,155,129,0.08)]">
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1.5 mb-1">
              <Hourglass
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
                style={{ color: accentGreen }}
              />
              Missing
            </p>
            <p
              className="text-lg sm:text-2xl font-bold tabular-nums"
              style={{ color: accentGreen }}
            >
              {missing}
              <span className="text-muted-foreground text-sm sm:text-lg font-normal">
                /{total}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Work log list */}
      <div
        className="rounded-[20px] border-2 p-3 sm:p-4 md:p-5 shadow-sm"
        style={{
          borderColor: accentGreen,
          backgroundColor: "rgba(109, 155, 129, 0.2)",
        }}
      >
        <div className="mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-[#1E4B35]">
            Work Log Status
          </h2>
          <p className="text-xs sm:text-sm text-[#1E4B35]/80 mt-1">
            Track your submission progress for each week.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <div
              key={entry.week}
              onClick={() => handleWeekClick(entry)}
              className={cn(
                "flex gap-3 rounded-xl border bg-white p-3 sm:p-4 shadow-sm transition-colors cursor-pointer hover:bg-white/80",
                entry.status === "current" &&
                  "border-[#1E4B35] border-2 bg-[rgba(109,155,129,0.28)] hover:bg-[rgba(109,155,129,0.35)]",
                entry.status === "missing" &&
                  "border-2 border-red-400 bg-red-50/70 hover:bg-red-50",
                entry.status === "upcoming" && "border-zinc-200",
                entry.status !== "current" &&
                  entry.status !== "missing" &&
                  entry.status !== "upcoming" &&
                  "border-zinc-200/90",
              )}
            >
              <div className="pt-0.5 shrink-0">
                {getStatusIcon(entry.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-1">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900">
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
          ))}
        </div>
      </div>
    </div>
  );
};
