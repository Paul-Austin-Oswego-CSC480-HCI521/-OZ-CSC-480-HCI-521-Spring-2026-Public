"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { userAtom } from "@/components/custom/utils/context/state";
import getWorklogDate from "../../utils/func/getDate";
import { AlertTriangle, Clock, ClipboardList, ArrowRight } from "lucide-react";

function getLateDays(log: any): number {
  const semesterStart = new Date("2026-01-26T00:00:00");
  const week = parseInt(log.worklogName);
  if (isNaN(week)) return 0;
  const dueDate = new Date(semesterStart);
  dueDate.setDate(dueDate.getDate() + week * 7);
  dueDate.setHours(23, 59, 0, 0);
  const submitted = new Date(log.dateSubmitted + "T00:00:00");
  const diffDays = Math.floor(
    (submitted.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays > 0 ? diffDays : 0;
}

export const NotifCenter = () => {
  const userInfo = useAtomValue(userAtom);

  const { data, isLoading, error } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  if (isLoading)
    return <p className="p-4 text-sm text-gray-500">Loading notifications...</p>;
  if (error)
    return (
      <div className="p-4">
        <p className="text-red-600 font-medium">Failed to load notifications</p>
        <p className="text-sm text-gray-400 mt-1">{(error as any)?.message}</p>
      </div>
    );

  const worklogs = data ?? [];

  const semesterStart = new Date("2026-01-26T00:00:00");
  const worklogInfo = getWorklogDate(semesterStart);
  const currentWeek = worklogInfo ? parseInt(worklogInfo.weekNumber) : 0;

  const submittedWeeks = new Set(
    worklogs
      .map((log: any) => parseInt(log.worklogName))
      .filter((w: number) => !isNaN(w))
  );

  const missingWeeks: { week: number; overdueDays: number }[] = [];
  const now = new Date();
  for (let w = 1; w < currentWeek; w++) {
    if (!submittedWeeks.has(w)) {
      const dueDate = new Date(semesterStart);
      dueDate.setDate(dueDate.getDate() + w * 7);
      dueDate.setHours(23, 59, 0, 0);
      const diffDays = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      missingWeeks.push({ week: w, overdueDays: diffDays > 0 ? diffDays : 0 });
    }
  }

  // Build notification items
  type NotifItem = {
    id: string;
    type: "overdue" | "due_soon" | "task";
    title: string;
    body: string;
    time?: string;
  };

  const notifications: NotifItem[] = [];

  // Overdue notifications
  missingWeeks.forEach(({ week, overdueDays }) => {
    notifications.push({
      id: `overdue-${week}`,
      type: "overdue",
      title: `Overdue: Work Log ${week}`,
      body: `Work log ${week}`,
      time: `Submission was due ${overdueDays} days ago.`,
    });
  });

  // Due soon (current week not submitted)
  if (!submittedWeeks.has(currentWeek)) {
    notifications.push({
      id: `due-soon-${currentWeek}`,
      type: "due_soon",
      title: `Due Soon: Work Log ${currentWeek}`,
      body: `Complete Work Log ${currentWeek}.`,
      time: "5h ago",
    });
  }

  // Late submissions as task notifications
  worklogs
    .filter((log: any) => getLateDays(log) > 0)
    .slice(0, 2)
    .forEach((log: any) => {
      notifications.push({
        id: `task-${log.worklogName}`,
        type: "task",
        title: `Complete Task: Work Log ${log.worklogName}`,
        body: `Task "Update QA Log" has missing reflections.`,
        time: "Yesterday",
      });
    });

  const newCount = notifications.filter(
    (n) => n.type === "overdue" || n.type === "due_soon"
  ).length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Notification Center</h2>
        {newCount > 0 && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: "#e6930a" }}
          >
            {newCount} New
          </span>
        )}
      </div>

      {/* Notification list */}
      <div className="divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            You&apos;re all caught up! No new notifications.
          </div>
        ) : (
          notifications.slice(0, 5).map((notif) => {
            const isOverdue = notif.type === "overdue";
            const isDueSoon = notif.type === "due_soon";
            const isTask = notif.type === "task";

            return (
              <div
                key={notif.id}
                className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Icon */}
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isOverdue
                      ? "bg-red-100"
                      : isDueSoon
                      ? "bg-amber-50 border border-amber-200"
                      : "bg-gray-100 border border-gray-200"
                  }`}
                >
                  {isOverdue && (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  {isDueSoon && (
                    <Clock className="h-4 w-4" style={{ color: "#e6930a" }} />
                  )}
                  {isTask && (
                    <ClipboardList className="h-4 w-4 text-gray-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      isOverdue ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {notif.title}
                  </p>
                  {notif.type === "overdue" && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {notif.body}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{notif.time}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <Link href="/notification">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              View All Notifications
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};