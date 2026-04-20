"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import getWorklogDate from "@/components/custom/utils/func/getDate";
import { fmtDateTime } from "@/components/custom/utils/func/formatDate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  AlertTriangle,
  Clock,
  Bell,
  ChevronRight,
  LayoutList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const forest = "#1E4B35";
const accentOrange = "#B45309";
const submittedGreen = "#166534";
/** Same anchor as Weekly Work Log / `Notification.tsx` */
const SEMESTER_START = new Date("2026-01-26T00:00:00");

function getLateDays(log: any): number {
  const semesterStart = SEMESTER_START;
  const week = parseInt(log.worklogName, 10);
  if (isNaN(week)) return 0;
  const dueDate = new Date(semesterStart);
  dueDate.setDate(dueDate.getDate() + week * 7);
  dueDate.setHours(23, 59, 0, 0);
  const submitted = new Date(log.dateSubmitted);
  const diffDays = Math.floor(
    (submitted.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays > 0 ? diffDays : 0;
}

export default function NotificationPage() {
  const userInfo = useAtomValue(userAtom);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id && userInfo?.role === "student",
    queryFn: () => getWorkLog(userInfo?.email ?? ""),
  });

  const worklogs = data ?? [];
  const worklogInfo =
    userInfo?.role === "student" ? getWorklogDate(SEMESTER_START) : null;
  const currentWeekNum = worklogInfo
    ? parseInt(worklogInfo.weekNumber, 10) - 1
    : 0;

  const { missingWeeks, sortedWorklogs, lateSubmittedCount } = useMemo(() => {
    if (userInfo?.role !== "student") {
      return {
        missingWeeks: [] as { week: number; overdueDays: number }[],
        sortedWorklogs: [] as any[],
        lateSubmittedCount: 0,
      };
    }

    const submittedWeeks = new Set(
      worklogs
        .map((log: any) => parseInt(log.worklogName, 10))
        .filter((w: number) => !isNaN(w)),
    );

    const missing: { week: number; overdueDays: number }[] = [];
    const now = new Date();
    for (let w = 1; w < currentWeekNum; w++) {
      if (!submittedWeeks.has(w)) {
        const dueDate = new Date(SEMESTER_START);
        dueDate.setDate(dueDate.getDate() + w * 7);
        dueDate.setHours(23, 59, 0, 0);
        const diffDays = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        missing.push({ week: w, overdueDays: diffDays > 0 ? diffDays : 0 });
      }
    }

    const sorted = [...worklogs].sort(
      (a: any, b: any) =>
        (parseInt(b.worklogName, 10) || 0) - (parseInt(a.worklogName, 10) || 0),
    );

    let late = 0;
    for (const log of sorted) {
      if (getLateDays(log) > 0) late++;
    }

    return {
      missingWeeks: missing,
      sortedWorklogs: sorted,
      lateSubmittedCount: late,
    };
  }, [worklogs, currentWeekNum, userInfo?.role]);

  if (!mounted || !userInfo) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (userInfo.role === "instructor") {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <Card className="max-w-lg overflow-hidden rounded-2xl border-zinc-200/90 shadow-sm">
          <CardContent
            className="border-l-4 p-6 sm:p-8"
            style={{ borderLeftColor: forest }}
          >
            <h1 className="text-lg font-semibold" style={{ color: forest }}>
              Access restricted
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Instructor accounts cannot open the student notifications view.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userInfo.role === "student" && isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (userInfo.role === "student" && error) {
    return (
      <div className="p-4 sm:p-6 md:p-10">
        <Card className="max-w-xl rounded-2xl border-red-200/80 bg-red-50/30">
          <CardContent className="p-5 sm:p-6">
            <p className="font-medium text-red-700">Failed to load notifications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {(error as Error)?.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-4 md:p-6">
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="mb-1 flex flex-wrap items-center gap-2.5 text-xl font-bold tracking-tight sm:text-2xl md:text-3xl"
            style={{ color: forest }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 bg-white shadow-sm"
              style={{ borderColor: forest }}
            >
              <Bell className="h-5 w-5" style={{ color: forest }} aria-hidden />
            </span>
            Notifications
          </h1>
          <p className="pl-0 text-xs text-muted-foreground sm:pl-[46px] sm:text-sm">
            Work log alerts and your submission history.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="shrink-0 rounded-xl border-zinc-300 bg-white text-sm font-semibold shadow-sm hover:bg-zinc-50"
          style={{ color: forest, borderColor: `${forest}40` }}
        >
          <Link href="/notifications" className="inline-flex items-center gap-2">
            <LayoutList className="h-4 w-4" aria-hidden />
            Weekly Work Log
          </Link>
        </Button>
      </header>

      {worklogs.length > 0 && (
        <p className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground sm:mb-5 sm:text-sm">
          <span>
            <strong className="text-red-700">{missingWeeks.length}</strong> overdue
            week{missingWeeks.length === 1 ? "" : "s"}
          </span>
          <span className="hidden sm:inline text-zinc-300">|</span>
          <span>
            <strong style={{ color: submittedGreen }}>{worklogs.length}</strong>{" "}
            submitted
          </span>
          {lateSubmittedCount > 0 && (
            <>
              <span className="hidden sm:inline text-zinc-300">|</span>
              <span>
                <strong style={{ color: accentOrange }}>{lateSubmittedCount}</strong>{" "}
                submitted late
              </span>
            </>
          )}
        </p>
      )}

      {missingWeeks.length > 0 && (
        <section
          className="mb-5 overflow-hidden rounded-2xl border border-red-200/80 bg-red-50/25 shadow-sm sm:mb-6"
          aria-labelledby="overdue-heading"
        >
          <div className="border-l-4 border-l-red-600 px-4 py-4 sm:px-6 sm:py-5">
            <h2
              id="overdue-heading"
              className="mb-3 flex flex-wrap items-center gap-2 text-base font-bold text-red-800 sm:text-lg"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
              Overdue work logs
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                {missingWeeks.length}
              </span>
            </h2>
            <ul className="flex flex-col gap-2.5">
              {missingWeeks.map(({ week, overdueDays }) => (
                <li key={week}>
                  <Link
                    href={`/worklogs?week=${week}&mode=new`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-red-200/90 bg-white/90 px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">
                        Week {week}
                      </p>
                      <p className="text-xs text-red-700/90">
                        Overdue by {overdueDays} day{overdueDays === 1 ? "" : "s"} — submit
                        now
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section
        className="rounded-2xl border border-zinc-200/90 bg-zinc-100/80 p-3 shadow-sm sm:p-4 md:p-5"
        aria-labelledby="history-heading"
      >
        <div className="mb-4">
          <h2
            id="history-heading"
            className="text-lg font-bold sm:text-xl"
            style={{ color: forest }}
          >
            Submitted work logs
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {worklogs.length} total — open a week to review details.
          </p>
        </div>

        {worklogs.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-300/80 bg-white/80 px-6 py-12 text-center">
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 bg-white shadow-sm"
              style={{ borderColor: forest }}
            >
              <FileText className="h-7 w-7" style={{ color: forest }} />
            </div>
            <p className="max-w-sm text-sm font-medium text-zinc-800">
              No submissions yet
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground sm:text-sm">
              When you submit a weekly work log, it will show up here with status
              badges.
            </p>
            <Button
              asChild
              className="mt-6 rounded-xl border-0 font-semibold text-white shadow-sm hover:opacity-95"
              style={{ backgroundColor: forest }}
            >
              <Link href="/worklogs">Create first work log</Link>
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {sortedWorklogs.map((log: any) => {
              const lateDays = getLateDays(log);
              const isLate = lateDays > 0;
              const weekKey = String(log.worklogName ?? log._id ?? "");

              return (
                <li key={weekKey || "log"}>
                  <Link
                    href={`/worklogs/review?week=${log.worklogName}`}
                    style={{
                      borderLeftColor: isLate ? accentOrange : submittedGreen,
                    }}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border border-zinc-200/90 border-l-4 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:gap-4 sm:p-4",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm",
                          isLate
                            ? "border-orange-200 bg-[rgba(254,213,154,0.45)]"
                            : "border-emerald-200 bg-emerald-50",
                        )}
                      >
                        <CheckCircle2
                          className={cn(
                            "h-5 w-5",
                            isLate ? "text-[#B45309]" : "text-[#166534]",
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-zinc-900 sm:text-base">
                            Week {log.worklogName || "—"}
                          </p>
                          {isLate ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full border border-[#B45309] px-2.5 py-0.5 text-xs font-semibold text-[#B45309]"
                            >
                              <Clock className="h-3 w-3" aria-hidden />
                              Submitted late ({lateDays} days)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900">
                              <CheckCircle2 className="h-3 w-3" aria-hidden />
                              On time
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 opacity-70" />
                            {fmtDateTime(log.dateSubmitted)}
                          </span>
                          <span className="mx-1.5 text-zinc-300">·</span>
                          {log.taskList?.length ?? 0} task
                          {(log.taskList?.length ?? 0) === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
