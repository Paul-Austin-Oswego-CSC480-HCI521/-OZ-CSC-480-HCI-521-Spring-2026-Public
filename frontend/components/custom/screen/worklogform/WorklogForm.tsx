"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  submitWorkLog,
  getWorkLog,
} from "../../utils/api_utils/worklogs/allReq";
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
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  userAtom,
  worklogEditAtom,
  pendingWorklogAtom,
} from "@/components/custom/utils/context/state";
import getWorklogDate from "../../utils/func/getDate";
import { ChevronDown, ChevronRight, CalendarDays, Clock } from "lucide-react";

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
              Submitted {submission.dateSubmitted}
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
                        Collaboration
                      </p>
                      <p>{task.collaborators.join(", ")}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {task.dueDate && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">
                          Deadline
                        </p>
                        <p className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {task.dueDate}
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
  const worklogdayInfo = getWorklogDate(new Date("2026-01-26"));
  const [showSuccess, setShowSuccess] = useState(false);
  const [openTasks, setOpenTasks] = useState<Record<string, boolean>>({});
  const [worklogEdit, setWorklogEdit] = useAtom(worklogEditAtom);

  const dateCreated = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const userInfo = useAtomValue(userAtom);

  const searchParams = useSearchParams();
  const weekFromUrl = searchParams.get("week");
  const modeFromUrl = searchParams.get("mode");

  const weekNumber =
    worklogEdit?.weekNumber || weekFromUrl || worklogdayInfo?.weekNumber;

  const { data: allWorklogs } = useQuery({
    queryKey: ["worklogs", userInfo?.id],
    enabled: !!userInfo?.id,
    queryFn: () => getWorkLog(userInfo?.email),
  });

  const previousSubmissions = (allWorklogs ?? [])
    .filter((log: any) => String(log.worklogName) === String(weekNumber))
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
  };

  const form = useForm<taskType>({
    resolver: zodResolver(tasksSchema),
    defaultValues: {
      tasks: [emptyTask],
    },
  });

  useEffect(() => {
    if (worklogEdit) {
      // ── Existing: populate from worklogEdit (resubmit via atom) ──
      if (worklogEdit.mode === "resubmit" && worklogEdit.tasks?.length) {
        const populatedTasks = worklogEdit.tasks.map((t: any) => ({
          taskName: t.taskName || "",
          goal: t.goal || "",
          collaborators: t.collaborators || [],
          assignedUser: t.assignedUser || "",
          status: t.status || ("not-started" as const),
          dueDate: t.dueDate || "",
          creationDate: t.creationDate || dateCreated,
          reflection: t.reflection || "",
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
      // ── Existing: populate from URL params + fetched worklogs ──
      const weekLogs = allWorklogs
        .filter((log: any) => String(log.worklogName) === weekFromUrl)
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
          dueDate: t.dueDate || "",
          creationDate: t.creationDate || dateCreated,
          reflection: t.reflection || "",
        }));
        form.reset({ tasks: populatedTasks });
        const openState: Record<string, boolean> = {};
        populatedTasks.forEach((_: any, i: number) => {
          openState[String(i)] = true;
        });
        setOpenTasks(openState);
      }
    } else if (pendingWorklog?.taskList?.length) {
      // ── FIX: restore form when student navigates back from confirm page ──
      const populatedTasks = pendingWorklog.taskList.map((t: any) => ({
        taskName: t.taskName || "",
        goal: t.goal || "",
        collaborators: t.collaborators || [],
        assignedUser: t.assignedUser || "",
        status: t.status || ("not-started" as const),
        dueDate: t.dueDate || "",
        creationDate: t.creationDate || dateCreated,
        reflection: t.reflection || "",
      }));
      form.reset({ tasks: populatedTasks });
      const openState: Record<string, boolean> = {};
      populatedTasks.forEach((_: any, i: number) => {
        openState[String(i)] = true;
      });
      setOpenTasks(openState);
    }
  }, [worklogEdit, allWorklogs, weekFromUrl, modeFromUrl, pendingWorklog]);

  const mutation = useMutation({
    mutationFn: submitWorkLog,
    onSuccess: () => {
      setShowSuccess(true);
      form.reset({ tasks: [emptyTask] });
      setOpenTasks({});
      setWorklogEdit(null);
      // ── FIX: clear pending worklog after a successful final submit ──
      setPendingWorklog(null);
      setTimeout(() => {
        setShowSuccess(false);
        router.push("/");
      }, 250);
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  const toggleTask = (id: string) => {
    setOpenTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  function onSubmit(data: taskType) {
    if (!userInfo) return;

    const tasks = data.tasks.map((t) => ({
      ...t,
      assignedUser: userInfo.id,
        collaborators: t.collaborators.filter((c) => c !== ""), // ← add this

    }));

    const obj: workLogPostType = {
      worklogName: weekNumber,
      authorName: userInfo.email,
      dateCreated: dateCreated,
      dateSubmitted: dateCreated,
      collaborators: [],
      taskList: tasks,
    };

    // Store in atom so confirm page can access it, and so back-nav restores it

    setPendingWorklog(obj);
    router.push("/worklogs/confirm");
  }


  return (
    <div className="p-4 sm:p-6 md:p-10">
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
          Work log submitted successfully!
        </div>
      )}

      <h1 className="text-2xl sm:text-3xl md:text-4xl mb-1">
        Week {weekNumber}
      </h1>
      <p className="text-sm text-muted-foreground mb-6 md:mb-8">
        Track and submit your weekly progress
      </p>

      {/* Current submission form */}
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          <div className="flex gap-2 w-full sm:w-auto">
            {(worklogEdit || modeFromUrl) && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-none hover:cursor-pointer"
                onClick={() => {
                  setWorklogEdit(null);
                  form.reset({ tasks: [emptyTask] });
                  setOpenTasks({});
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="flex-1 sm:flex-none hover:cursor-pointer"
              onClick={() => append(emptyTask)}
            >
              + Add Task
            </Button>
            <Button
              type="submit"
              form="worklog-form"
              className="flex-1 sm:flex-none bg-green-700 hover:cursor-pointer hover:bg-green-800"
            >
              Submit Work Log
            </Button>
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
                          {index + 1}. {taskName || `Task ${index + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="bg-red-500/90 hover:bg-red-500 hover:text-white text-white"
                              onClick={() => remove(index)}
                            >
                              Remove
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
                                  <FieldLabel>Task Name</FieldLabel>
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
                                  <FieldLabel>Main Goal</FieldLabel>
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

                            <Controller
                              name={`tasks.${index}.collaborators`}
                              control={form.control}
                              render={({ field }) => {
                                const [input, setInput] = React.useState("");
                                return (
                                  <Field>
                                    <FieldLabel>Collaborators</FieldLabel>
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
                                    <Input
                                      value={input}
                                      onChange={(e) => setInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (
                                          (e.key === "Enter" ||
                                            e.key === ",") &&
                                          input.trim()
                                        ) {
                                          e.preventDefault();
                                          field.onChange([
                                            ...field.value,
                                            input.trim(),
                                          ]);
                                          setInput("");
                                        }
                                        if (
                                          e.key === "Backspace" &&
                                          input === "" &&
                                          field.value.length > 0
                                        ) {
                                          field.onChange(
                                            field.value.slice(0, -1),
                                          );
                                        }
                                      }}
                                      placeholder="Type a name and press Enter"
                                    />
                                  </Field>
                                );
                              }}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Controller
                                name={`tasks.${index}.dueDate`}
                                control={form.control}
                                render={({ field, fieldState }) => (
                                  <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Deadline</FieldLabel>
                                    <Input
                                      {...field}
                                      type="date"
                                      aria-invalid={fieldState.invalid}
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
                                    <FieldLabel>Completion</FieldLabel>
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
                                  <FieldLabel>Reflection</FieldLabel>
                                  <InputGroup>
                                    <InputGroupTextarea
                                      {...field}
                                      placeholder="Write your reflection..."
                                      rows={4}
                                      className="min-h-24 resize-none"
                                      aria-invalid={fieldState.invalid}
                                    />
                                    <InputGroupAddon align="block-end">
                                      <InputGroupText className="tabular-nums">
                                        {field.value.length}/500 characters
                                      </InputGroupText>
                                    </InputGroupAddon>
                                  </InputGroup>
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
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

      {/* Previous submissions (read-only) */}
      {previousSubmissions.length > 0 && (
        <div className="mt-8 space-y-4">
          {[...previousSubmissions].reverse().map((sub, i) => (
            <PreviousSubmission
              key={i}
              submission={sub}
              index={previousSubmissions.length - 1 - i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
