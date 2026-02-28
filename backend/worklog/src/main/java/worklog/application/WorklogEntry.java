package worklog.application;


import java.time.LocalDate;
import java.util.Dictionary;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import worklog.application.classes.Task;


public class WorklogEntry {
    
    @NotEmpty(message = "Worklog must have an author!")
    private String authorName;
    
    @PastOrPresent(message = "Can't be created in the future")
    @NotNull(message = "Date created required")
    private LocalDate dateCreated;

    @PastOrPresent(message = "Can't be submitted in the future")
    private LocalDate dateSubmitted;
    
    @Valid
    private List<@NotEmpty @Size(max = 50) String> collaborators; 

    @NotNull(message = "Need tasks!")
    private Dictionary<Integer, Task> taskList;


    public void setAuthorName(String name) {
        this.authorName = name;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setDateCreated(LocalDate dateCreated) {
        this.dateCreated = dateCreated;
    }

    public LocalDate getDateCreated() {
        return dateCreated;
    }

    public void setDateSubmitted(LocalDate dateSubmitted) {
        this.dateSubmitted = dateSubmitted;
    }

    public LocalDate getDateSubmitted() {
        return dateSubmitted;
    }

    public void setCollaborators(List<String> collaborators) {
        this.collaborators = collaborators;
    }

    public List<String> getCollaborators() {
        return collaborators;
    }

    public void setTaskList(Dictionary<Integer, Task> taskList) {
        this.taskList = taskList;
    }

    public Dictionary<Integer, Task> getTaskList() {
        return taskList;
    }


}

