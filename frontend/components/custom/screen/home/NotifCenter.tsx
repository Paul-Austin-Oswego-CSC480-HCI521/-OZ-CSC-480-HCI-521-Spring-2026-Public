"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getWorkLog } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { useAtomValue } from "jotai";
import { sessionIdAtom } from "@/components/custom/utils/context/state";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const NotifCenter = () => {
  const sessionId = useAtomValue(sessionIdAtom);

  const { data, isLoading, error } = useQuery({
    queryKey: ["worklogs", sessionId],
    enabled: !!sessionId,
    queryFn: () => getWorkLog(sessionId),
  });

  if (isLoading) return <p className="p-10">Loading notifications...</p>;

  if (error || !data || data.length === 0) {
    // return (
    //   <div className="p-10">
    //     <h1 className="text-4xl  mb-8">Notification Center</h1>
    //     <p className="text-gray-500">No notifications</p>
    //   </div>
    // );
  }

  const worklogs = data;

  const incompleteTasks = worklogs?.flatMap((log: any) =>
    (log.taskList ?? [])
      .filter(
        (task: any) =>
          task.status === "not-started" || task.status === "in-progress",
      )
      .map((task: any) => ({
        ...task,
        dateSubmitted: log.dateSubmitted,
      })),
  );

  return (
    <div className="p-10  mr-20">
      <h1 className="text-4xl  mb-8">Notification Center</h1>

      <div className="grid grid-cols-2 gap-6 items-start">
        <Card className="flex flex-col min-h-[300px]">
          <CardHeader>
            <CardTitle className="text-2xl">Work Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            {worklogs?.length === 0 ? (
              <p className="text-gray-500">No work logs submitted yet.</p>
            ) : (
              worklogs?.slice(0, 1).map((log: any, i: number) => (
                <div key={i} className="border rounded-lg px-4 py-3">
                  <p className="text-md font-medium">
                    Work Log submitted on {log.dateSubmitted}
                    {log.taskList?.length > 0 &&
                      ` — ${log.taskList.length} task(s)`}
                  </p>
                </div>
              ))
            )}
          </CardContent>

          <CardFooter>
            <Link href="/notifications">
              <Button variant="outline" className="text-md">
                View More
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col min-h-[300px]">
          <CardHeader>
            <CardTitle className="text-2xl">Task Tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            {incompleteTasks?.length === 0 ? (
              <p className="text-gray-500">All tasks are complete!</p>
            ) : (
              incompleteTasks?.slice(0, 1).map((task: any, i: number) => (
                <div key={i} className="border rounded-lg px-4 py-3">
                  <p className="text-md font-semibold">{task.taskName}</p>
                  <p className="text-md text-gray-600">
                    Due: {task.dueDate} — Status:{" "}
                    {task.status === "not-started"
                      ? "Not Started"
                      : "In Progress"}
                  </p>
                  {task.collaborators?.length > 0 && (
                    <p className="text-md text-gray-500">
                      Collaborators: {task.collaborators.join(", ")}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>

          <CardFooter>
            <Link href="/notifications">
              <Button variant="outline" className="text-md">
                View More
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
