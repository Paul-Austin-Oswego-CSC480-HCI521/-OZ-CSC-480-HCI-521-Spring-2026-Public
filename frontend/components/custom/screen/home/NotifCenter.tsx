"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useAtomValue } from "jotai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { userAtom } from "@/components/custom/utils/context/state";
import getWorklogDate from "../../utils/func/getDate";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const SEMESTER_START = new Date("2026-01-26T00:00:00");
const TZ = "America/New_York";

function fmtDueShort(d: Date): string {
  const time = d.toLocaleTimeString("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  });
  const date = d.toLocaleDateString("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
  });
  return `${time} on ${date}`;
}

function relativeTime(from: Date): string {
  const diff = Date.now() - from.getTime();
  if (diff < 0) {
    const mins = Math.floor(-diff / (60 * 1000));
    if (mins < 60) return `in ${mins}m`;
    const hours = Math.floor(-diff / (60 * 60 * 1000));
    if (hours < 24) return `in ${hours}h`;
    const days = Math.floor(-diff / (24 * 60 * 60 * 1000));
    return `in ${days}d`;
  }
  const mins = Math.floor(diff / (60 * 1000));
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return `${days}d ago`;
}

type WorkLog = {
  worklogName?: string | number;
  dateSubmitted?: string;
  isDraft?: boolean;
};

export const NotifCenter = () => {
  const userInfo = useAtomValue(userAtom);

  const { data, isLoading, error } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  if (isLoading)
    return <p className="p-4 sm:p-6">Loading notifications...</p>;
  if (error)
    return (
      <div className="p-4 sm:p-6">
        <p className="text-red-600 font-medium">
          Failed to load notifications
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {(error as Error)?.message}
        </p>
      </div>
    );

  const worklogs: WorkLog[] = data ?? [];
  const worklogInfo = getWorklogDate(SEMESTER_START);
  const currentWeek = worklogInfo
    ? parseInt(worklogInfo.weekNumber) - 1
    : 0;

  const submitted = worklogs.filter((w) => !w.isDraft);
  const submittedWeeks = new Set<number>(
    submitted
      .map((log) => parseInt(String(log.worklogName)))
      .filter((w) => !isNaN(w)),
  );

  // Most recent overdue (highest unsubmitted week before current).
  let mostRecentOverdue: { week: number; dueDate: Date } | null = null;
  for (let w = currentWeek - 1; w >= 1; w--) {
    if (!submittedWeeks.has(w)) {
      const dueDate = new Date(SEMESTER_START);
      dueDate.setDate(dueDate.getDate() + w * 7);
      dueDate.setHours(23, 59, 0, 0);
      mostRecentOverdue = { week: w, dueDate };
      break;
    }
  }

  // Upcoming = current week if not yet submitted.
  let upcoming: { week: number; dueDate: Date } | null = null;
  if (currentWeek > 0 && !submittedWeeks.has(currentWeek)) {
    const dueDate = new Date(SEMESTER_START);
    dueDate.setDate(dueDate.getDate() + currentWeek * 7);
    dueDate.setHours(23, 59, 0, 0);
    upcoming = { week: currentWeek, dueDate };
  }

  // Most recently completed submission (sort by dateSubmitted desc).
  const completedList = submitted
    .filter((w) => !!w.dateSubmitted)
    .sort(
      (a, b) =>
        new Date(b.dateSubmitted!).getTime() -
        new Date(a.dateSubmitted!).getTime(),
    );
  const mostRecentCompleted = completedList[0]
    ? {
        week: parseInt(String(completedList[0].worklogName)),
        submittedAt: new Date(completedList[0].dateSubmitted!),
      }
    : null;

  const weekStartForUpcoming = new Date(SEMESTER_START);
  weekStartForUpcoming.setDate(
    weekStartForUpcoming.getDate() + (currentWeek - 1) * 7,
  );

  const newCount =
    (mostRecentOverdue ? 1 : 0) + (upcoming ? 1 : 0);
  const hasAny = !!(mostRecentOverdue || upcoming || mostRecentCompleted);

  return (
    <Card className="rounded-xl w-full md:w-3/4">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Notification Center</h2>
          {newCount > 0 && (
            <span className="text-xs font-semibold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
              {newCount} New
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {!hasAny && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No pending notifications. You&apos;re all caught up!
            </p>
          )}

          {mostRecentOverdue && (
            <div className="flex items-start gap-3 rounded-lg px-1 py-2">
              <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-700">
                  Overdue: Work Log {mostRecentOverdue.week}
                </p>
                <p className="text-xs text-muted-foreground">
                  Submission was due at {fmtDueShort(mostRecentOverdue.dueDate)}.
                </p>
              </div>
            </div>
          )}

          {mostRecentCompleted && !isNaN(mostRecentCompleted.week) && (
            <div className="flex items-start gap-3 rounded-lg px-1 py-2">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-emerald-800">
                    Completed: Work Log {mostRecentCompleted.week}
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {relativeTime(mostRecentCompleted.submittedAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Submitted at {fmtDueShort(mostRecentCompleted.submittedAt)}.
                </p>
              </div>
            </div>
          )}

          {upcoming && (
            <div className="flex items-start gap-3 rounded-lg px-1 py-2">
              <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-amber-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">
                    Upcoming: Work Log {upcoming.week}
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {relativeTime(weekStartForUpcoming)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Due at {fmtDueShort(upcoming.dueDate)}.
                </p>
              </div>
            </div>
          )}
        </div>

        <Link href="/notification" className="block mt-4">
          <Button variant="outline" className="w-full cursor-pointer">
            View All Notifications
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
