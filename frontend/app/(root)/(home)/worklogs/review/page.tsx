"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { isInstructorRole, userAtom, worklogEditAtom } from "@/components/custom/utils/context/state";
import {
  getWorkLog,
  getDraftForWeek,
} from "@/components/custom/utils/api_utils/worklogs/allReq";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Pencil,
  ClipboardCheck,
  User,
} from "lucide-react";
import { fmtDate, fmtDateTime } from "@/components/custom/utils/func/formatDate";
import { Suspense, useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/custom/ui/Breadcrumbs";

const statusLabel: Record<string, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  complete: "Completed",
};

const ACCENT_GREEN = "#1E4B35";

function statusBadgeClass(status: string): string {
  switch (status) {
    case "complete":
      return "bg-emerald-700 text-white";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function TaskCollapsible({ task, taskNum }: { task: any; taskNum: number }) {
  const [open, setOpen] = useState(true);
  const collabList = (task.collaborators ?? []).filter((c: string) => c);
  const hasCollabs = collabList.length > 0;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-xl bg-white">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 sm:px-5 cursor-pointer hover:bg-muted/40 rounded-t-xl">
            <h3
              className="text-base sm:text-lg font-bold"
              style={{ color: ACCENT_GREEN }}
            >
              Task {taskNum}: {task.taskName}
            </h3>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 sm:px-5 space-y-4 border-t pt-4">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                Task Name
              </p>
              <p className="text-sm">{task.taskName}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                Main Goal
              </p>
              <p className="text-sm whitespace-pre-wrap">{task.goal}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                  Deadline
                </p>
                <p className="text-sm font-semibold">
                  {fmtDate(task.dueDate)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                  Task Status
                </p>
                <span
                  className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded ${statusBadgeClass(task.status)}`}
                >
                  {statusLabel[task.status] ?? task.status}
                </span>
              </div>
            </div>
            {hasCollabs && (
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">
                  Collaborators
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {collabList.map((c: string, j: number) => (
                    <span
                      key={j}
                      className="text-xs bg-white border rounded-md px-2 py-1 inline-flex items-center gap-1"
                    >
                      <User className="h-3 w-3 text-muted-foreground" />
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {hasCollabs && task.collabDescription && (
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                  How did you work with collaborator(s)
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {task.collabDescription}
                </p>
              </div>
            )}
            {task.reflection && (
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                  Reflection
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {task.reflection}
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function SubmissionCollapsible({
  submission,
  subNum,
  defaultOpen,
}: {
  submission: any;
  subNum: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-l-4 rounded-xl bg-white overflow-hidden" style={{ borderLeftColor: ACCENT_GREEN }}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 sm:px-5 cursor-pointer bg-muted/40 hover:bg-muted/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-5 w-5" style={{ color: ACCENT_GREEN }} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold">
                  Work Log Submission {subNum}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  Submitted on {fmtDateTime(submission.dateSubmitted)}
                </p>
              </div>
            </div>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 sm:p-5 space-y-4 bg-white">
            {(submission.taskList ?? []).map((task: any, i: number) => (
              <TaskCollapsible key={i} task={task} taskNum={i + 1} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const weekNum = searchParams.get("week");
  const userInfo = useAtomValue(userAtom);
  const setWorklogEdit = useSetAtom(worklogEditAtom);

  const { data, isLoading, error } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  const { data: draft, isLoading: draftLoading } = useQuery({
    queryKey: ["worklog-draft", userInfo?.email, weekNum],
    enabled: !!userInfo?.email && !!weekNum,
    queryFn: () => getDraftForWeek(userInfo?.email, weekNum ?? undefined),
  });

  const worklogs = data ?? [];
  const weekSubmissions = worklogs
    .filter(
      (log: any) =>
        String(log.worklogName) === weekNum && !log.isDraft,
    )
    .sort(
      (a: any, b: any) =>
        new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime(),
    );

  const shouldRedirectToDraft =
    !isLoading &&
    !draftLoading &&
    !!weekNum &&
    weekSubmissions.length === 0 &&
    !!draft;

  useEffect(() => {
    if (shouldRedirectToDraft) {
      router.replace(`/worklogs?week=${weekNum}&mode=new`);
    }
  }, [shouldRedirectToDraft, router, weekNum]);

  if (isLoading || draftLoading) return <p className="p-6">Loading...</p>;
  if (error) return (
    <div className="p-6">
      <p className="text-red-600 font-medium">Failed to load worklogs</p>
      <p className="text-sm text-muted-foreground mt-1">{(error as any)?.message}</p>
    </div>
  );
  if (!weekNum) return <p className="p-6">No week specified.</p>;

  if (shouldRedirectToDraft) {
    return <p className="p-6">Opening draft...</p>;
  }

  if (weekSubmissions.length === 0 && !draft) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <p className="text-muted-foreground">No submissions found for Week {weekNum}.</p>
        <Button
          variant="outline"
          className="mt-4 gap-2"
          onClick={() => router.push("/notifications")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Work Log Status
        </Button>
      </div>
    );
  }

  const latest = weekSubmissions[0];

  const handleResubmit = () => {
    if (!latest) return;
    setWorklogEdit({
      mode: "resubmit",
      weekNumber: weekNum,
      tasks: latest.taskList,
      previousSubmissions: weekSubmissions,
    });
    router.push(`/worklogs?week=${weekNum}&mode=resubmit`);
  };

  const handleOpenDraft = () => {
    router.push(`/worklogs?week=${weekNum}&mode=new`);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full">
      <Breadcrumbs
        items={[
          { label: "Weekly Logs", href: "/notifications" },
          { label: `Week ${weekNum} Log` },
        ]}
      />

      {(() => {
        const SEMESTER_START = new Date("2026-01-26T00:00:00");
        const weekIdx = parseInt(weekNum) - 1;
        const weekStart = new Date(SEMESTER_START);
        weekStart.setDate(weekStart.getDate() + weekIdx * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const dueDate = new Date(weekStart);
        dueDate.setDate(dueDate.getDate() + 7);
        dueDate.setHours(23, 59, 0, 0);
        const fmtMD = (d: Date) =>
          d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const fmtDue = (d: Date) =>
          `${d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}, ${d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}`;
        return (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold"
                style={{ color: "#1E4B35" }}
              >
                Week {weekNum} ({fmtMD(weekStart)} - {fmtMD(weekEnd)})
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Due: {fmtDue(dueDate)}
              </p>
            </div>
            {weekSubmissions.length > 0 && (
              <Button
                className="shrink-0 rounded-lg font-semibold text-zinc-900 border-0 hover:opacity-90"
                style={{ backgroundColor: "#f59e0b" }}
                onClick={handleResubmit}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Create Resubmission
              </Button>
            )}
          </div>
        );
      })()}

      <div className="space-y-4">
        {draft && (
          <div
            onClick={handleOpenDraft}
            className="border-2 border-amber-300 bg-amber-50 rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-amber-200 flex items-center justify-center shrink-0">
                  <Pencil className="h-5 w-5 text-amber-800" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-amber-900">
                    Draft in progress
                  </h2>
                  <p className="text-xs text-amber-800 mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last saved{" "}
                    {fmtDateTime(
                      draft.dateSubmitted ||
                        draft.dateCreated ||
                        new Date().toISOString(),
                    )}
                    {" · "}
                    {(draft.taskList ?? []).length} task
                    {(draft.taskList ?? []).length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-amber-800 shrink-0">
                <span className="text-sm font-medium hidden sm:inline">
                  Continue editing
                </span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        )}
        {weekSubmissions.map((submission: any, si: number) => {
          const subNum = weekSubmissions.length - si;
          const isLatest = si === 0;
          return (
            <SubmissionCollapsible
              key={si}
              submission={submission}
              subNum={subNum}
              defaultOpen={isLatest && !draft}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const userInfo = useAtomValue(userAtom);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !userInfo) {
    return <p className="p-4 sm:p-10">Loading...</p>;
  }

  if (isInstructorRole(userInfo.role)) {
    return <h1 className="p-4 sm:p-10">Sorry you do not have access to this page</h1>;
  }

  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <ReviewContent />
    </Suspense>
  );
}
