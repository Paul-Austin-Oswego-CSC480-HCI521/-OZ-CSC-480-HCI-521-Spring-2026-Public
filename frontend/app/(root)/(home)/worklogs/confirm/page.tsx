"use client";

import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { useMutation } from "@tanstack/react-query";

import { pendingWorklogAtom } from "../../../../../components/custom/utils/context/state";
import { submitWorkLog } from "../../../../../components/custom/utils/api_utils/worklogs/allReq";
import { Button } from "../../../../../components/ui/button";
import { AlertCircle, ArrowLeft, Send } from "lucide-react";
import { Card, CardContent } from "../../../../../components/ui/card";

export default function ConfirmPage() {
  const router = useRouter();
  const pendingWorklog = useAtomValue(pendingWorklogAtom);

  const mutation = useMutation({
    mutationFn: submitWorkLog,
    onSuccess: () => router.push("/"),
    onError: (error) => {
      console.error("SUBMIT FAILED:", error);
    },
  });

  if (!pendingWorklog) {
    return (
      <div className="flex items-center justify-center p-6 sm:p-10">
        <p className="text-muted-foreground">No worklog to submit.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-6 sm:p-10">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-semibold mb-1">Submit Work Log?</h1>
            <p className="text-sm text-muted-foreground">
              Week {pendingWorklog.worklogName} · {pendingWorklog.taskList.length} task{pendingWorklog.taskList.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="w-full bg-green-700 hover:bg-green-800"
              onClick={() => mutation.mutate(pendingWorklog)}
              disabled={mutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Submitting..." : "Confirm Submission"}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
              disabled={mutation.isPending}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back & Edit
            </Button>
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">
              Submission failed. Please try again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
