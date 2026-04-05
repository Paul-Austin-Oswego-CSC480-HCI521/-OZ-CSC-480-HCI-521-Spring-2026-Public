"use client";
import { Suspense } from "react";
import { WorkLogForm } from "@/components/custom/screen/worklogform/WorklogForm";
import { userAtom } from "@/components/custom/utils/context/state";
import { useAtomValue } from "jotai";

const WorklogPage = () => {
  const userInfo = useAtomValue(userAtom);
  if (userInfo && userInfo.role == "instructor") {
    return <h1>sorry you do not have access to this page</h1>;
  }
  return (
    <div className="w-full">
      <Suspense fallback={<p className="p-4 sm:p-10">Loading...</p>}>
        <WorkLogForm />
      </Suspense>
    </div>
  );
};

export default WorklogPage;
