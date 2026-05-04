"use client";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import getWorklogDate from "@/components/custom/utils/func/getDate";
import { fmtDateTime } from "@/components/custom/utils/func/formatDate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, CalendarDays } from "lucide-react";

const SEMESTER_START = new Date("2026-01-26T00:00:00");
const TOTAL_WEEKS = 16;
const accentGreen = "#1E4B35";

function calendarDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getLateDays(log: any): number {
  const week = parseInt(log.worklogName);
  if (isNaN(week)) return 0;
  const dueDate = new Date(SEMESTER_START);
  dueDate.setDate(dueDate.getDate() + week * 7);
  dueDate.setHours(23, 59, 0, 0);
  const submitted = new Date(log.dateSubmitted);
  const diffDays = calendarDaysBetween(dueDate, submitted);
  return diffDays > 0 ? diffDays : 0;
}

function fmtShortDateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationPage() {
  const userInfo = useAtomValue(userAtom);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  if (!mounted || !userInfo) {
    return <p className="p-4 sm:p-10">Loading...</p>;
  }

  if (userInfo.role === "instructor") {
    return (
      <h1 className="p-4 sm:p-10">
        Sorry you do not have access to this page
      </h1>
    );
  }

  if (isLoading) return <p className="p-4 sm:p-10">Loading...</p>;
  if (error)
    return (
      <div className="p-4 sm:p-10">
        <p className="text-red-600 font-medium">Failed to load notifications</p>
        <p className="text-sm text-muted-foreground mt-1">
          {(error as any)?.message}
        </p>
      </div>
    );

  const worklogs = (data ?? []).filter((log: any) => !log.isDraft);
  const worklogInfo = getWorklogDate(SEMESTER_START);
  const weekNum = worklogInfo ? parseInt(worklogInfo.weekNumber) - 1 : 0;

  const upcomingDue = new Date(SEMESTER_START);
  if (weekNum > 0) {
    upcomingDue.setDate(upcomingDue.getDate() + weekNum * 7);
  }
  upcomingDue.setHours(23, 59, 0, 0);
  const now = new Date();
  const daysUntilDue = calendarDaysBetween(now, upcomingDue);

  const submittedWeeks = new Set(
    worklogs
      .map((log: any) => parseInt(log.worklogName))
      .filter((w: number) => !isNaN(w)),
  );

  const missingWeeks: { week: number; overdueDays: number; dueDate: Date }[] =
    [];
  for (let w = 1; w < weekNum; w++) {
    if (!submittedWeeks.has(w)) {
      const dueDate = new Date(SEMESTER_START);
      dueDate.setDate(dueDate.getDate() + w * 7);
      dueDate.setHours(23, 59, 0, 0);
      const diffDays = calendarDaysBetween(dueDate, now);
      missingWeeks.push({
        week: w,
        overdueDays: diffDays > 0 ? diffDays : 0,
        dueDate,
      });
    }
  }
  missingWeeks.sort((a, b) => b.overdueDays - a.overdueDays);

  const sortedWorklogs = [...worklogs].sort((a: any, b: any) => {
    const at = a.dateSubmitted ? new Date(a.dateSubmitted).getTime() : 0;
    const bt = b.dateSubmitted ? new Date(b.dateSubmitted).getTime() : 0;
    return bt - at;
  });

  const handleSubmitNow = (week: number) => {
    router.push(`/worklogs?week=${week}&mode=new`);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-1"
            style={{ color: accentGreen }}
          >
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay updated on your academic progress and deadlines
          </p>
        </div>

        {missingWeeks.length > 0 && (
          <Card className="rounded-xl">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Urgent Actions
                </h2>
                <span className="text-xs font-bold tracking-wide bg-red-100 text-red-700 px-2.5 py-1 rounded-md">
                  REQUIRES ATTENTION
                </span>
              </div>
              <div className="space-y-3">
                {missingWeeks.map(({ week, overdueDays, dueDate }) => (
                  <div
                    key={week}
                    className="bg-zinc-100 rounded-lg p-4 flex items-start gap-3"
                  >
                    <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-sm sm:text-base">
                          Week {week} Work Log is overdue
                        </p>
                        <span className="text-xs font-bold text-red-600 shrink-0 tracking-wide">
                          {overdueDays} DAYS LATE
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSubmitNow(week)}
                        className="mt-2 bg-[#1E4B35] hover:bg-[#1E4B35]/90 text-white text-xs h-8 px-3 cursor-pointer"
                      >
                        Submit Now
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {fmtShortDateTime(dueDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-3">
            Recent Activities
          </h2>
          {sortedWorklogs.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No work logs submitted yet.
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl">
              <CardContent className="p-2 sm:p-3">
                <div className="divide-y">
                  {sortedWorklogs.map((log: any, i: number) => {
                    const lateDays = getLateDays(log);
                    return (
                      <div
                        key={i}
                        onClick={() =>
                          router.push(
                            `/worklogs/review?week=${log.worklogName}`,
                          )
                        }
                        className="px-3 py-3 flex items-start gap-3 hover:bg-muted/30 rounded-lg cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-green-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">
                                Week {log.worklogName} Work Log submitted
                                successfully.
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {fmtDateTime(log.dateSubmitted)}
                              </p>
                            </div>
                            {lateDays > 0 && (
                              <span className="text-xs font-bold tracking-wide border border-orange-300 bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md shrink-0">
                                LATE ({lateDays} DAYS)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <aside className="lg:w-72 shrink-0 space-y-4">
        {userInfo.classID && (
          <div>
            <p className="text-sm text-muted-foreground">Class</p>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900">
              {userInfo.classID}
            </p>
          </div>
        )}
        <Card className="rounded-xl">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-3 border rounded-lg px-3 py-2 bg-white">
              <div className="h-9 w-9 rounded bg-amber-100 flex items-center justify-center shrink-0">
                <CalendarDays className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Week Status</p>
                <p className="text-sm font-semibold">
                  Week {weekNum || "—"} of {TOTAL_WEEKS}
                </p>
              </div>
            </div>

            {weekNum > 0 && (
              <div>
                <p className="text-base font-bold mb-2">Upcoming Deadline</p>
                <div className="border-l-4 border-orange-400 pl-3 py-1">
                  <p className="text-xs font-bold tracking-wide text-orange-600">
                    {daysUntilDue >= 0
                      ? daysUntilDue === 0
                        ? "DUE TODAY"
                        : daysUntilDue === 1
                          ? "DUE IN 1 DAY"
                          : `DUE IN ${daysUntilDue} DAYS`
                      : "OVERDUE"}
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    Week {weekNum} Work Log
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Deadline: {worklogInfo?.due ?? "—"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
