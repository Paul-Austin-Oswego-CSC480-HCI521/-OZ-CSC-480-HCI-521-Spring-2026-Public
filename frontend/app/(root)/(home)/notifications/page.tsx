"use client";
import { Notification } from "@/components/custom/screen/notification/Notification";
import { userAtom } from "@/components/custom/utils/context/state";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

const NotificationsPage = () => {
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

  return <Notification />;
};

export default NotificationsPage;
