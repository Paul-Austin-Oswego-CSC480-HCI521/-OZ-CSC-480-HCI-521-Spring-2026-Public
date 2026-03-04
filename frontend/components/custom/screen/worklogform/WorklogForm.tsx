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
  // to show success
  const [showSuccess, setShowSuccess] = useState(false);
  // for custom date
  const dateCreated = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
  // getting session id.
  const sessionId = useAtomValue(sessionIdAtom);

  // creating default values
  const emptyTask = {
    taskName: "",
    goal: "",
    collaborators: [] as string[],
    assignedUser: sessionId,
    status: undefined as unknown as "not-started",
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

  return (
    // to show success
    <div className="p-10">
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
          Work log submitted successfully!
        </div>
      )}

      <h1 className="text-4xl mb-8">Work Logs</h1>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-medium">
            Weekly Work Log
          </CardTitle>
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="ghost"
              className="hover:cursor-pointer"
              onClick={() => append(emptyTask)}
            >
              Add New Task
            </Button>
            <Button
              type="submit"
              form="worklog-form"
              className="bg-green-700 hover:cursor-pointer hover:bg-green-800"
            >
              Submit Work Log
            </Button>
          </div>
        </CardHeader>

        <CardContent className="max-h-[70vh] overflow-y-auto">
          <form
            id="worklog-form"
            onSubmit={form.handleSubmit(onSubmit, (errors) =>
              console.log("Validation errors:", errors),
            )}
          >
            <div className="space-y-8 text-muted-foreground">
              {fields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <CardContent className="pt-2">
                    <div className="flex">
                      <div className="flex-1">
                        <FieldGroup>
                          <p className="font-semibold">
                            {index + 1}. Task Name
                          </p>

                          <Controller
                            name={`tasks.${index}.taskName`}
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
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
                      </div>

                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="self-center [writing-mode:vertical-lr] h-auto py-4 bg-red-500/90 hover:bg-red-500 hover:text-white text-white"
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
