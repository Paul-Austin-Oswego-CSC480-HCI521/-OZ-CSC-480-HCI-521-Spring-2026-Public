"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllWorkLogs } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import getWorklogDate from "@/components/custom/utils/func/getDate";
import {
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Search,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";

interface StudentSummary {
  id: string;
  name: string;
  email: string;
  totalSubmissions: number;
  weeksSubmitted: number[];
  weeksMissing: number[];
  latestSubmission: string | null;
  worklogs: any[];
}

function buildStudentSummaries(
  allWorklogs: any[],
  currentWeek: number,
): StudentSummary[] {
  const studentMap = new Map<string, StudentSummary>();

  allWorklogs.forEach((log: any) => {
    const id = log.authorName;
    if (!studentMap.has(id)) {
      studentMap.set(id, {
        id,
        name: log.authorDisplayName || id,
        email: log.authorEmail || "",
        totalSubmissions: 0,
        weeksSubmitted: [],
        weeksMissing: [],
        latestSubmission: null,
        worklogs: [],
      });
    }

    const student = studentMap.get(id)!;
    student.totalSubmissions++;
    const week = parseInt(log.worklogName);
    if (!isNaN(week) && !student.weeksSubmitted.includes(week)) {
      student.weeksSubmitted.push(week);
    }
    student.worklogs.push(log);

    if (
      !student.latestSubmission ||
      new Date(log.dateSubmitted) > new Date(student.latestSubmission)
    ) {
      student.latestSubmission = log.dateSubmitted;
    }
  });

  // Calculate missing weeks
  studentMap.forEach((student) => {
    for (let w = 1; w <= currentWeek; w++) {
      if (!student.weeksSubmitted.includes(w)) {
        student.weeksMissing.push(w);
      }
    }
  });

  return Array.from(studentMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    "not-started": {
      label: "Not Started",
      className: "bg-gray-100 text-gray-700",
    },
    "in-progress": {
      label: "In Progress",
      className: "bg-blue-100 text-blue-700",
    },
    complete: {
      label: "Completed",
      className: "bg-green-100 text-green-700",
    },
  };
  const info = map[status] || map["not-started"];
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${info.className}`}
    >
      {info.label}
    </span>
  );
}

function StudentRow({ student }: { student: StudentSummary }) {
  const [open, setOpen] = useState(false);

  const submissionRate =
    student.weeksSubmitted.length > 0
      ? Math.round(
          (student.weeksSubmitted.length /
            (student.weeksSubmitted.length + student.weeksMissing.length)) *
            100,
        )
      : 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={`border rounded-lg transition-colors ${
          open ? "bg-muted/30" : "hover:bg-muted/50"
        }`}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-sm font-semibold">
                {student.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{student.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {student.totalSubmissions} submission(s) ·{" "}
                  {student.weeksMissing.length > 0 ? (
                    <span className="text-red-600">
                      {student.weeksMissing.length} missing
                    </span>
                  ) : (
                    <span className="text-green-600">All submitted</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      submissionRate === 100
                        ? "bg-green-500"
                        : submissionRate >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${submissionRate}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">
                  {submissionRate}%
                </span>
              </div>
              {open ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {student.weeksMissing.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-red-600 font-medium mr-1">
                  Missing:
                </span>
                {student.weeksMissing.map((w) => (
                  <span
                    key={w}
                    className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full"
                  >
                    Week {w}
                  </span>
                ))}
              </div>
            )}

            {[...student.worklogs]
              .sort(
                (a, b) =>
                  new Date(b.dateSubmitted).getTime() -
                  new Date(a.dateSubmitted).getTime(),
              )
              .map((log: any, i: number) => (
                <Card key={i}>
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        Week {log.worklogName}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Submitted {log.dateSubmitted}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {log.taskList?.length ?? 0} task(s)
                    </span>
                  </div>
                  <CardContent className="pt-0 px-4 pb-3 space-y-2">
                    {(log.taskList ?? []).map((task: any, ti: number) => (
                      <div
                        key={ti}
                        className="border rounded px-3 py-2 text-sm space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate">
                            {task.taskName || "Untitled"}
                          </p>
                          <StatusBadge status={task.status} />
                        </div>
                        {task.goal && (
                          <p className="text-xs text-muted-foreground">
                            {task.goal}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {task.dueDate}
                            </span>
                          )}
                          {task.collaborators?.filter((c: string) => c).length >
                            0 && (
                            <span>With: {task.collaborators.join(", ")}</span>
                          )}
                        </div>
                        {task.reflection && (
                          <p className="text-xs text-muted-foreground italic">
                            &quot;{task.reflection}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

const InstructorDashboard = () => {
  const userInfo = useAtomValue(userAtom);

  const [search, setSearch] = useState("");
  const worklogInfo = getWorklogDate(new Date("2026-01-26"));
  const currentWeek = worklogInfo ? parseInt(worklogInfo.weekNumber) : 0;

  const { data, isLoading } = useQuery({
    queryKey: ["all-worklogs"],
    queryFn: getAllWorkLogs,
  });

  if (userInfo && userInfo?.role != "instructor") {
    return (
      <>
        <h1>Sorry you dont have access to this page!</h1>;
      </>
    );
  }
  if (isLoading) return <p className="p-4 sm:p-10">Loading</p>;

  const allWorklogs = data ?? [];
  const students = buildStudentSummaries(allWorklogs, currentWeek);

  const filtered = search
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.id.toLowerCase().includes(search.toLowerCase()),
      )
    : students;

  const totalSubmissions = allWorklogs.length;
  const studentsWithMissing = students.filter(
    (s) => s.weeksMissing.length > 0,
  ).length;
  const allTasks = allWorklogs.flatMap((log: any) => log.taskList ?? []);
  const completedTasks = allTasks.filter(
    (t: any) => t.status === "complete",
  ).length;

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <h1 className="text-2xl sm:text-3xl md:text-4xl mb-1">
        Instructor Dashboard
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Week {currentWeek} · Overview of all student submissions
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">
                {students.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">
                {totalSubmissions}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Submissions
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">
                {studentsWithMissing}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Missing Logs
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">
                {completedTasks}
                <span className="text-muted-foreground text-sm font-normal">
                  /{allTasks.length}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Tasks Done</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Users className="h-5 w-5" /> Students
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 ">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {search
                  ? "No students match your search."
                  : "No submissions yet."}
              </p>
            </div>
          ) : (
            filtered.map((student) => (
              <StudentRow key={student.id} student={student} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default InstructorDashboard;
