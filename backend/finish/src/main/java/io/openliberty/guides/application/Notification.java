package io.openliberty.guides.application;



import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;

public class Notification {

    @NotEmpty(message = "Notifications must have a String ID")
    private String id;

    @NotEmpty(message = "Notifications must have a message!")
    private String message;

    @NotEmpty(message = "Notifications must have a due date!")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "Date must be in format YYYY-MM-DD")
    private String date;

    public String getID() {return id;}
    public void setID(String id) {this.id = id;}
    public String getMessage() {return message;}
    public void setMessage(String mes) {message = mes;}
    public String getDate() {return date;}
    public void setDate(String dat) {date = dat;}
    
}
