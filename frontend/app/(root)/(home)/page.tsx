"use client";
import { NotifCenter } from "@/components/custom/screen/home/NotifCenter";
import Welcome from "@/components/custom/screen/home/Welcome";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import { refreshToken } from "@/components/custom/utils/api_utils/req/req";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, UserPlus } from "lucide-react";

const BRAND_GREEN = "#1E4B35";

const Page = () => {
  const userInfo = useAtomValue(userAtom);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  if (userInfo.role === "student" && !userInfo.classID) {
    const handleRefresh = async () => {
      try {
        setRefreshing(true);
        await refreshToken();
      } finally {
        setRefreshing(false);
      }
    };
    return (
      <div className="w-full p-4 sm:p-6 md:p-8">
        <Card className="max-w-xl mx-auto mt-10">
          <CardContent className="text-center py-10 px-6 space-y-4">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border-2 bg-white"
              style={{ borderColor: BRAND_GREEN }}
            >
              <UserPlus className="h-6 w-6" style={{ color: BRAND_GREEN }} />
            </div>
            <h1
              className="text-xl sm:text-2xl font-bold"
              style={{ color: BRAND_GREEN }}
            >
              You&apos;re not in a class yet
            </h1>
            <p className="text-sm text-muted-foreground">
              Ask your instructor to add you to a class. Share the email below
              so they can enroll you.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {userInfo.email}
            </div>
            <p className="text-xs text-muted-foreground">
              Already added? Refresh to update your access.
            </p>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2 cursor-pointer text-white hover:opacity-90"
              style={{ backgroundColor: BRAND_GREEN }}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 md:p-8 space-y-6">
      <Welcome />
      <NotifCenter />
    </div>
  );
};

export default Page;
