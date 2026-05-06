"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, worklogEditAtom } from "@/components/custom/utils/context/state";
import {
  getWorkLog,
  getDraftForWeek,
} from "@/components/custom/utils/api_utils/worklogs/allReq";
import { getClass } from "@/components/custom/utils/api_utils/req/class";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";

const FALLBACK_SEMESTER_START = new Date("2026-01-26T00:00:00");
const FALLBACK_TOTAL_WEEKS = 16;

function calendarDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function parseClassDate(s: string | undefined | null): Date | null {
  if (!s) return null;
  try {
    const cleaned = s.replace(/\[[^\]]+\]$/, "");
    const d = new Date(cleaned);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

const Welcome = () => {
  const router = useRouter();
  const userInfo = useAtomValue(userAtom);
  const worklogEdit = useAtomValue(worklogEditAtom);
  const setWorklogEdit = useSetAtom(worklogEditAtom);
  const displayName =
    userInfo?.preferredName?.trim()?.split(" ")[0] ||
    userInfo?.name?.split(" ")[0] ||
    "there";

  const { data: classData } = useQuery({
    queryKey: ["class", userInfo?.classID],
    enabled: !!userInfo?.classID,
    queryFn: () => getClass(userInfo!.classID!),
  });

  const classStartDate =
    parseClassDate(classData?.semesterStartDate) ?? FALLBACK_SEMESTER_START;
  const classEndDate = parseClassDate(classData?.semsesterEndDate);
  const totalWeeks = classEndDate
    ? Math.max(
        1,
        Math.ceil(calendarDaysBetween(classStartDate, classEndDate) / 7),
      )
    : FALLBACK_TOTAL_WEEKS;

  const today = new Date();
  const daysSinceStart = calendarDaysBetween(classStartDate, today);
  const rawWeekNum = Math.max(0, Math.floor(daysSinceStart / 7) + 1);
  // Cap the current week at the actual semester length so it doesn't
  // overshoot once today is past the semester end date.
  const weekNum = classEndDate ? Math.min(rawWeekNum, totalWeeks) : rawWeekNum;
  const weekNumber = String(weekNum);

  const currentDeadline = new Date(classStartDate);
  currentDeadline.setDate(currentDeadline.getDate() + weekNum * 7);
  currentDeadline.setHours(23, 59, 0, 0);
  const dueLabel =
    weekNum > 0
      ? currentDeadline.toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null;

  const { data } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  const { data: serverDraft } = useQuery({
    queryKey: ["worklog-draft", userInfo?.email, weekNumber],
    enabled: !!userInfo?.email && !!weekNumber,
    queryFn: () => getDraftForWeek(userInfo?.email, weekNumber),
  });

  const worklogs = data ?? [];
  const hasSubmission = worklogs.some(
    (log: { worklogName?: string | number; isDraft?: boolean }) =>
      String(log.worklogName) === weekNumber && !log.isDraft,
  );
  const hasServerDraft = !!serverDraft?.taskList?.length;
  const hasDraft =
    hasServerDraft ||
    (worklogEdit?.weekNumber === weekNumber && worklogEdit.mode === "new");

  let buttonLabel: string;
  let handleClick: () => void;
  let badgeLabel: string;
  let badgeClass: string;

  if (hasSubmission) {
    buttonLabel = "Review Work Log";
    handleClick = () => router.push(`/worklogs/review?week=${weekNumber}`);
    badgeLabel = "SUBMITTED";
    badgeClass = "bg-green-100 text-green-900";
  } else if (hasDraft) {
    buttonLabel = "Continue Work Log";
    handleClick = () => {
      setWorklogEdit(null);
      router.push(`/worklogs?week=${weekNumber}&mode=new`);
    };
    badgeLabel = "IN PROGRESS";
    badgeClass = "bg-amber-100 text-amber-900";
  } else {
    buttonLabel = "Start Work Log";
    handleClick = () => {
      setWorklogEdit({ mode: "new", weekNumber });
      router.push(`/worklogs?week=${weekNumber}&mode=new`);
    };
    badgeLabel = "NOT STARTED";
    badgeClass = "bg-gray-100 text-gray-900";
  }

  const weekStart = new Date(classStartDate);
  weekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const fmtShort = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekRange =
    weekNum > 0
      ? `${fmtShort(weekStart)} - ${fmtShort(weekEnd)}, ${weekEnd.getFullYear()}`
      : "";

  return (
    <div className="w-full space-y-5">
      {/* Top row: greeting + week status chip */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2"
            style={{ color: "#1E4B35" }}
          >
            <span>👋</span> Welcome back, {displayName}.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Let&apos;s make this academic week productive and meaningful.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 shrink-0 self-start">
          {userInfo?.classID && (
            <div>
              <p className="text-sm text-muted-foreground">Class</p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900">
                {userInfo.classID}
              </p>
            </div>
          )}
          <div className="flex items-center gap-3 border rounded-lg px-4 py-2 bg-white">
            <div className="h-9 w-9 rounded bg-amber-100 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-amber-700" />
            </div>
            <div className="whitespace-nowrap">
              <p className="text-xs text-muted-foreground">Week Status</p>
              <p className="text-sm font-semibold">
                Week {weekNum || "—"} of {totalWeeks}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Week Log card */}
      <Card
        className="p-5 sm:p-6 rounded-xl border-0 text-white w-full md:w-3/4"
        style={{ backgroundColor: "#1E4B35" }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Current Week Log</h2>
            {weekRange && (
              <p className="text-sm text-white/70 mt-0.5">{weekRange}</p>
            )}
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}
          >
            {badgeLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2.5 mb-4 text-sm">
          <CalendarDays className="h-4 w-4 text-amber-300 shrink-0" />
          <span>
            Next Worklog due on{" "}
            <span className="font-semibold text-amber-200">
              {dueLabel ?? "—"} EDT
            </span>
          </span>
        </div>

        <Button
          size="sm"
          onClick={handleClick}
          className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-semibold border-0 rounded-lg cursor-pointer w-fit"
        >
          {buttonLabel}
        </Button>
      </Card>
    </div>
  );
};

export default Welcome;
