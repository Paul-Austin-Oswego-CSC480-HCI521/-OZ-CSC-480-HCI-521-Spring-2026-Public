"use client";
import { Button } from "@/components/ui/button";
import { useAtomValue, useSetAtom } from "jotai";
import {
  userAtom,
  worklogEditAtom,
} from "@/components/custom/utils/context/state";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import getWorklogDate from "../../utils/func/getDate";

const Welcome = () => {
  const router = useRouter();
  const userInfo = useAtomValue(userAtom);
  const worklogEdit = useAtomValue(worklogEditAtom);
  const setWorklogEdit = useSetAtom(worklogEditAtom);

  const name = userInfo?.name || userInfo?.email;
  const worklogdayInfo = getWorklogDate(new Date("2026-01-26T00:00:00"));
  const weekNumber = worklogdayInfo
    ? String(parseInt(worklogdayInfo.weekNumber) - 1)
    : "—";
  const totalWeeks = 16;

const dueString = worklogdayInfo?.due || "";
const match = dueString.match(/(\w+), (\w+) (\d+)/);
const weekEndDate = match ? new Date(`${match[2]} ${match[3]}, 2026`) : new Date();
const weekStartDate = new Date(weekEndDate);
weekStartDate.setDate(weekEndDate.getDate() - 7);
const weekRange = `${weekStartDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  const { data } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  const worklogs = data ?? [];
  const hasSubmission = worklogs.some(
    (log: any) => String(log.worklogName) === weekNumber
  );
  const hasDraft =
    worklogEdit?.weekNumber === weekNumber && worklogEdit.mode === "new";

  let buttonLabel: string;
  let handleClick: () => void;

  if (hasSubmission) {
    buttonLabel = "Review Work Log";
    handleClick = () => router.push(`/worklogs/review?week=${weekNumber}`);
  } else if (hasDraft) {
    buttonLabel = "Continue Work Log";
    handleClick = () => router.push(`/worklogs?week=${weekNumber}&mode=new`);
  } else {
    buttonLabel = "Continue Work Log";
    handleClick = () => {
      setWorklogEdit({ mode: "new", weekNumber });
      router.push(`/worklogs?week=${weekNumber}&mode=new`);
    };
  }

  return (
    <div className="w-full space-y-6">
      {/* Header row: greeting + week status */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl leading-none select-none">👋</span>
          <div>
            <h1
              className="text-3xl sm:text-4xl font-bold leading-tight"
              style={{ color: "#1a3a2a" }}
            >
              Welcome back, {name}.
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Let&apos;s make this academic week productive and meaningful.
            </p>
          </div>
        </div>

        {/* Week Status pill */}
        <div className="flex items-center gap-3 border rounded-xl px-4 py-3 bg-white shadow-sm shrink-0">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#fdf0d5" }}
          >
            <CalendarDays className="h-5 w-5" style={{ color: "#e6930a" }} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              Week Status
            </p>
            <p className="text-sm font-bold text-gray-800">
              Week {weekNumber} of {totalWeeks}
            </p>
          </div>
        </div>
      </div>

      {/* Green card + quote side by side */}
      <div className="flex gap-6 items-start">
        {/* Current Week Log card */}
        <div
          className="rounded-2xl p-5 sm:p-6 max-w-4xl flex-1"
          style={{ backgroundColor: "#1a3a2a" }}
        >
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-lg font-bold text-white">Current Week Log</h2>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: "#4a7c59", color: "#d4f5e2" }}
            >
              In Progress
            </span>
          </div>

          <p className="text-sm mb-4" style={{ color: "#7daa8b" }}>
            {weekRange}
          </p>

          <div
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 mb-5 w-fit"
            style={{ backgroundColor: "#2d5040" }}
          >
            <CalendarDays className="h-4 w-4 shrink-0" style={{ color: "#7daa8b" }} />
            <p className="text-sm text-white">
              Next Worklog due on{" "}
              <span className="font-bold">{worklogdayInfo?.due} EST</span>
            </p>
          </div>

          <Button
            className="rounded-lg font-semibold text-sm text-gray-900 border-0 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#f5c97a" }}
            onClick={handleClick}
          >
            {buttonLabel}
          </Button>
        </div>

        {/* Quote */}
        <div className="w-56 shrink-0 border-l-4 pl-4" style={{ borderColor: "#f5a623" }}>
          <div className="pt-6 pb-4">
            <p className="text-sm text-gray-500 italic leading-relaxed">
              &ldquo;Regular documentation of your work-study journey not only
              ensures academic compliance but serves as a vital tool for
              personal reflection and career development.&rdquo;
            </p>
            <div className="mt-4 w-16 border-t-[3px]" style={{ borderColor: "#1a3a2a" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;