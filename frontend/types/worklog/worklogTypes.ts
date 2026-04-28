import * as z from "zod";

export const taskSchema = z
  .object({
    taskName: z.string().min(1, "Task name is required"),
    goal: z.string().min(1, "Main goal is required"),
    collaborators: z.array(z.string()),
    assignedUser: z.string(),
    creationDate: z.string(),
    dueDate: z.string().min(1, "Deadline is required"),
    status: z.enum(["not-started", "in-progress", "complete"], {
      message: "Select completion status",
    }),
    reflection: z
      .string()
      .min(1, "Reflection is required")
      .max(1000, "Reflection must be at most 1000 characters."),
    collabDescription: z
      .string()
      .max(1000, "Collaboration description must be at most 1000 characters."),
  })
  .refine(
    (data) =>
      data.collaborators.filter((c) => c !== "").length === 0 ||
      data.collabDescription.trim().length > 0,
    {
      message: "Describe how you worked with your collaborator(s)",
      path: ["collabDescription"],
    },
  );

export const workLogPostSchema = z.object({
  worklogName: z.string().optional(),
  authorName: z.string(),
  dateCreated: z.string(),
  dateSubmitted: z.string(),
  collaborators: z.array(z.string()),
  taskList: z.array(taskSchema).min(1, "At least one task is required"),
});

export const tasksSchema = z.object({
  tasks: z.array(taskSchema).min(1, "At least one task is required"),
});

export type taskType = z.infer<typeof tasksSchema>;
export type workLogPostType = z.infer<typeof workLogPostSchema>;
