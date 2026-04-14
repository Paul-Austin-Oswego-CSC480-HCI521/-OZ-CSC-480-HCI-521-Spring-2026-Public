"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useAtomValue } from "jotai";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { userAtom } from "@/components/custom/utils/context/state";
import getWorklogDate from "../../utils/func/getDate";
import { fmtDateTime } from "../../utils/func/formatDate";
import { CheckCircle2, FileText, ArrowRight, Clock, AlertTriangle } from "lucide-react";

function getLateDays(log: any): number {
  const semesterStart = new Date("2026-01-26T00:00:00");
  const week = parseInt(log.worklogName);
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

function ImportantSection({ missingWeeks }: { missingWeeks: { week: number; overdueDays: number }[] }) {
  return (
    <div>
      <div className="px-2 py-2">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" /> Important
          <span className="text-sm font-normal text-red-500">({missingWeeks.length})</span>
        </CardTitle>
      </div>
      <div className="space-y-2 px-2 pb-3">
        {missingWeeks.slice(0, 2).map(({ week, overdueDays }) => (
          <div
            key={week}
            className="border border-red-200 bg-red-50 rounded-lg px-4 py-3"
          >
            <p className="text-sm font-medium text-red-800">
              &quot;Week {week} Work Log&quot; is overdue by {overdueDays} days
            </p>
          </div>
        ))}
        {missingWeeks.length > 2 && (
          <p className="text-sm font-medium text-red-600 px-1">
            and {missingWeeks.length - 2} more overdue work log{missingWeeks.length - 2 > 1 ? "s" : ""}
          </p>
        )}
      </div>
      <hr />
    </div>
  );
}

function RecentLogsSection({ worklogs }: { worklogs: any[] }) {
  return (
    <div>
      <div className="space-y-2 px-2">
        {worklogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-3">
              No work logs submitted yet.
            </p>
            <Link href="/worklogs">
              <Button size="sm" className="bg-green-700 hover:bg-green-800">
                Create First Work Log
              </Button>
            </Link>
          </div>
        ) : (
          [...worklogs]
            .sort(
              (a: any, b: any) =>
                (parseInt(b.worklogName) || 0) -
                (parseInt(a.worklogName) || 0),
            )
            .slice(0, 4)
            .map((log: any, i: number) => {
              const lateDays = getLateDays(log);
              return (
                <div
                  key={i}
                  className="border rounded-lg px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-green-100">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          Week {log.worklogName || "—"}
                        </p>
                        {lateDays > 0 && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md border border-red-200 bg-red-50 text-red-800">
                            Submitted Late ({lateDays} days)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Submitted {fmtDateTime(log.dateSubmitted)} —{" "}
                        {log.taskList?.length ?? 0} task(s)
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
      {worklogs.length > 0 && (
        <div className="pt-2 px-2 pb-2">
          <Link href="/notification">
            <Button variant="outline" size="sm" className="gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export const NotifCenter = () => {
  const userInfo = useAtomValue(userAtom);

  const { data, isLoading, error } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  if (isLoading) return <p className="p-4 sm:p-10">Loading notifications...</p>;
  if (error) return (
    <div className="p-4 sm:p-10">
      <p className="text-red-600 font-medium">Failed to load notifications</p>
      <p className="text-sm text-muted-foreground mt-1">{(error as any)?.message}</p>
    </div>
  );

  const worklogs = data ?? [];

  const semesterStart = new Date("2026-01-26T00:00:00");
  const worklogInfo = getWorklogDate(semesterStart);
  const currentWeek = worklogInfo ? parseInt(worklogInfo.weekNumber) : 0;

  const submittedWeeks = new Set(
    worklogs.map((log: any) => parseInt(log.worklogName)).filter((w: number) => !isNaN(w)),
  );

  const missingWeeks: { week: number; overdueDays: number }[] = [];
  const now = new Date();
  for (let w = 1; w < currentWeek; w++) {
    if (!submittedWeeks.has(w)) {
      const dueDate = new Date(semesterStart);
      dueDate.setDate(dueDate.getDate() + w * 7);
      dueDate.setHours(23, 59, 0, 0);
      const diffDays = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      missingWeeks.push({ week: w, overdueDays: diffDays > 0 ? diffDays : 0 });
    }
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl mb-1">
        Notification Center
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Your work log and task summary at a glance
      </p>

      <Card>
        <CardContent className="p-4 space-y-4">
          {missingWeeks.length > 0 && (
            <ImportantSection missingWeeks={missingWeeks} />
          )}
          <RecentLogsSection worklogs={worklogs} />
        </CardContent>
      </Card>
    </div>
  );
};
