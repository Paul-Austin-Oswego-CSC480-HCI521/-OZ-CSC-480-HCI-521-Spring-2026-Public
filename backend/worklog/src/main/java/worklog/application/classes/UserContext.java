package worklog.application.classes;

import jakarta.enterprise.context.RequestScoped;

@RequestScoped
public class UserContext {

    private String classID; // The constant value needs to be changed when we have class codes in place

    public void setClassID(String classID) { this.classID = classID; }
    public String getClassID() { return classID; }

}
