"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { submitWorkLog } from "../../utils/tanstack_utils/worklogs/allReq";

import {
  workLogPostSchema,
  workLogPostType,
} from "@/types/worklog/worklogTypes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const emptyTask = {
  taskName: "",
  mainGoal: "",
  collaborators: "",
  deadline: "",
  completion: undefined as unknown as "not-started",
  reflection: "",
};

export function WorkLogForm() {
  const form = useForm<workLogPostType>({
    resolver: zodResolver(workLogPostSchema),
    defaultValues: {
      tasks: [emptyTask],
    },
  });
  const mutation = useMutation({ mutationFn: submitWorkLog });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  function onSubmit(data: workLogPostType) {
    console.log(data);
    // mutation.mutate()
  }

  return (
    // <div className="max-w-4xl mx-auto py-10 px-4">
    <div className="p-10">
      <h1 className="text-4xl font-bold mb-8">Work Logs</h1>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Weekly Work Log 3</CardTitle>
          <div className=" grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => append(emptyTask)}
            >
              Add New Task
            </Button>
            <Button type="submit" form="worklog-form" className="bg-green-700">
              Submit Work Log
            </Button>
          </div>
        </CardHeader>

        <CardContent className="max-h-[70vh] overflow-y-auto">
          <form id="worklog-form" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-8">
              {fields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <FieldGroup>
                          <p className="font-semibold mb-2">
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
                            name={`tasks.${index}.mainGoal`}
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
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Collaborators</FieldLabel>
                                <Input
                                  {...field}
                                  placeholder="Collaborators"
                                  aria-invalid={fieldState.invalid}
                                />
                              </Field>
                            )}
                          />

                          <Controller
                            name={`tasks.${index}.deadline`}
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
                            name={`tasks.${index}.completion`}
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
                          className="self-center [writing-mode:vertical-lr] h-auto py-4"
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
