"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/custom/ui/Breadcrumbs";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="p-6 sm:p-10">
      <Breadcrumbs
        items={[
          { label: "Weekly Logs", href: "/notifications" },
          { label: "Submitted" },
        ]}
      />
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-6">Work Log Submitted!</h1>
        <p className="mb-6 text-lg text-gray-700">
          Your work log has been successfully submitted.
        </p>
        <Button onClick={() => router.push("/worklogs")}>Back to Work Logs</Button>
      </div>
    </div>
  );
}
