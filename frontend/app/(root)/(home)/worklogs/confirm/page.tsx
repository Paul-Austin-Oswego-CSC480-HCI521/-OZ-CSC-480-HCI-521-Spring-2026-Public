"use client";

import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { useMutation } from "@tanstack/react-query";

import { pendingWorklogAtom } from "../../../../../components/custom/utils/context/state";
import { submitWorkLog } from "../../../../../components/custom/utils/api_utils/worklogs/allReq";
import { Button } from "../../../../../components/ui/button";

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
    return <div>No worklog to submit</div>;
  }

  return (
    <div className="flex items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-lg p-16 text-center">
        <h1 className="text-5xl font-bold mb-12">
          Are you sure you want to submit your log?
        </h1>

        <div className="flex flex-col gap-8 items-center">
          <Button
            className="w-full max-w-2xl h-20 rounded-3xl text-3xl"
            onClick={() => mutation.mutate(pendingWorklog)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Submitting..." : "Confirm"}
          </Button>

          <Button
            variant="secondary"
            className="w-full max-w-2xl h-20 rounded-3xl text-3xl"
            onClick={() => router.back()}
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}