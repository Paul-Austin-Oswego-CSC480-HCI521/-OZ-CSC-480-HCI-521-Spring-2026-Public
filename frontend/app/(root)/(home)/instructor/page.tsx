"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllWorkLogs, updateWorklog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { getAllUsers } from "@/components/custom/utils/api_utils/req/req";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import getWorklogDate from "@/components/custom/utils/func/getDate";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  AlertTriangle,
  XCircle,
  CalendarDays,
} from "lucide-react";

const semesterStart = new Date("2026-01-26T00:00:00");

function getWeekRange(week: number) {
  const start = new Date(semesterStart);
  start.setDate(start.getDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
  return `${fmt(start)} - ${fmt(end)}`;
}

function ReviewButton({ log }: { log: any }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => {
      const id = typeof log._id === "object" ? log._id.$oid : log._id;
      const body = {
        authorName: log.authorName,
        worklogName: log.worklogName,
        dateCreated: log.dateCreated,
        dateSubmitted: log.dateSubmitted,
        collaborators: log.collaborators ?? [],
        taskList: log.taskList ?? [],
        reviewed: !log.reviewed,
      };
      return updateWorklog(id, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-worklogs"] });
    },
  });

  const isReviewed = log.reviewed === true;

  return (
    <Button
      type="button"
      variant={isReviewed ? "default" : "outline"}
      size="sm"
      disabled={mutation.isPending}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
      className={
        isReviewed
          ? "relative z-10 bg-green-600 hover:bg-green-700 text-white text-xs cursor-pointer"
          : "relative z-10 text-xs cursor-pointer"
      }
    >
      {isReviewed ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Reviewed
        </>
      ) : (
        <>
          <Clock className="h-3.5 w-3.5 mr-1" />
          Review
        </>
      )}
    </Button>
  );
}

function StudentRow({ student }: { student: { email: string; name: string; log: any; logs: any[]; status: string; lateDays: number } }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`border rounded-lg mb-2 ${open ? "bg-muted/30" : "hover:bg-muted/50"}`}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between py-3 gap-4 cursor-pointer hover:bg-muted/50 px-1 rounded">
            <div className="flex items-center gap-3 min-w-0">
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
              />
              <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-sm font-semibold">
                {student.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {student.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {student.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {student.status === "submitted" && (
                <span className="text-xs font-medium text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Submitted
                </span>
              )}
              {student.status === "late" && (
                <span className="text-xs font-medium text-yellow-700 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Late ({student.lateDays}d)
                </span>
              )}
              {student.status === "missing" && (
                <span className="text-xs font-medium text-red-700 flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" />
                  Missing
                </span>
              )}
              {student.status === "pending" && (
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Pending
                </span>
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {student.logs.length > 0 ? (
            <div className="pl-16 pr-4 pb-4 space-y-3">
              {student.logs.map((log: any, li: number) => (
                <div key={li} className="space-y-2 border rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Submission {student.logs.length - li} · Submitted {log.dateSubmitted} · {log.taskList?.length ?? 0} task(s)
                    </p>
                    <ReviewButton log={log} />
                  </div>
                  {(log.taskList ?? []).map((task: any, ti: number) => (
                    <div
                      key={ti}
                      className="border rounded-lg px-4 py-3 text-sm space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{task.taskName || "Untitled"}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          task.status === "complete" ? "bg-green-100 text-green-700" :
                          task.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {task.status === "complete" ? "Completed" :
                           task.status === "in-progress" ? "In Progress" : "Not Started"}
                        </span>
                      </div>
                      {task.goal && (
                        <p className="text-xs text-muted-foreground">{task.goal}</p>
                      )}
                      <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {task.dueDate}
                          </span>
                        )}
                        {task.collaborators?.filter((c: string) => c).length > 0 && (
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
                </div>
              ))}
            </div>
          ) : (
            <div className="pl-16 pr-4 pb-4">
              <p className="text-sm text-muted-foreground">No submission for this week.</p>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

const InstructorDashboard = () => {
  const userInfo = useAtomValue(userAtom);

  if (userInfo && userInfo?.role != "instructor") {
    return (
      <>
        <h1>Sorry you dont have access to this page!</h1>
      </>
    );
  }

  const worklogInfo = getWorklogDate(semesterStart);
  const maxWeek = worklogInfo ? parseInt(worklogInfo.weekNumber) : 1;

  const [selectedWeek, setSelectedWeek] = useState(maxWeek - 1);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["all-worklogs"],
    queryFn: getAllWorkLogs,
  });

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["all-users"],
    queryFn: getAllUsers,
  });

  if (isLoading || usersLoading) return <p className="p-4 sm:p-10">Loading</p>;
  if (error || usersError) return (
    <div className="p-4 sm:p-10">
      <p className="text-red-600 font-medium">Failed to load data</p>
      <p className="text-sm text-muted-foreground mt-1">{(error as any)?.message || (usersError as any)?.message}</p>
    </div>
  );

  const allWorklogs = data ?? [];
  const allUsersRaw = usersData ?? [];

  // Get student emails from the users endpoint (exclude instructors)
  const allStudents = allUsersRaw
    .filter((u: any) => u.role === "student")
    .map((u: any) => u.email)
    .sort();

  // Filter worklogs for selected week
  const weekLogs = allWorklogs.filter(
    (log: any) => parseInt(log.worklogName) === selectedWeek,
  );

  // Build a name lookup from users data
  const userNameMap = new Map<string, string>();
  allUsersRaw.forEach((u: any) => {
    if (u.email && u.name) userNameMap.set(u.email, u.name);
  });

  // Build per-student status for selected week
  const studentStatuses = allStudents.map((email: string) => {
    const logs = weekLogs
      .filter((l: any) => l.authorName === email)
      .sort((a: any, b: any) =>
        new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime(),
      );
    const latestLog = logs[0] ?? null;
    const semStart = new Date("2026-01-26T00:00:00");
    const dueDate = new Date(semStart);
    dueDate.setDate(dueDate.getDate() + selectedWeek * 7);
    dueDate.setHours(23, 59, 0, 0);

    const isPastDue = new Date() > dueDate;
    let status: "submitted" | "late" | "missing" | "pending" = isPastDue ? "missing" : "pending";
    let lateDays = 0;

    if (latestLog) {
      const submitted = new Date(latestLog.dateSubmitted + "T00:00:00");
      const diff = Math.floor(
        (submitted.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      status = diff > 0 ? "late" : "submitted";
      lateDays = diff > 0 ? diff : 0;
    }

    const name = userNameMap.get(email) || email;
    return { email, name, log: latestLog, logs, status, lateDays };
  });

  // Stats for selected week
  const totalStudents = allStudents.length;
  const submitted = studentStatuses.filter((s) => s.status === "submitted").length;
  const late = studentStatuses.filter((s) => s.status === "late").length;
  const missing = studentStatuses.filter((s) => s.status === "missing").length;
  const pending = studentStatuses.filter((s) => s.status === "pending").length;
  const reviewed = studentStatuses.filter(
    (s) => s.logs.some((l: any) => l.reviewed === true),
  ).length;

  // Search filter
  const filtered = search
    ? studentStatuses.filter((s) =>
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()),
      )
    : studentStatuses;

  return (
    <div className="p-4 sm:p-6 md:p-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
          Hello, {userInfo?.name?.split(" ")[0] || "Instructor"}.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          HCI 521/CSC 480 · Spring 2026
        </p>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          disabled={selectedWeek <= 1}
          onClick={() => setSelectedWeek((w) => w - 1)}
          className="cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          {selectedWeek === maxWeek - 1 && (
            <p className="text-xs text-muted-foreground font-medium">Current Week</p>
          )}
          {selectedWeek >= maxWeek && (
            <p className="text-xs text-muted-foreground font-medium">Upcoming</p>
          )}
          <p className="text-xl font-bold">Week {selectedWeek}</p>
          <p className="text-xs text-muted-foreground">
            {getWeekRange(selectedWeek)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          disabled={selectedWeek >= maxWeek}
          onClick={() => setSelectedWeek((w) => w + 1)}
          className="cursor-pointer"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Stats */}
      {(() => {
        const isPastWeek = selectedWeek < maxWeek - 1;
        return (
          <div className={`grid ${isPastWeek ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"} gap-3 sm:gap-4 mb-6 ${isPastWeek ? "" : "max-w-md"}`}>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  Submitted
                </p>
                <p className="text-2xl font-bold">
                  {submitted + late}
                  <span className="text-muted-foreground text-sm font-normal">
                    /{totalStudents}
                  </span>
                </p>
              </CardContent>
            </Card>
            {isPastWeek && (
              <>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-3.5 w-3.5 text-yellow-600" />
                      Late
                    </p>
                    <p className="text-2xl font-bold">
                      {late}
                      <span className="text-muted-foreground text-sm font-normal">
                        /{totalStudents}
                      </span>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      Missing
                    </p>
                    <p className="text-2xl font-bold">
                      {missing}
                      <span className="text-muted-foreground text-sm font-normal">
                        /{totalStudents}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                  Reviewed
                </p>
                <p className="text-2xl font-bold">
                  {reviewed}
                  <span className="text-muted-foreground text-sm font-normal">
                    /{totalStudents}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Review Work Logs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <CardTitle className="text-lg sm:text-xl">
              Review Work Logs
            </CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-sm cursor-default">
                  All Teams <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-sm cursor-default">
                  Status <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  {search ? "No students match your search." : "No students found."}
                </p>
              </div>
            ) : (
              filtered.map((student) => (
                <StudentRow key={student.email} student={student} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default InstructorDashboard;
