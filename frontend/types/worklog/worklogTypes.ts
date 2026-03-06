import * as z from "zod";

const dateStringSchema = z
  .string()
  .min(1, "Deadline is required")
  .refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "Please enter a valid date for the deadline.",
  });

export const taskSchema = z.object({
  taskName: z.string().min(1, "Task name is required"),
  goal: z.string().min(1, "Main goal is required"),
  collaborators: z.array(z.string()),
  assignedUser: z.string(),
  creationDate: z.string(),
  dueDate: dateStringSchema,
  status: z.enum(["not-started", "in-progress", "complete"], {
    errorMap: () => ({ message: "Please select a completion status." }),
  }),
  reflection: z
    .string()
    .min(1, "Reflection is required")
    .max(500, "Reflection must be at most 500 characters."),
});

export const workLogPostSchema = z.object({
  authorName: z.string(),
  dateCreated: z.string(),
  dateSubmitted: z.string(),
  collaborators: z.array(z.string()),
  taskList: z.array(taskSchema).min(1, "At least one task is required"),
});

export const tasksSchema = z.object({
  tasks: z
    .array(taskSchema)
    .min(1, "At least one task is required. Add a task before submitting."),
});

export type taskType = z.infer<typeof tasksSchema>;
export type workLogPostType = z.infer<typeof workLogPostSchema>;
