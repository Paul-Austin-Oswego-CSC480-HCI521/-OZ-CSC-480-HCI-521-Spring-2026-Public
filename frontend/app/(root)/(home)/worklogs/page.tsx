"use client";
import { Suspense, useEffect, useState } from "react";
import { WorkLogForm } from "@/components/custom/screen/worklogform/WorklogForm";
import { userAtom } from "@/components/custom/utils/context/state";
import { useAtomValue } from "jotai";

const WorklogPage = () => {
  const userInfo = useAtomValue(userAtom);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !userInfo) {
    return <p className="p-4 sm:p-10">Loading...</p>;
  }

  if (userInfo.role === "instructor") {
    return <h1 className="p-4 sm:p-10">Sorry you do not have access to this page</h1>;
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
