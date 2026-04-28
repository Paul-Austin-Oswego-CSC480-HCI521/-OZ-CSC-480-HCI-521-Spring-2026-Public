"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  submitWorkLog,
  getWorkLog,
  saveDraft,
  getDraftForWeek,
} from "../../utils/api_utils/worklogs/allReq";
import { getUsersFromClass } from "../../utils/api_utils/req/req";
import { useSearchParams } from "next/navigation";

import {
  workLogPostType,
  taskType,
  tasksSchema,
} from "@/types/worklog/worklogTypes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  userAtom,
  worklogEditAtom,
  pendingWorklogAtom,
} from "@/components/custom/utils/context/state";
import getWorklogDate from "../../utils/func/getDate";
import { fmtDate, fmtDateTime } from "../../utils/func/formatDate";
import { Breadcrumbs } from "@/components/custom/ui/Breadcrumbs";
import {
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Clock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    "not-started": {
      label: "Not Started",
      className: "bg-gray-100 text-gray-700",
    },
    "in-progress": {
      label: "In Progress",
      className: "bg-blue-100 text-blue-700",
    },
    complete: {
      label: "Completed",
      className: "bg-green-100 text-green-700",
    },
  };
  const info = map[status] || map["not-started"];
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${info.className}`}
    >
      {info.label}
    </span>
  );
}

function PreviousSubmission({
  submission,
  index,
}: {
  submission: any;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="opacity-80">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <CardTitle className="text-lg sm:text-xl font-medium">
              Weekly Work Log · Submission {index + 1}
            </CardTitle>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              Submitted {fmtDateTime(submission.dateSubmitted)}
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="p-1">
              {open ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <CardContent className="pt-0 px-4 sm:px-6 space-y-4">
            {(submission.taskList ?? []).map((task: any, ti: number) => (
              <Card key={ti}>
                <div className="px-4 py-3 sm:px-6">
                  <p className="font-semibold text-sm">
                    Task {ti + 1}: {task.taskName || "Untitled"}
                  </p>
                </div>
                <CardContent className="pt-0 px-4 sm:px-6 space-y-3 text-sm">
                  {task.goal && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        Main Goal
                      </p>
                      <p>{task.goal}</p>
                    </div>
                  )}
                  {task.collaborators?.filter((c: string) => c).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        Collaborators
                      </p>
                      <p>{task.collaborators.join(", ")}</p>
                    </div>
                  )}
                  {task.collabDescription && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        How they worked together
                      </p>
                      <p className="text-muted-foreground">
                        {task.collabDescription}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {task.dueDate && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">
                          Deadline
                        </p>
                        <p className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />{" "}
                          {fmtDate(task.dueDate)}
                        </p>
                      </div>
                    )}
                    {task.status && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">
                          Completion
                        </p>
                        <StatusBadge status={task.status} />
                      </div>
                    )}
                  </div>
                  {task.reflection && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        Reflection
                      </p>
                      <p className="text-muted-foreground">{task.reflection}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function WorkLogForm() {
  const router = useRouter();
  // ── FIX: read AND write pendingWorklogAtom so we can restore on back-nav ──
  const [pendingWorklog, setPendingWorklog] = useAtom(pendingWorklogAtom);
  const worklogdayInfo = getWorklogDate(new Date("2026-01-26T00:00:00"));
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSubmitted, setShowSubmitted] = useState(false);
  const [openTasks, setOpenTasks] = useState<Record<string, boolean>>({});
  const [worklogEdit, setWorklogEdit] = useAtom(worklogEditAtom);
  const [draftLoadedAt, setDraftLoadedAt] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftPrefilled, setDraftPrefilled] = useState(false);

  const dateCreated = new Date().toISOString().replace("Z", "");

  const userInfo = useAtomValue(userAtom);

  const searchParams = useSearchParams();
  const weekFromUrl = searchParams.get("week");
  const modeFromUrl = searchParams.get("mode");

  const weekNumber =
    worklogEdit?.weekNumber || weekFromUrl || worklogdayInfo?.weekNumber;

  const { data: allUsersData } = useQuery({
    queryKey: ["users-from-class", userInfo?.classID],
    queryFn: () => getUsersFromClass(userInfo?.classID ?? ""),
    enabled: !!userInfo?.classID,
  });

  const studentList = (allUsersData ?? [])
    .filter((u: any) => u.role === "student" && u.email !== userInfo?.email)
    .map((u: any) => ({ name: u.name || u.email, email: u.email }));

  const { data: allWorklogs } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  const { data: draft } = useQuery({
    queryKey: ["worklog-draft", userInfo?.email, weekNumber],
    enabled: !!userInfo?.email && !!weekNumber,
    queryFn: () => getDraftForWeek(userInfo?.email, weekNumber),
  });

  const previousSubmissions = (allWorklogs ?? [])
    .filter(
      (log: any) =>
        String(log.worklogName) === String(weekNumber) && !log.isDraft,
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.dateSubmitted).getTime() -
        new Date(b.dateSubmitted).getTime(),
    );

  const submissionNumber = previousSubmissions.length + 1;
  const isResubmit =
    worklogEdit?.mode === "resubmit" || modeFromUrl === "resubmit";

  const emptyTask = {
    taskName: "",
    goal: "",
    collaborators: [] as string[],
    assignedUser: "",
    status: undefined as unknown as "not-started",
    dueDate: "",
    creationDate: dateCreated,
    reflection: "",
    collabDescription: "",
  };

  const form = useForm<taskType>({
    resolver: zodResolver(tasksSchema),
    defaultValues: {
      tasks: [emptyTask],
    },
  });

  useEffect(() => {
    if (pendingWorklog?.taskList?.length) {
      // ── Restore form when student navigates back from confirm page ──
      const populatedTasks = pendingWorklog.taskList.map((t: any) => ({
        taskName: t.taskName || "",
        goal: t.goal || "",
        collaborators: t.collaborators || [],
        assignedUser: t.assignedUser || "",
        status: t.status || ("not-started" as const),
        dueDate: t.dueDate ? t.dueDate.split("T")[0] : "",
        creationDate: t.creationDate || dateCreated,
        reflection: t.reflection || "",
        collabDescription: t.collabDescription || "",
      }));
      form.reset({ tasks: populatedTasks });
      const openState: Record<string, boolean> = {};
      populatedTasks.forEach((_: any, i: number) => {
        openState[String(i)] = true;
      });
      setOpenTasks(openState);
    } else if (worklogEdit) {
      // ── Populate from worklogEdit (resubmit via atom) ──
      if (worklogEdit.mode === "resubmit" && worklogEdit.tasks?.length) {
        const populatedTasks = worklogEdit.tasks.map((t: any) => ({
          taskName: t.taskName || "",
          goal: t.goal || "",
          collaborators: t.collaborators || [],
          assignedUser: t.assignedUser || "",
          status: t.status || ("not-started" as const),
          dueDate: t.dueDate ? t.dueDate.split("T")[0] : "",
          creationDate: t.creationDate || dateCreated,
          reflection: t.reflection || "",
          collabDescription: t.collabDescription || "",
        }));
        form.reset({ tasks: populatedTasks });
        const openState: Record<string, boolean> = {};
        populatedTasks.forEach((_: any, i: number) => {
          openState[String(i)] = true;
        });
        setOpenTasks(openState);
      } else {
        form.reset({ tasks: [emptyTask] });
        setOpenTasks({});
      }
    } else if (weekFromUrl && modeFromUrl === "resubmit" && allWorklogs) {
      // ── Populate from URL params + fetched worklogs ──
      const weekLogs = allWorklogs
        .filter(
          (log: any) => String(log.worklogName) === weekFromUrl && !log.isDraft,
        )
        .sort(
          (a: any, b: any) =>
            new Date(a.dateSubmitted).getTime() -
            new Date(b.dateSubmitted).getTime(),
        );
      const latest = weekLogs[weekLogs.length - 1];
      if (latest?.taskList?.length) {
        const populatedTasks = latest.taskList.map((t: any) => ({
          taskName: t.taskName || "",
          goal: t.goal || "",
          collaborators: t.collaborators || [],
          assignedUser: t.assignedUser || "",
          status: t.status || ("not-started" as const),
          dueDate: t.dueDate ? t.dueDate.split("T")[0] : "",
          creationDate: t.creationDate || dateCreated,
          reflection: t.reflection || "",
          collabDescription: t.collabDescription || "",
        }));
        form.reset({ tasks: populatedTasks });
        const openState: Record<string, boolean> = {};
        populatedTasks.forEach((_: any, i: number) => {
          openState[String(i)] = true;
        });
        setOpenTasks(openState);
      }
    }
  }, [worklogEdit, allWorklogs, weekFromUrl, modeFromUrl, pendingWorklog]);

  useEffect(() => {
    if (draftPrefilled) return;
    if (!draft || !draft.taskList?.length) return;
    if (
      pendingWorklog?.taskList?.length ||
      worklogEdit ||
      (weekFromUrl && modeFromUrl === "resubmit")
    ) {
      return;
    }
    const populatedTasks = draft.taskList.map((t: any) => ({
      taskName: t.taskName || "",
      goal: t.goal || "",
      collaborators: t.collaborators || [],
      assignedUser: t.assignedUser || "",
      status: t.status || ("not-started" as const),
      dueDate: t.dueDate ? t.dueDate.split("T")[0] : "",
      creationDate: t.creationDate || dateCreated,
      reflection: t.reflection || "",
      collabDescription: t.collabDescription || "",
    }));
    form.reset({ tasks: populatedTasks });
    const openState: Record<string, boolean> = {};
    populatedTasks.forEach((_: any, i: number) => {
      openState[String(i)] = true;
    });
    setOpenTasks(openState);
    setDraftLoadedAt(draft.dateCreated || draft.dateSubmitted || null);
    setDraftPrefilled(true);
  }, [
    draft,
    draftPrefilled,
    pendingWorklog,
    worklogEdit,
    weekFromUrl,
    modeFromUrl,
  ]);

  const mutation = useMutation({
    mutationFn: submitWorkLog,
    onSuccess: () => {
      form.reset({ tasks: [emptyTask] });
      setOpenTasks({});
      setWorklogEdit(null);
      setPendingWorklog(null);
      setDraftLoadedAt(null);
      setDraftSavedAt(null);
      setShowSubmitted(true);
    },
  });

  const draftMutation = useMutation({
    mutationFn: saveDraft,
    onSuccess: () => {
      const now = new Date().toISOString();
      setDraftSavedAt(now);
      setDraftLoadedAt(now);
      toast.success("Draft saved");
    },
    onError: (err: any) => {
      console.error("Save draft failed:", err?.response?.data ?? err);
      toast.error(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to save draft",
      );
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  const toggleTask = (id: string) => {
    setOpenTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  function toLocalDT(val: string | undefined | null): string {
    if (!val) return "";
    const s = /^\d{4}-\d{2}-\d{2}$/.test(val) ? `${val}T00:00:00` : val;
    return s.replace("Z", "");
  }

  function onSubmit(data: taskType) {
    if (!userInfo) return;

    const tasks = data.tasks.map((t) => ({
      ...t,
      assignedUser: userInfo.id,
      collaborators: t.collaborators.filter((c) => c !== ""),
      dueDate: toLocalDT(t.dueDate),
      creationDate: toLocalDT(t.creationDate),
    }));

    const obj: workLogPostType = {
      worklogName: weekNumber,
      authorName: userInfo.email,
      dateCreated: dateCreated,
      dateSubmitted: dateCreated,
      collaborators: [],
      taskList: tasks,
    };

    setPendingWorklog(obj);
    setShowConfirm(true);
  }

  function onConfirmSubmit() {
    if (!pendingWorklog) return;
    setShowConfirm(false);
    mutation.mutate(pendingWorklog);
  }

  function onSaveDraft() {
    if (!userInfo) return;
    const data = form.getValues();
    const tasks = (data.tasks ?? []).map((t) => {
      const due = toLocalDT(t.dueDate);
      const created = toLocalDT(t.creationDate);
      return {
        ...t,
        assignedUser: userInfo.id,
        collaborators: (t.collaborators ?? []).filter((c) => c !== ""),
        dueDate: due === "" ? null : due,
        creationDate: created === "" ? null : created,
      };
    });
    const obj = {
      worklogName: weekNumber,
      authorName: userInfo.email,
      dateCreated: dateCreated,
      dateSubmitted: dateCreated,
      collaborators: [],
      taskList: tasks,
    } as unknown as workLogPostType;
    draftMutation.mutate(obj);
  }

  return (
    <div className="p-4 sm:p-6 md:p-10">
      {(() => {
        const semStart = new Date("2026-01-26T00:00:00");
        const wk = parseInt(weekNumber ?? "0");
        const start = new Date(semStart);
        if (wk) start.setDate(start.getDate() + (wk - 1) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const due = new Date(start);
        due.setDate(due.getDate() + 7);
        due.setHours(23, 59, 0, 0);
        const fmt = (d: Date) =>
          d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const fmtDue = (d: Date) =>
          d.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        return (
          <div className="flex items-start sm:items-center justify-between gap-4 mb-6 md:mb-8 flex-wrap">
            <div>
              <Breadcrumbs
                items={[
                  { label: "Weekly Logs", href: "/" },
                  { label: `Week ${weekNumber} Log` },
                ]}
                className="mb-2"
              />
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold"
                style={{ color: "#1E4B35" }}
              >
                {wk > 0
                  ? `Week ${weekNumber} (${fmt(start)} - ${fmt(end)})`
                  : `Week ${weekNumber}`}
              </h1>
              {wk > 0 && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Due: {fmtDue(due)}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              disabled={draftMutation.isPending}
              className="shrink-0 h-10 rounded-xl"
            >
              {draftMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>
          </div>
        );
      })()}

      {draftLoadedAt && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-700 shrink-0" />
          <p className="text-sm text-amber-800">
            Draft saved {fmtDateTime(draftLoadedAt)} — your changes will be kept
            until you submit.
          </p>
        </div>
      )}

      {/* Current submission form */}
      <Card className="w-full">
        <CardHeader>
          <div>
            <CardTitle className="text-xl sm:text-2xl font-medium">
              Weekly Work Log · Submission {submissionNumber}
            </CardTitle>
            {isResubmit && (
              <p className="text-xs text-muted-foreground mt-1">
                Fill in the details for each task you worked on this week.
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <form
            id="worklog-form"
            onSubmit={form.handleSubmit(onSubmit, (errors) =>
              console.log("Validation errors:", errors),
            )}
          >
            <div className="space-y-4 md:space-y-8 text-muted-foreground">
              {fields.map((field, index) => {
                const isOpen = openTasks[field.id] ?? true;
                const taskName = form.watch(`tasks.${index}.taskName`);

                return (
                  <Collapsible
                    key={field.id}
                    open={isOpen}
                    onOpenChange={() => toggleTask(field.id)}
                  >
                    <Card className="relative">
                      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                        <span className="font-semibold">
                          Task {index + 1}
                          {taskName ? `: ${taskName}` : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete Task
                            </Button>
                          )}
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="p-1"
                            >
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>

                      <CollapsibleContent>
                        <CardContent className="pt-0 px-4 sm:px-6">
                          <FieldGroup>
                            <Controller
                              name={`tasks.${index}.taskName`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel>
                                    Task Name{" "}
                                    <span className="text-red-500">*</span>
                                  </FieldLabel>
                                  <FieldDescription>
                                    What is the name of the task? (e.g.
                                    Implemented User Authentication)
                                  </FieldDescription>
                                  <Input
                                    {...field}
                                    placeholder="Task name"
                                    aria-invalid={fieldState.invalid}
                                  />
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />

                            <Controller
                              name={`tasks.${index}.goal`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel>
                                    Main Goal{" "}
                                    <span className="text-red-500">*</span>
                                  </FieldLabel>
                                  <FieldDescription>
                                    What was the primary objective?
                                  </FieldDescription>
                                  <Input
                                    {...field}
                                    placeholder="Main goal"
                                    aria-invalid={fieldState.invalid}
                                  />
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Controller
                                name={`tasks.${index}.dueDate`}
                                control={form.control}
                                render={({ field, fieldState }) => (
                                  <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>
                                      Deadline{" "}
                                      <span className="text-red-500">*</span>
                                    </FieldLabel>
                                    <FieldDescription>
                                      When is this task due?
                                    </FieldDescription>
                                    <Input
                                      {...field}
                                      type="date"
                                      min="2024-01-01"
                                      max="2030-12-31"
                                      aria-invalid={fieldState.invalid}
                                      onKeyDown={(e) => {
                                        if (e.key === "e" || e.key === "E") {
                                          e.preventDefault();
                                        }
                                      }}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        const m = v.match(/^(\d{4,})-/);
                                        if (m && m[1].length > 4) {
                                          e.target.value = `${m[1].slice(0, 4)}-${v.slice(m[0].length)}`;
                                        }
                                        field.onChange(e.target.value);
                                      }}
                                    />
                                    {fieldState.invalid && (
                                      <FieldError errors={[fieldState.error]} />
                                    )}
                                  </Field>
                                )}
                              />

                              <Controller
                                name={`tasks.${index}.status`}
                                control={form.control}
                                render={({ field, fieldState }) => (
                                  <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>
                                      Completion{" "}
                                      <span className="text-red-500">*</span>
                                    </FieldLabel>
                                    <FieldDescription>
                                      What is the current status?
                                    </FieldDescription>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="not-started">
                                          Not Started
                                        </SelectItem>
                                        <SelectItem value="in-progress">
                                          In Progress
                                        </SelectItem>
                                        <SelectItem value="complete">
                                          Complete
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {fieldState.invalid && (
                                      <FieldError errors={[fieldState.error]} />
                                    )}
                                  </Field>
                                )}
                              />
                            </div>

                            <Controller
                              name={`tasks.${index}.reflection`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel>
                                    Reflection{" "}
                                    <span className="text-red-500">*</span>
                                  </FieldLabel>
                                  <FieldDescription>
                                    What did you learn? What challenges did you
                                    face? If not completed, why?
                                  </FieldDescription>
                                  <InputGroup>
                                    <InputGroupTextarea
                                      {...field}
                                      placeholder="Write your reflection..."
                                      rows={4}
                                      className="min-h-24 resize-none"
                                      aria-invalid={fieldState.invalid}
                                      maxLength={1000}
                                    />
                                    <InputGroupAddon align="block-end">
                                      <InputGroupText className="tabular-nums">
                                        {field.value.length}/1000 characters
                                      </InputGroupText>
                                    </InputGroupAddon>
                                  </InputGroup>
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />

                            <Controller
                              name={`tasks.${index}.collaborators`}
                              control={form.control}
                              render={({ field }) => {
                                const [input, setInput] = React.useState("");
                                return (
                                  <Field>
                                    <FieldLabel>Collaborators</FieldLabel>
                                    <FieldDescription>
                                      Who did you work with?
                                    </FieldDescription>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      {field.value
                                        .filter((name) => name !== "")
                                        .map((name, i) => (
                                          <span
                                            key={i}
                                            className="flex items-center gap-1 bg-gray-100 text-sm px-2 py-1 rounded-full"
                                          >
                                            {name}
                                            <button
                                              type="button"
                                              className="text-gray-500 hover:text-red-500"
                                              onClick={() =>
                                                field.onChange(
                                                  field.value.filter(
                                                    (_, j) => j !== i,
                                                  ),
                                                )
                                              }
                                            >
                                              ×
                                            </button>
                                          </span>
                                        ))}
                                    </div>
                                    <div className="relative">
                                      <Input
                                        value={input}
                                        onChange={(e) =>
                                          setInput(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === "Backspace" &&
                                            input === "" &&
                                            field.value.length > 0
                                          ) {
                                            field.onChange(
                                              field.value.slice(0, -1),
                                            );
                                          }
                                          if (e.key === "Escape") {
                                            setInput("");
                                          }
                                        }}
                                        placeholder="Search for a collaborator..."
                                      />
                                      {input.trim() && (
                                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                          {studentList
                                            .filter(
                                              (s: any) =>
                                                (s.name
                                                  .toLowerCase()
                                                  .includes(
                                                    input.toLowerCase(),
                                                  ) ||
                                                  s.email
                                                    .toLowerCase()
                                                    .includes(
                                                      input.toLowerCase(),
                                                    )) &&
                                                !field.value.includes(s.name),
                                            )
                                            .map((s: any) => (
                                              <button
                                                key={s.email}
                                                type="button"
                                                className="w-full text-left px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => {
                                                  field.onChange([
                                                    ...field.value,
                                                    s.name,
                                                  ]);
                                                  setInput("");
                                                }}
                                              >
                                                <p className="text-sm font-medium">
                                                  {s.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  {s.email}
                                                </p>
                                              </button>
                                            ))}
                                          {studentList.filter(
                                            (s: any) =>
                                              (s.name
                                                .toLowerCase()
                                                .includes(
                                                  input.toLowerCase(),
                                                ) ||
                                                s.email
                                                  .toLowerCase()
                                                  .includes(
                                                    input.toLowerCase(),
                                                  )) &&
                                              !field.value.includes(s.name),
                                          ).length === 0 && (
                                            <p className="px-3 py-2 text-sm text-muted-foreground">
                                              No matching students
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </Field>
                                );
                              }}
                            />

                            <Controller
                              name={`tasks.${index}.collabDescription`}
                              control={form.control}
                              render={({ field, fieldState }) => {
                                const collaborators = form.watch(
                                  `tasks.${index}.collaborators`,
                                );
                                const collabList = (collaborators ?? []).filter(
                                  (c: string) => c !== "",
                                );
                                const hasCollaborators = collabList.length > 0;
                                const collabNames =
                                  collabList.length === 0
                                    ? "your collaborator(s)"
                                    : collabList.length === 1
                                      ? collabList[0]
                                      : collabList.length === 2
                                        ? `${collabList[0]} and ${collabList[1]}`
                                        : `${collabList.slice(0, -1).join(", ")}, and ${collabList[collabList.length - 1]}`;
                                return (
                                  <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>
                                      How did you work with {collabNames}?
                                      {hasCollaborators && (
                                        <span className="text-red-500">*</span>
                                      )}
                                    </FieldLabel>
                                    <FieldDescription>
                                      Describe your collaboration — what each
                                      person contributed and how you divided the
                                      work.
                                    </FieldDescription>
                                    <InputGroup>
                                      <InputGroupTextarea
                                        {...field}
                                        value={field.value ?? ""}
                                        placeholder={
                                          hasCollaborators
                                            ? "Describe how you worked together..."
                                            : "Add a collaborator above to fill this in"
                                        }
                                        rows={3}
                                        className="min-h-20 resize-none"
                                        aria-invalid={fieldState.invalid}
                                        maxLength={1000}
                                        disabled={!hasCollaborators}
                                      />
                                      <InputGroupAddon align="block-end">
                                        <InputGroupText className="tabular-nums">
                                          {(field.value ?? "").length}/1000
                                          characters
                                        </InputGroupText>
                                      </InputGroupAddon>
                                    </InputGroup>
                                    {fieldState.invalid && (
                                      <FieldError errors={[fieldState.error]} />
                                    )}
                                  </Field>
                                );
                              }}
                            />
                          </FieldGroup>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          </form>
        </CardContent>
      </Card>

      <button
        type="button"
        onClick={() => append(emptyTask)}
        className="w-full mt-4 py-4 border-2 border-dashed border-gray-300 rounded-xl text-muted-foreground hover:border-gray-400 hover:text-foreground transition-colors cursor-pointer text-sm font-medium"
      >
        + Add Task
      </button>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        By submitting this log, you confirm that all information is accurate and
        reflects your own original work and participation.
      </p>

      <Button
        type="submit"
        form="worklog-form"
        className="w-full mt-3 h-12 rounded-xl text-base bg-[#1E4B35] hover:bg-[#1E4B35]/90 text-white cursor-pointer"
      >
        Submit Work Log
      </Button>

      {previousSubmissions.length > 0 && (
        <div className="mt-8 md:mt-10">
          <h2 className="text-xl sm:text-2xl font-medium mb-1">
            Previous Submissions for Week {weekNumber}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Review your earlier submission
            {previousSubmissions.length > 1 ? "s" : ""} for this week for
            reference.
          </p>
          <div className="space-y-4">
            {previousSubmissions.map((sub: any, i: number) => (
              <PreviousSubmission
                key={sub._id ?? i}
                submission={sub}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="max-w-lg text-center p-8">
          <AlertDialogHeader className="space-y-4">
            <AlertDialogTitle className="text-2xl font-bold">
              Are you sure you want to submit your log?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              Once submitted, this log cannot be edited. You will need to create
              a new submission to make changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              type="button"
              className="w-full h-12 rounded-2xl text-base bg-[#1E4B35] hover:bg-[#1E4B35]/90 text-white"
              onClick={onConfirmSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Submitting..." : "Confirm"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full h-12 rounded-2xl text-base bg-gray-100 hover:bg-gray-200 text-black"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSubmitted} onOpenChange={setShowSubmitted}>
        <AlertDialogContent className="max-w-lg text-center p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">
              Your work log has been submitted.
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="mt-4">
            <Button
              className="w-full h-12 rounded-2xl text-base bg-[#1E4B35] hover:bg-[#1E4B35]/90 text-white"
              onClick={() => {
                setShowSubmitted(false);
                router.push(`/worklogs/review?week=${weekNumber}`);
              }}
            >
              View Submission
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
