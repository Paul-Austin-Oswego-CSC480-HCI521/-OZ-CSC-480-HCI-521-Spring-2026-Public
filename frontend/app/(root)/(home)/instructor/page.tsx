"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorklogsForClass,
  updateWorklog,
} from "@/components/custom/utils/api_utils/worklogs/allReq";
import { getUsersFromClass } from "@/components/custom/utils/api_utils/req/req";
import { getClasses } from "@/components/custom/utils/api_utils/req/class";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import getWorklogDate from "@/components/custom/utils/func/getDate";
import { fmtDate, fmtDateTime } from "@/components/custom/utils/func/formatDate";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  CalendarDays,
  Users,
  X,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

function ReviewButton({ log, classID }: { log: any; classID?: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => {
      const id = typeof log._id === "object" ? log._id.$oid : log._id;
      const stripZ = (v: string) => (v ? v.replace("Z", "") : v);
      const body = {
        authorName: log.authorName,
        worklogName: log.worklogName,
        dateCreated: stripZ(log.dateCreated),
        dateSubmitted: stripZ(log.dateSubmitted),
        collaborators: log.collaborators ?? [],
        taskList: (log.taskList ?? []).map((t: any) => ({
          ...t,
          dueDate: t.dueDate ? stripZ(t.dueDate) : t.dueDate,
          creationDate: t.creationDate ? stripZ(t.creationDate) : t.creationDate,
        })),
        reviewed: !log.reviewed,
      };
      return updateWorklog(id, body, classID);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs-for-class"] });
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

type StudentEntry = {
  email: string;
  name: string;
  team: string[];
  log: any;
  logs: any[];
  status: string;
  lateDays: number;
  hasReviewed: boolean;
};

function StatusCell({ entry }: { entry: StudentEntry }) {
  if (entry.status === "submitted") {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">Submitted</p>
          {entry.log?.dateSubmitted && (
            <p className="text-xs text-muted-foreground">
              {fmtDateTime(entry.log.dateSubmitted)} · On Time
            </p>
          )}
        </div>
      </div>
    );
  }
  if (entry.status === "late") {
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-orange-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-orange-700">Late</p>
          {entry.log?.dateSubmitted && (
            <p className="text-xs text-muted-foreground">
              {fmtDateTime(entry.log.dateSubmitted)} · Late by {entry.lateDays}d
            </p>
          )}
        </div>
      </div>
    );
  }
  if (entry.status === "missing") {
    return (
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-700">Missing</p>
          <p className="text-xs text-muted-foreground">No submission</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
      <p className="text-sm text-muted-foreground">Pending</p>
    </div>
  );
}

function StudentRowFlat({
  student,
  onOpenHistory,
  onOpenReview,
}: {
  student: StudentEntry;
  onOpenHistory: () => void;
  onOpenReview: () => void;
}) {
  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasSubmissions = student.logs.length > 0;

  return (
    <div
      onClick={onOpenHistory}
      className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/40 transition-colors"
    >
      {/* Student */}
      <div className="col-span-4 flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-sm font-semibold">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{student.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {student.email}
          </p>
        </div>
      </div>

      {/* Team */}
      <div className="col-span-3 flex flex-wrap gap-1">
        {student.team
          .filter((t) => t.toLowerCase() !== "unassigned")
          .map((t) => (
            <span
              key={t}
              className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md px-2 py-0.5"
            >
              {t}
            </span>
          ))}
        {student.team.filter((t) => t.toLowerCase() !== "unassigned")
          .length === 0 && (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      {/* Status */}
      <div className="col-span-3">
        <StatusCell entry={student} />
      </div>

      {/* Mark as Reviewed */}
      <div
        className="col-span-2 flex items-center justify-end gap-1"
        onClick={(e) => {
          e.stopPropagation();
          if (hasSubmissions) onOpenReview();
        }}
      >
        {!hasSubmissions ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : student.hasReviewed ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-green-100 text-green-800 border border-green-200 cursor-pointer">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Reviewed
          </span>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs cursor-pointer"
          >
            Review
          </Button>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function StudentDetailDialog({
  student,
  selectedWeek,
  allStudentLogs,
  maxWeek,
  mode,
  open,
  onClose,
  classID,
}: {
  student: StudentEntry | null;
  selectedWeek: number;
  allStudentLogs: any[];
  maxWeek: number;
  mode: "week" | "history";
  open: boolean;
  onClose: () => void;
  classID?: string;
}) {
  if (!student) return null;

  // Group logs by week (final submissions only — drafts already filtered upstream)
  const logsByWeek = new Map<number, any[]>();
  allStudentLogs.forEach((log) => {
    const w = parseInt(String(log.worklogName));
    if (isNaN(w)) return;
    if (!logsByWeek.has(w)) logsByWeek.set(w, []);
    logsByWeek.get(w)!.push(log);
  });
  logsByWeek.forEach((logs) =>
    logs.sort(
      (a, b) =>
        new Date(b.dateSubmitted).getTime() -
        new Date(a.dateSubmitted).getTime(),
    ),
  );

  const weekRows: { week: number; logs: any[] }[] = [];
  for (let w = maxWeek; w >= 1; w--) {
    weekRows.push({ week: w, logs: logsByWeek.get(w) ?? [] });
  }

  const totalSubmittedWeeks = weekRows.filter((w) => w.logs.length > 0).length;
  const totalReviewedWeeks = weekRows.filter(
    (w) => w.logs[0]?.reviewed === true,
  ).length;

  // Week-mode focused view: just the selected week's submissions
  const selectedWeekLogs = logsByWeek.get(selectedWeek) ?? [];
  const selectedWeekLatest = selectedWeekLogs[0] ?? null;

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent
        className="p-0 overflow-hidden"
        style={{
          maxWidth: "1100px",
          width: "min(92vw, 1100px)",
          left: "calc(50% + 8rem)",
        }}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-base font-semibold">
              {student.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="min-w-0">
              <AlertDialogTitle className="text-lg font-semibold truncate">
                {student.name}
              </AlertDialogTitle>
              <p className="text-sm text-muted-foreground truncate">
                {student.email}
                {mode === "week" && <> · Week {selectedWeek}</>}
              </p>
              {mode === "history" && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalSubmittedWeeks} / {maxWeek} weeks submitted ·{" "}
                  {totalReviewedWeeks} reviewed
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {mode === "week" && selectedWeekLatest && (
              <ReviewButton log={selectedWeekLatest} classID={classID} />
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-3">
          {mode === "week" ? (
            selectedWeekLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No submissions for week {selectedWeek}.
              </p>
            ) : (
              selectedWeekLogs.map((log: any, li: number) => (
                <SubmissionCollapsible
                  key={li}
                  log={log}
                  subNum={selectedWeekLogs.length - li}
                  isLatest={li === 0}
                  defaultOpen={li === 0}
                />
              ))
            )
          ) : (
            weekRows.map(({ week, logs }) => (
              <WeekSection
                key={week}
                week={week}
                logs={logs}
                isSelectedWeek={week === selectedWeek}
                classID={classID}
              />
            ))
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function WeekSection({
  week,
  logs,
  isSelectedWeek,
  classID,
}: {
  week: number;
  logs: any[];
  isSelectedWeek: boolean;
  classID?: string;
}) {
  const [open, setOpen] = useState(isSelectedWeek);
  const latestLog = logs[0] ?? null;
  const hasSubmissions = logs.length > 0;

  // Status calculation — same rules as the main page
  const semStart = new Date("2026-01-26T00:00:00");
  const dueDate = new Date(semStart);
  dueDate.setDate(dueDate.getDate() + week * 7);
  dueDate.setHours(23, 59, 0, 0);
  const isPastDue = new Date() > dueDate;

  let status: "submitted" | "late" | "missing" | "pending" = isPastDue
    ? "missing"
    : "pending";
  let lateDays = 0;
  if (latestLog) {
    const submitted = new Date(latestLog.dateSubmitted);
    const diff = Math.floor(
      (submitted.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    status = diff > 0 ? "late" : "submitted";
    lateDays = diff > 0 ? diff : 0;
  }

  const statusBadge = (() => {
    if (status === "submitted")
      return (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-green-100 text-green-800 inline-flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Submitted
        </span>
      );
    if (status === "late")
      return (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800 inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Late {lateDays}d
        </span>
      );
    if (status === "missing")
      return (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700 inline-flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Missing
        </span>
      );
    return (
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  })();

  return (
    <Collapsible
      open={open && hasSubmissions}
      onOpenChange={(o) => hasSubmissions && setOpen(o)}
    >
      <div
        className={cn(
          "border rounded-lg overflow-hidden",
          isSelectedWeek && "ring-2 ring-amber-300",
        )}
      >
        <CollapsibleTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3",
              hasSubmissions && "cursor-pointer hover:bg-muted/40",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {hasSubmissions ? (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                    open ? "" : "-rotate-90",
                  )}
                />
              ) : (
                <span className="h-4 w-4 shrink-0" />
              )}
              <p className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                Week {week}
                {isSelectedWeek && (
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: "rgba(245, 158, 11, 0.2)",
                      color: "#92400e",
                    }}
                  >
                    Selected
                  </span>
                )}
                {statusBadge}
              </p>
            </div>
            <div
              className="flex items-center gap-3 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {hasSubmissions && (
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {logs.length} submission{logs.length === 1 ? "" : "s"} ·{" "}
                  {fmtDateTime(latestLog.dateSubmitted)}
                </p>
              )}
              {hasSubmissions && latestLog && (
                <ReviewButton log={latestLog} classID={classID} />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2 border-t pt-3">
            {logs.map((log: any, li: number) => (
              <SubmissionCollapsible
                key={li}
                log={log}
                subNum={logs.length - li}
                isLatest={li === 0}
                defaultOpen={li === 0}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function SubmissionCollapsible({
  log,
  subNum,
  isLatest,
  defaultOpen,
}: {
  log: any;
  subNum: number;
  isLatest: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40">
            <div className="min-w-0">
              <p className="text-sm font-semibold flex items-center gap-2">
                Submission {subNum}
                {isLatest && (
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: "rgba(30, 75, 53, 0.1)",
                      color: "#1E4B35",
                    }}
                  >
                    Latest
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Submitted {fmtDateTime(log.dateSubmitted)} ·{" "}
                {log.taskList?.length ?? 0} task(s)
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                open ? "" : "-rotate-90",
              )}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {(log.taskList ?? []).map((task: any, ti: number) => (
              <div
                key={ti}
                className="border rounded-lg px-3 py-2 text-sm space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    Task {ti + 1}: {task.taskName || "Untitled"}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      task.status === "complete"
                        ? "bg-green-100 text-green-700"
                        : task.status === "in-progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {task.status === "complete"
                      ? "Completed"
                      : task.status === "in-progress"
                        ? "In Progress"
                        : "Not Started"}
                  </span>
                </div>
                {task.goal && (
                  <p className="text-xs text-muted-foreground">{task.goal}</p>
                )}
                <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {fmtDate(task.dueDate)}
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
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

const InstructorDashboard = () => {
  const userInfo = useAtomValue(userAtom);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const worklogInfo = getWorklogDate(semesterStart);
  const maxWeek = worklogInfo ? parseInt(worklogInfo.weekNumber) : 1;

  const [selectedWeek, setSelectedWeek] = useState(maxWeek - 1);
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"week" | "history">("history");
  const [showAll, setShowAll] = useState(false);
  const ROW_LIMIT = 10;

  const {
    data: classesData,
    isLoading: classesLoading,
    error: classesError,
  } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
    enabled: userInfo?.role === "instructor",
  });

  const activeClass = (classesData ?? []).find((c: any) => !c.isArchived) ?? null;
  const activeClassID = activeClass?.classID ?? "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["worklogs-for-class", activeClassID],
    queryFn: () => getWorklogsForClass(activeClassID),
    enabled: !!activeClassID,
  });

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["users-from-class", activeClassID],
    queryFn: () => getUsersFromClass(activeClassID),
    enabled: !!activeClassID,
  });

  if (!mounted || !userInfo) {
    return <p className="p-4 sm:p-10">Loading...</p>;
  }

  if (userInfo.role !== "instructor") {
    return <h1 className="p-4 sm:p-10">Sorry you do not have access to this page</h1>;
  }

  if (classesLoading) return <p className="p-4 sm:p-10">Loading...</p>;
  if (classesError)
    return (
      <div className="p-4 sm:p-10">
        <p className="text-red-600 font-medium">Failed to load classes</p>
        <p className="text-sm text-muted-foreground mt-1">
          {(classesError as any)?.message}
        </p>
      </div>
    );

  if (!activeClass) {
    return (
      <div className="p-4 sm:p-6 md:p-10">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No active class. Create a new class or unarchive an existing one
              to view your dashboard.
            </p>
            <Link href="/instructor/classes">
              <Button variant="outline" className="gap-2 cursor-pointer">
                <Users className="h-4 w-4" />
                Manage Classes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  // Build lookups from users data
  const userNameMap = new Map<string, string>();
  const userTeamMap = new Map<string, string[]>();
  allUsersRaw.forEach((u: any) => {
    if (u.email && u.name) userNameMap.set(u.email, u.name);
    if (u.email) userTeamMap.set(u.email, u.team ?? []);
  });

  // Build per-student status for selected week
  const studentStatuses: StudentEntry[] = allStudents.map((email: string) => {
    const logs = weekLogs
      .filter((l: any) => l.authorName === email && !l.isDraft)
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
      const submitted = new Date(latestLog.dateSubmitted);
      const diff = Math.floor(
        (submitted.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      status = diff > 0 ? "late" : "submitted";
      lateDays = diff > 0 ? diff : 0;
    }

    const name = userNameMap.get(email) || email;
    const team = userTeamMap.get(email) ?? [];
    // "Reviewed" reflects the latest submission only — instructor reviews the current version.
    const hasReviewed = latestLog?.reviewed === true;
    return { email, name, team, log: latestLog, logs, status, lateDays, hasReviewed };
  });

  // Stats for selected week
  const totalStudents = allStudents.length;
  const submitted = studentStatuses.filter((s: any) => s.status === "submitted").length;
  const late = studentStatuses.filter((s: any) => s.status === "late").length;
  const missing = studentStatuses.filter((s: any) => s.status === "missing").length;
  const pending = studentStatuses.filter((s: any) => s.status === "pending").length;
  const reviewed = studentStatuses.filter(
    (s: any) => s.logs.some((l: any) => l.reviewed === true),
  ).length;

  // Search filter
  const filtered = search
    ? studentStatuses.filter((s: any) =>
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()),
      )
    : studentStatuses;

  const visibleRows = showAll ? filtered : filtered.slice(0, ROW_LIMIT);
  const firstName = userInfo?.name?.split(" ")[0] || "Instructor";

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5 sm:mb-6">
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2"
          style={{ color: "#1E4B35" }}
        >
          <span>👋</span> Hello, {firstName}.
        </h1>
        <div className="flex items-center gap-3 border rounded-lg px-4 py-2 bg-white shrink-0 self-start">
          <div className="h-9 w-9 rounded bg-amber-100 flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5 text-amber-700" />
          </div>
          <div className="whitespace-nowrap">
            <p className="text-xs text-muted-foreground">Week Status</p>
            <p className="text-sm font-semibold">
              Week {Math.max(1, maxWeek - 1)} of 16
            </p>
          </div>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex justify-start mb-5 sm:mb-6">
        <div className="flex items-center gap-3 border rounded-xl bg-white shadow-sm px-3 py-2.5 min-w-[260px]">
          <Button
            variant="ghost"
            size="icon"
            disabled={selectedWeek <= 1}
            onClick={() => setSelectedWeek((w) => w - 1)}
            className="cursor-pointer h-8 w-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center flex-1">
            {selectedWeek === maxWeek - 1 && (
              <p
                className="text-[10px] uppercase tracking-wider font-semibold"
                style={{ color: "#1E4B35" }}
              >
                Current Week
              </p>
            )}
            {selectedWeek >= maxWeek && (
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Upcoming
              </p>
            )}
            <p
              className="text-lg font-bold leading-tight"
              style={{ color: "#1E4B35" }}
            >
              Week {selectedWeek}
            </p>
            <p className="text-xs text-muted-foreground">
              {getWeekRange(selectedWeek)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            disabled={selectedWeek >= maxWeek}
            onClick={() => setSelectedWeek((w) => w + 1)}
            className="cursor-pointer h-8 w-8"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-muted/40 rounded-xl p-3 sm:p-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-[11px] uppercase tracking-wider font-semibold text-green-800">
                  Submitted
                </p>
              </div>
              <p className="text-2xl font-bold">
                {submitted + late}
                <span className="text-muted-foreground text-sm font-normal ml-1">
                  / {totalStudents}
                </span>
              </p>
            </CardContent>
          </Card>
          <Card
            className={cn(
              "border-0 shadow-sm border-l-4",
              "border-l-orange-400",
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <p className="text-[11px] uppercase tracking-wider font-semibold text-orange-700">
                  Late
                </p>
              </div>
              <p className="text-2xl font-bold">
                {late}
                <span className="text-muted-foreground text-sm font-normal ml-1">
                  / {totalStudents} logs
                </span>
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-red-50/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <p className="text-[11px] uppercase tracking-wider font-semibold text-red-700">
                  Missing
                </p>
              </div>
              <p className="text-2xl font-bold">
                {missing}
                <span className="text-muted-foreground text-sm font-normal ml-1">
                  / {totalStudents} logs
                </span>
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="h-4 w-4" style={{ color: "#1E4B35" }} />
                <p
                  className="text-[11px] uppercase tracking-wider font-semibold"
                  style={{ color: "#1E4B35" }}
                >
                  Reviewed
                </p>
              </div>
              <p className="text-2xl font-bold">
                {reviewed}
                <span className="text-muted-foreground text-sm font-normal ml-1">
                  / {totalStudents} logs
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Work Logs */}
      <h2
        className="text-xl sm:text-2xl font-bold mb-3"
        style={{ color: "#1E4B35" }}
      >
        Review Work Logs
      </h2>
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-sm cursor-default"
            >
              All Teams <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-sm cursor-default"
            >
              Status <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-sm cursor-default"
            >
              Review Status <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students or teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table header */}
        <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/40 border-b">
          <div className="col-span-4">Student</div>
          <div className="col-span-3">Team</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Mark as Reviewed</div>
        </div>

        {/* Rows */}
        <div>
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {search ? "No students match your search." : "No students found."}
              </p>
            </div>
          ) : (
            visibleRows.map((student) => (
              <StudentRowFlat
                key={student.email}
                student={student}
                onOpenHistory={() =>
                  router.push(
                    `/instructor/students/${encodeURIComponent(student.email)}`,
                  )
                }
                onOpenReview={() => {
                  setDialogMode("week");
                  setSelectedEmail(student.email);
                }}
              />
            ))
          )}
        </div>

        {/* View All */}
        {filtered.length > ROW_LIMIT && (
          <div className="border-t bg-muted/20 px-4 py-3 text-center">
            <Button
              type="button"
              variant="ghost"
              className="text-sm cursor-pointer"
              style={{ color: "#1E4B35" }}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? "Show Less"
                : `View All Students (${filtered.length})`}
            </Button>
          </div>
        )}
      </Card>

      <StudentDetailDialog
        student={
          selectedEmail
            ? studentStatuses.find((s) => s.email === selectedEmail) ?? null
            : null
        }
        selectedWeek={selectedWeek}
        allStudentLogs={
          selectedEmail
            ? allWorklogs.filter(
                (l: any) => l.authorName === selectedEmail && !l.isDraft,
              )
            : []
        }
        maxWeek={maxWeek}
        mode={dialogMode}
        open={!!selectedEmail}
        onClose={() => setSelectedEmail(null)}
        classID={activeClassID}
      />
    </div>
  );
};
export default InstructorDashboard;
