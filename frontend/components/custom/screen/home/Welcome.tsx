"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, worklogEditAtom } from "@/components/custom/utils/context/state";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import getWorklogDate from "../../utils/func/getDate";

const Welcome = () => {
  const router = useRouter();
  const userInfo = useAtomValue(userAtom);
  const worklogEdit = useAtomValue(worklogEditAtom);
  const setWorklogEdit = useSetAtom(worklogEditAtom);
  const name = userInfo?.name || userInfo?.email;
  const worklogdayInfo = getWorklogDate(new Date("2026-01-26"));
  const weekNumber = worklogdayInfo ? String(parseInt(worklogdayInfo.weekNumber) - 1) : "—";

  const { data } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  const worklogs = data ?? [];
  const hasSubmission = worklogs.some(
    (log: any) => String(log.worklogName) === weekNumber,
  );
  const hasDraft =
    worklogEdit?.weekNumber === weekNumber && worklogEdit.mode === "new";

  let buttonLabel: string;
  let handleClick: () => void;

  if (hasSubmission) {
    buttonLabel = `Access Week ${weekNumber} Worklog`;
    handleClick = () => router.push(`/worklogs/review?week=${weekNumber}`);
  } else if (hasDraft) {
    buttonLabel = `Continue Week ${weekNumber} Worklog`;
    handleClick = () => router.push(`/worklogs?week=${weekNumber}&mode=new`);
  } else {
    buttonLabel = `Start Week ${weekNumber} Worklog`;
    handleClick = () => {
      setWorklogEdit({ mode: "new", weekNumber });
      router.push(`/worklogs?week=${weekNumber}&mode=new`);
    };
  }

  return (
    <div className="w-full space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <span className="text-2xl sm:text-3xl">👋</span> Welcome, {name}.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Let&apos;s get started with the weekly work log.
        </p>
      </div>

      <Card className="p-4 sm:p-5 border-2 rounded-xl">
        <div className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold">
            Week {weekNumber}{" "}
            <span className="text-muted-foreground font-normal">|</span>{" "}
            <span className="text-muted-foreground font-normal text-base">
              Current Week
            </span>
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0" />
            Worklog due on <span className="font-medium text-foreground">{worklogdayInfo?.due} EDT</span>
          </p>
          <div>
            <Button
              size="sm"
              className="rounded-lg text-sm font-semibold text-white border-0"
              style={{ backgroundColor: "#1E4B35" }}
              onClick={handleClick}
            >
              {buttonLabel}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Welcome;
