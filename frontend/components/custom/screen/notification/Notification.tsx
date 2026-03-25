"use client";
import { useQuery } from "@tanstack/react-query";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useAtomValue, useSetAtom } from "jotai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { useState } from "react";

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

function getStatusIcon(status: WorklogStatus) {
  switch (status) {
    case "submitted":
      return (
        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 shrink-0" />
      );
    case "late":
      return (
        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 shrink-0" />
      );
    case "missing":
      return (
        <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 shrink-0" />
      );
    case "current":
      return (
        <Circle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 fill-blue-600 shrink-0" />
      );
    case "upcoming":
      return <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 shrink-0" />;
  }
}

function getStatusBadge(entry: WeekEntry) {
  switch (entry.status) {
    case "submitted":
      return null;
    case "late":
      return (
        <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
          Submitted Late ({entry.lateByDays} days)
        </span>
      );
    case "missing":
      return (
        <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
          Overdue ({entry.overdueDays} days)
        </span>
      );
    case "current":
      return (
        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
          Current Week
        </span>
      );
    case "upcoming":
      return (
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          Upcoming
        </span>
      );
  }
}

function buildWeekEntries(worklogs: any[]): WeekEntry[] {
  const semesterStart = new Date("2026-01-26T00:00:00-05:00");
  const now = new Date();
  const worklogInfo = getWorklogDate(semesterStart);
  const currentWeek = worklogInfo ? parseInt(worklogInfo.weekNumber) : 0;

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
        entries.push({ week: w, dueDate: dueDateStr, status: "upcoming" });
      }
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
      entries.push({
        week: w,
        dueDate: dueDateStr,
        status: "missing",
        overdueDays,
      });
    }
  }

  return entries;
}

export const Notification = () => {
  const router = useRouter();
  const userInfo = useAtomValue(userAtom);
  const setWorklogEdit = useSetAtom(worklogEditAtom);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  if (isLoading) return <p className="p-4 sm:p-10">Loading...</p>;

  const worklogs = data ?? [];
  const entries = buildWeekEntries(worklogs);

  const pastEntries = entries.filter((e) => e.status !== "upcoming");
  const total = pastEntries.length;
  const submitted = pastEntries.filter(
    (e) => e.status === "submitted" || e.status === "late",
  ).length;
  const late = pastEntries.filter((e) => e.status === "late").length;
  const missing = pastEntries.filter((e) => e.status === "missing").length;

  const handleStartWorklog = (entry: WeekEntry) => {
    setWorklogEdit({
      mode: "new",
      weekNumber: String(entry.week),
    });
    router.push(`/worklogs?week=${entry.week}&mode=new`);
  };

  const handleResubmit = (entry: WeekEntry) => {
    // Get all submissions for this week, sorted oldest first
    const weekSubmissions = worklogs
      .filter((log: any) => parseInt(log.worklogName) === entry.week)
      .sort(
        (a: any, b: any) =>
          new Date(a.dateSubmitted).getTime() -
          new Date(b.dateSubmitted).getTime(),
      );

    const latest = weekSubmissions[weekSubmissions.length - 1];

    setWorklogEdit({
      mode: "resubmit",
      weekNumber: String(entry.week),
      tasks: latest?.taskList,
      previousSubmissions: weekSubmissions,
    });
    router.push(`/worklogs?week=${entry.week}&mode=resubmit`); // adjust to your route
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 h-full overflow-y-auto">
      <h1 className="text-2xl sm:text-3xl md:text-4xl mb-1">
        Weekly Work Log Overview
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Track and submit your weekly progress
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1">
              Submitted <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </p>
            <p className="text-xl sm:text-3xl font-bold">
              {submitted}
              <span className="text-muted-foreground text-sm sm:text-lg font-normal">
                /{total}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1">
              Late <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </p>
            <p className="text-xl sm:text-3xl font-bold">
              {late}
              <span className="text-muted-foreground text-sm sm:text-lg font-normal">
                /{total}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1">
              Missing <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </p>
            <p className="text-xl sm:text-3xl font-bold">
              {missing}
              <span className="text-muted-foreground text-sm sm:text-lg font-normal">
                /{total}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-2xl">Work Log Status</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Click a week to take action.
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 ">
          <div className="space-y-0">
            {entries.map((entry, i) => {
              const isSelected = selectedWeek === entry.week;

              return (
                <div key={entry.week} className="flex gap-3 sm:gap-4">
                  {/* Timeline line + icon */}
                  <div className="flex flex-col items-center">
                    {getStatusIcon(entry.status)}
                    {i < entries.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 my-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className={`pb-4 sm:pb-6 flex-1 min-w-0 cursor-pointer rounded-lg p-2 -m-2 transition-colors ${
                      isSelected ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                    onClick={() =>
                      setSelectedWeek(isSelected ? null : entry.week)
                    }
                  >
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                      <h3 className="text-base sm:text-lg font-semibold">
                        Week {entry.week}
                      </h3>
                      {getStatusBadge(entry)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-4 gap-0.5 text-xs sm:text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                        Due: {entry.dueDate}
                      </span>
                      {entry.submittedDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                          Submitted: {entry.submittedDate}
                        </span>
                      )}
                    </div>

                    {/* Action buttons when selected */}
                    {isSelected && (
                      <div className="mt-3">
                        {(entry.status === "missing" ||
                          entry.status === "current" ||
                          entry.status === "upcoming") && (
                          <Button
                            size="sm"
                            className="bg-green-700 hover:bg-green-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartWorklog(entry);
                            }}
                          >
                            Start Worklog
                          </Button>
                        )}
                        {(entry.status === "submitted" ||
                          entry.status === "late") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResubmit(entry);
                            }}
                          >
                            Resubmit
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
