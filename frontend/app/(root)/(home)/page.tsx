"use client";
import { NotifCenter } from "@/components/custom/screen/home/NotifCenter";
import Welcome from "@/components/custom/screen/home/Welcome";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import { useEffect, useState } from "react";
const Page = () => {
  const userInfo = useAtomValue(userAtom);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && userInfo?.role === "instructor") {
      router.replace("/instructor");
    }
  }, [mounted, userInfo, router]);

  if (!mounted || !userInfo || userInfo.role === "instructor") {
    return <p className="p-4 sm:p-10">Loading...</p>;
  }

  return (
    <div className="w-full p-4 sm:p-6 md:p-8 space-y-6">
      <Welcome />
      <NotifCenter />
    </div>
  );
};

export default Page;
