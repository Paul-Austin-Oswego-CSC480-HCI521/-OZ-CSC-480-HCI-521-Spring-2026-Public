"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import { getUsersFromClass } from "@/components/custom/utils/api_utils/req/req";

const hasRealTeam = (team: string[] | undefined) =>
  (team ?? []).some((t) => t && t.toLowerCase() !== "unassigned");

export default function RouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const userInfo = useAtomValue(userAtom);
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isStudent = !!userInfo && userInfo.role === "student";

  const { data: classUsers } = useQuery({
    queryKey: ["users-from-class", userInfo?.classID],
    queryFn: () => getUsersFromClass(userInfo!.classID),
    enabled: isStudent && !!userInfo?.classID,
  });

  const me = (classUsers as any[] | undefined)?.find(
    (u) => u.email === userInfo?.email,
  );
  const standing: string | undefined = me?.classStanding;

  const noClass = isStudent && !userInfo?.classID;
  const noTeam =
    isStudent && !!userInfo?.classID && !hasRealTeam(userInfo?.team);
  // Standing check waits for the fetch — if classUsers hasn't loaded yet,
  // skip this check so we don't bounce while we wait.
  const noStanding =
    isStudent &&
    !!userInfo?.classID &&
    !!classUsers &&
    !standing;

  const redirectTo: string | null = noClass
    ? pathname !== "/"
      ? "/"
      : null
    : noTeam || noStanding
      ? pathname !== "/profile"
        ? "/profile"
        : null
      : null;

  useEffect(() => {
    if (mounted && redirectTo) {
      router.replace(redirectTo);
    }
  }, [mounted, redirectTo, router]);

  if (mounted && redirectTo) {
    return <p className="p-4 sm:p-10">Redirecting...</p>;
  }
  return <>{children}</>;
}
