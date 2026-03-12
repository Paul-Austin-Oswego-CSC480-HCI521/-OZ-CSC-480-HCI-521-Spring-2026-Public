package task.application.classes;

import jakarta.validation.constraints.NotEmpty;

public class Task {

    @NotEmpty(message = "Task must be named.")
    private String taskName;

    @NotEmpty(message = "Task must have a goal defined.")
    private String goal;

    @NotEmpty(message = "Task needs assigned user(s).")
    private String assignedName; // Change this later to accommodate multiple assigned members

    @NotEmpty(message = "Task requires a due date.")
    private String deadline;

    @NotEmpty(message = "Task status cannot be empty.")
    private String status; // Could push this to be an enum of statuses, need t define statuses first

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }
    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }
    public String getAssignedName() { return assignedName; }
    public void setAssignedName(String assignedName) { this.assignedName = assignedName; }
    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

}