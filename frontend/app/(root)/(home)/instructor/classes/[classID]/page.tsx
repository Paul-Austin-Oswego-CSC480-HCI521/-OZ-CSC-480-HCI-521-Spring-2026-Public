"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import {
  getClass,
  unenrollUser,
  ClassUser,
} from "@/components/custom/utils/api_utils/req/class";
import { getUsersFromClass } from "@/components/custom/utils/api_utils/req/req";
import { getWorklogsForClass } from "@/components/custom/utils/api_utils/worklogs/allReq";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import StudentSearchPicker from "@/components/custom/instructor/classes/StudentSearchPicker";
import { fmtDateTime } from "@/components/custom/utils/func/formatDate";

export default function ClassDetailPage() {
  const userInfo = useAtomValue(userAtom);
  const params = useParams();
  const rawClassID = (params?.classID as string) ?? "";
  const classID = decodeURIComponent(rawClassID);
  const qc = useQueryClient();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: classData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["class", classID],
    queryFn: () => getClass(classID),
    enabled: !!classID && userInfo?.role === "instructor",
  });

  const { data: roster } = useQuery({
    queryKey: ["roster", classID],
    queryFn: () => getUsersFromClass(classID),
    enabled: !!classID && userInfo?.role === "instructor",
  });

  const { data: worklogs, isLoading: worklogsLoading } = useQuery({
    queryKey: ["class-worklogs", classID],
    queryFn: () => getWorklogsForClass(classID),
    enabled: !!classID && userInfo?.role === "instructor",
  });

  const unenrollMutation = useMutation({
    mutationFn: (email: string) => unenrollUser(email),
    onSuccess: (_data, email) => {
      qc.invalidateQueries({ queryKey: ["roster", classID] });
      qc.invalidateQueries({ queryKey: ["class", classID] });
      qc.invalidateQueries({ queryKey: ["all-users"] });
      toast.success(`Removed ${email} from class`);
    },
    onError: () => toast.error("Failed to remove student"),
  });

  if (!mounted || !userInfo) return <p className="p-4 sm:p-10">Loading...</p>;
  if (userInfo.role !== "instructor") {
    return (
      <h1 className="p-4 sm:p-10">
        Sorry you do not have access to this page
      </h1>
    );
  }
  if (isLoading) return <p className="p-4 sm:p-10">Loading class...</p>;
  if (error || !classData) {
    return (
      <div className="p-4 sm:p-10">
        <Link href="/instructor/classes">
          <Button variant="ghost" className="mb-4 gap-2 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Back to classes
          </Button>
        </Link>
        <p className="text-red-600">
          Failed to load class: {(error as Error)?.message ?? "Not found"}
        </p>
      </div>
    );
  }

  const students: ClassUser[] = (roster ?? []).filter(
    (u: ClassUser) => u.role === "student",
  );

  const worklogList: Array<{
    _id?: string | { $oid: string };
    authorName?: string;
    worklogName?: string;
    dateSubmitted?: string;
    taskList?: unknown[];
    reviewed?: boolean;
  }> = Array.isArray(worklogs) ? worklogs : [];

  const sortedWorklogs = [...worklogList].sort((a, b) => {
    const ta = a.dateSubmitted ? new Date(a.dateSubmitted).getTime() : 0;
    const tb = b.dateSubmitted ? new Date(b.dateSubmitted).getTime() : 0;
    return tb - ta;
  });

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <Link href="/instructor/classes">
        <Button variant="ghost" className="mb-4 gap-2 cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
          Back to classes
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{classData.classID}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Semester: {classData.semesterStartDate || "—"} —{" "}
          {classData.semsesterEndDate || "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          Student access ends: {classData.studendAccessEndDate || "—"}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Student</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentSearchPicker
              classID={classID}
              existingEmails={students.map((s) => s.email)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Roster ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No students enrolled yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {students.map((s) => (
                  <li
                    key={s.email}
                    className="flex items-center justify-between border rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={unenrollMutation.isPending}
                      onClick={() => {
                        if (confirm(`Remove ${s.name} from ${classID}?`)) {
                          unenrollMutation.mutate(s.email);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">
            Worklogs ({sortedWorklogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {worklogsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Loading worklogs...
            </p>
          ) : sortedWorklogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No worklogs submitted yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {sortedWorklogs.map((log, idx) => {
                const id =
                  typeof log._id === "object" && log._id !== null
                    ? (log._id as { $oid: string }).$oid
                    : (log._id as string) ?? `${idx}`;
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between border rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {log.authorName ?? "Unknown author"}
                        {log.worklogName ? ` · Week ${log.worklogName}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {log.dateSubmitted
                          ? `Submitted ${fmtDateTime(log.dateSubmitted)}`
                          : "No submission date"}
                        {" · "}
                        {log.taskList?.length ?? 0} task
                        {(log.taskList?.length ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    {log.reviewed ? (
                      <span className="text-xs font-medium text-green-700 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Reviewed
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        Pending
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
