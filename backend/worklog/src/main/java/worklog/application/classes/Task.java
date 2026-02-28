package worklog.application.classes;

import java.time.LocalDate;
import java.util.ArrayList;

public class Task {

    private String taskName; 

    private String goal;

    private String assignedUser; //Student or teacher object at some point? 
    
    private LocalDate dueDate;

    private LocalDate creationDate;

    private ArrayList<String> collaborators;

    public Task(){
        
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }



    public String getGoal() {
        return goal;
    }



    public void setGoal(String goal) {
        this.goal = goal;
    }



    public String getAssignedUser() {
        return assignedUser;
    }



    public void setAssignedUser(String assignedUser) {
        this.assignedUser = assignedUser;
    }



    public LocalDate getDueDate() {
        return dueDate;
    }



    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }



    public LocalDate getCreationDate() {
        return creationDate;
    }



    public void setCreationDate(LocalDate creationDate) {
        this.creationDate = creationDate;
    }



    public ArrayList<String> getCollaborators() {
        return collaborators;
    }



    public void setCollaborators(ArrayList<String> collaborators) {
        this.collaborators = collaborators;
    }



    public String getStatus() {
        return status;
    }



    public void setStatus(String status) {
        this.status = status;
    }



    private String status;

    

    public String getTaskName() {
        return taskName;
    }


}
