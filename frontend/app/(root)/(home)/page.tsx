"use client";
import { NotifCenter } from "@/components/custom/screen/home/NotifCenter";
import Welcome from "@/components/custom/screen/home/Welcome";
import { useRouter } from "next/navigation";
// import { InstructorDashboard } from "@/components/custom/screen/home/InstructorDashboard";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import { useEffect } from "react";
const Page = () => {
  const userInfo = useAtomValue(userAtom);
  const router = useRouter();
  useEffect(() => {
    if (userInfo?.role === "instructor") {
      router.push("/instructor");
    }
  }, [userInfo, router]);

  // if (userInfo && userInfo.role == "student") {
  return (
    <div className="w-full p-4 sm:p-6 md:p-8 space-y-6">
      <Welcome />
      <NotifCenter />
    </div>
  );
  // }
};

export default Page;
