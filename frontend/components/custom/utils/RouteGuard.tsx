"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import {
  getUsersFromClass,
  refreshToken,
} from "@/components/custom/utils/api_utils/req/req";

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

  // Student's JWT may still hold an old classID after the instructor archived
  // their class and unenrolled them. Detect that via an empty lookup in the
  // roster and treat it as unenrolled rather than bouncing through profile.
  const unenrolledFromStaleClass =
    isStudent && !!userInfo?.classID && !!classUsers && !me;

  const noClass = (isStudent && !userInfo?.classID) || unenrolledFromStaleClass;
  const noTeam =
    isStudent &&
    !!userInfo?.classID &&
    !unenrolledFromStaleClass &&
    !hasRealTeam(userInfo?.team);
  // Standing check waits for the fetch — if classUsers hasn't loaded yet,
  // skip this check so we don't bounce while we wait.
  const noStanding =
    isStudent &&
    !!userInfo?.classID &&
    !!classUsers &&
    !!me &&
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

  const refreshedForClassID = useRef<string | null>(null);
  useEffect(() => {
    if (
      mounted &&
      unenrolledFromStaleClass &&
      userInfo?.classID &&
      refreshedForClassID.current !== userInfo.classID
    ) {
      refreshedForClassID.current = userInfo.classID;
      refreshToken().catch(() => {});
    }
  }, [mounted, unenrolledFromStaleClass, userInfo?.classID]);

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
