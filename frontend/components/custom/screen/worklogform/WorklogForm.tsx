"use client";
import React, { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { submitWorkLog } from "../../utils/tanstack_utils/worklogs/allReq";

import {
  workLogPostType,
  taskType,
  tasksSchema,
} from "@/types/worklog/worklogTypes";
import { useMutation } from "@tanstack/react-query";
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
import { useAtomValue } from "jotai";
import { sessionIdAtom } from "@/components/custom/utils/context/state";

export function WorkLogForm() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const dateCreated = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
  const sessionId = useAtomValue(sessionIdAtom);

  const weekNumber = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  })();

  const emptyTask = {
    taskName: "",
    goal: "",
    collaborators: [] as string[],
    assignedUser: sessionId,
    status: "not-started" as const,
    dueDate: "",
    creationDate: dateCreated,
    reflection: "",
  };

  // creating form instance
  const form = useForm<taskType>({
    resolver: zodResolver(tasksSchema),
    defaultValues: {
      tasks: [emptyTask],
    },
  });

  // creating mutation
  const mutation = useMutation({
    mutationFn: submitWorkLog,
    onSuccess: () => {
      setShowSuccess(true);
      setFormError(null);
      setTimeout(() => setShowSuccess(false), 3000);
      form.reset({ tasks: [emptyTask] });
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  function onSubmit(data: taskType) {
    const obj: workLogPostType = {
      authorName: sessionId,
      dateCreated: dateCreated,
      dateSubmitted: dateCreated,
      collaborators: [],
      taskList: data.tasks,
    };
    mutation.mutate(obj);
  }

  const inputClass =
    "bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-gray-400";

  return (
    <div className="p-10 bg-white min-h-full">
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-gray-700 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
          Work log submitted successfully!
        </div>
      )}
      {formError && (
        <div
          className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {formError}
        </div>
      )}

      <h1 className="text-4xl mb-8 text-gray-900 font-bold">Work Logs</h1>

      <Card className="w-full border border-gray-300 bg-gray-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-300 pb-4 bg-gray-100">
          <CardTitle className="text-2xl font-medium text-gray-900">
            Weekly Work Log {weekNumber}
          </CardTitle>
          <Button
            type="submit"
            form="worklog-form"
            className="bg-gray-500 hover:bg-gray-600 text-black border-0"
          >
            Submit Work Log
          </Button>
        </CardHeader>

        <CardContent className="max-h-[70vh] overflow-y-auto bg-gray-100 pt-6">
          <form
            id="worklog-form"
            onSubmit={form.handleSubmit(onSubmit, () => {
              setFormError(
                "Please fix the errors below. Check required fields and correct any invalid data.",
              );
            })}
          >
            <div className="space-y-8 text-gray-900">
              {fields.map((field, index) => (
                <Card
                  key={field.id}
                  className="relative border-gray-300 bg-gray-50"
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex">
                      <div className="flex-1">
                        <FieldGroup>
                          <p className="font-semibold text-gray-900">
                            {index + 1}. Task Name
                          </p>

                          <Controller
                            name={`tasks.${index}.taskName`}
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <Input
                                  {...field}
                                  className={inputClass}
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
                                <FieldLabel className="text-gray-900">
                                  Main Goal
                                </FieldLabel>
                                <Input
                                  {...field}
                                  className={inputClass}
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
                                  <FieldLabel className="text-gray-900">
                                    Collaborators
                                  </FieldLabel>
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {field.value
                                      .filter((name) => name !== "")
                                      .map((name, i) => (
                                        <span
                                          key={i}
                                          className="flex items-center gap-1 bg-gray-200 text-gray-900 text-sm px-2 py-1 rounded-full"
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
                                        (e.key === "Enter" || e.key === ",") &&
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
                                    className={inputClass}
                                    placeholder="Type a name and press Enter"
                                  />
                                </Field>
                              );
                            }}
                          />

                          <Controller
                            name={`tasks.${index}.dueDate`}
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel className="text-gray-900">
                                  Deadline
                                </FieldLabel>
                                <Input
                                  {...field}
                                  className={inputClass}
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
                                <FieldLabel className="text-gray-900">
                                  Completion
                                </FieldLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger
                                    className={inputClass + " text-gray-900"}
                                  >
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

                          <Controller
                            name={`tasks.${index}.reflection`}
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel className="text-gray-900">
                                  Reflection
                                </FieldLabel>
                                <InputGroup className="border-gray-300 bg-gray-100">
                                  <InputGroupTextarea
                                    {...field}
                                    placeholder="Write your reflection..."
                                    rows={4}
                                    className={
                                      "min-h-24 resize-none " + inputClass
                                    }
                                    aria-invalid={fieldState.invalid}
                                  />
                                  <InputGroupAddon align="block-end">
                                    <InputGroupText className="tabular-nums text-gray-600">
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
                      </div>

                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="self-center [writing-mode:vertical-lr] h-auto py-4 bg-orange-500 hover:bg-orange-600 text-white border-0"
                          onClick={() => remove(index)}
                        >
                          Remove Task
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-center pt-6 pb-2">
              <Button
                type="button"
                variant="outline"
                className="border-gray-400 bg-gray-200 text-gray-900 hover:bg-gray-300"
                onClick={() => append(emptyTask)}
              >
                Add New Task
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
