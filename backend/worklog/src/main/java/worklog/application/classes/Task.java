package worklog.application.classes;

import java.time.LocalDateTime;
import java.util.ArrayList;

public class Task {

    private String taskName; 

    private String goal;

    private String assignedUser; //Student or teacher object at some point? 
    
    private LocalDateTime dueDate;

    private LocalDateTime creationDate;
    private String status;

    private ArrayList<String> collaborators;

    private String reflection;

    private String collabDescription;

    public Task(){
        
    }

    public String getTaskName() {
        return this.taskName;
    }
    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }


    public String getGoal() {
        return this.goal;
    }
    public void setGoal(String goal) {
        this.goal = goal;
    }


    public String getAssignedUser() {
        return this.assignedUser;
    }
    public void setAssignedUser(String assignedUser) {
        this.assignedUser = assignedUser;
    }


    public LocalDateTime getDueDate() {
        return this.dueDate;
    }
    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }


    public LocalDateTime getCreationDate() {
        return this.creationDate;
    }
    public void setCreationDate(LocalDateTime creationDate) {
        this.creationDate = creationDate;
    }


    public ArrayList<String> getCollaborators() {
        return this.collaborators;
    }
    public void setCollaborators(ArrayList<String> collaborators) {
        this.collaborators = collaborators;
    }


    public String getStatus() {
        return this.status;
    }
    public void setStatus(String status) {
        this.status = status;
    }


    public String getReflection() {
        return this.reflection;
    }
    public void setReflection(String reflection) {
        this.reflection = reflection;
    }


    public String getCollabDescription() { return collabDescription; }
    public void setCollabDescription(String collabDescription) { this.collabDescription = collabDescription; }

}
