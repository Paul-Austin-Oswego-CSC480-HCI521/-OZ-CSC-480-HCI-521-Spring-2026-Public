package worklog.application;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import worklog.application.classes.Task;

public class WorklogEntry {

    @NotEmpty(message = "Worklog must have an author!")
    private String authorName;

    // @NotEmpty(message = "Worklog must have all the teams associated!")
    private List<String> teamNames;
    
    @NotEmpty(message = "Worklog must have week name!")
    private String worklogName;

    @NotNull(message = "Date created required")
    private LocalDateTime dateCreated;

    @NotNull(message = "Date submitted required")
    private LocalDateTime dateSubmitted;

    // @NotNull(message = "Deadline required")
    private LocalDateTime deadline;
    private boolean reviewed = false;

    @Valid
    private List<@NotEmpty @Size(max = 50) String> collaborators;

    @NotNull(message = "Need tasks!")
    private List<Task> taskList;

    private boolean isDraft;



    public void setAuthorName(String name) {
        this.authorName = name;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setTeamNames(List<String> teamNames) {
        this.teamNames = teamNames;
    }

    public List<String> getTeamNames() {
        return teamNames;
    }

    public void setWorklogName(String worklogName) {
        this.worklogName = worklogName;
    }
    
    public String getWorklogName() {
        return worklogName;
    }

    public void setDateCreated(LocalDateTime dateCreated) {
        this.dateCreated = dateCreated;
    }

    public LocalDateTime getDateCreated() {
        return dateCreated;
    }

    public void setDateSubmitted(LocalDateTime dateSubmitted) {
        this.dateSubmitted = dateSubmitted;
    }

    public LocalDateTime getDateSubmitted() {
        return dateSubmitted;
    }

    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public void setCollaborators(List<String> collaborators) {
        this.collaborators = collaborators;
    }

    public List<String> getCollaborators() {
        return collaborators;
    }

    public void setTaskList(List<Task> taskList) {
        this.taskList = taskList;
    }

    public List<Task> getTaskList() {
        return taskList;
    }

    public void setisDraft(boolean isDraft) {
        this.isDraft = isDraft;
    }

    public boolean getisDraft() {
        return isDraft;
    }

    public void setReviewed(boolean reviewed) {
        this.reviewed = reviewed;
    }

    public boolean isReviewed() {
        return reviewed;
    }


}
