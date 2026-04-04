"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, worklogEditAtom } from "@/components/custom/utils/context/state";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { Suspense } from "react";

const statusLabel: Record<string, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  complete: "Completed",
};

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const weekNum = searchParams.get("week");
  const userInfo = useAtomValue(userAtom);
  const setWorklogEdit = useSetAtom(worklogEditAtom);

  const { data, isLoading } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  if (isLoading) return <p className="p-6">Loading...</p>;
  if (!weekNum) return <p className="p-6">No week specified.</p>;

  const worklogs = data ?? [];
  const weekSubmissions = worklogs
    .filter((log: any) => String(log.worklogName) === weekNum)
    .sort(
      (a: any, b: any) =>
        new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime(),
    );

  if (weekSubmissions.length === 0) {
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
    setWorklogEdit({
      mode: "resubmit",
      weekNumber: weekNum,
      tasks: latest.taskList,
      previousSubmissions: weekSubmissions.reverse(),
    });
    router.push(`/worklogs?week=${weekNum}&mode=resubmit`);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push("/notifications")}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Week {weekNum}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Submission {weekSubmissions.length}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Submitted: {new Date(latest.dateSubmitted).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <Button
          className="shrink-0 rounded-lg font-semibold text-white border-0"
          style={{ backgroundColor: "#1E4B35" }}
          onClick={handleResubmit}
        >
          Create Resubmission
        </Button>
      </div>

      <div className="space-y-4">
        {(latest.taskList ?? []).map((task: any, i: number) => (
          <Card key={i} className="border rounded-xl">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <h3 className="text-base font-bold">
                Task {i + 1}: {task.taskName}
              </h3>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Main Goal</p>
                <p className="text-sm">{task.goal}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Collaborators</p>
                <div className="flex flex-wrap gap-1.5">
                  {(task.collaborators ?? []).length > 0 ? (
                    task.collaborators.map((c: string, j: number) => (
                      <span
                        key={j}
                        className="text-xs bg-zinc-100 border rounded-md px-2 py-0.5"
                      >
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Deadline</p>
                  <p className="text-sm flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {task.dueDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Completion</p>
                  <p className="text-sm">{statusLabel[task.status] ?? task.status}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Reflection</p>
                <p className="text-sm whitespace-pre-wrap">{task.reflection}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <ReviewContent />
    </Suspense>
  );
}
