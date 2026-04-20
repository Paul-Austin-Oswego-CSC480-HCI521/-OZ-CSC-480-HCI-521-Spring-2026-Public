package auth.user;

import java.sql.Date;
import java.util.ArrayList;

public class StudentClass {

    private String classID;
    private Date semesterStartDate;
    private Date semsesterEndDate;
    private Date studendAccessEndDate;
    private boolean isArchived;

    private ArrayList<User> students = new ArrayList<>();
    

    public StudentClass(){}

    public StudentClass(String classID, Date semesterStartDate, Date semsesterEndData, Date studendAccessEndDate) {
        this.classID = classID; 
        this.semesterStartDate = semesterStartDate; 
        this.semsesterEndDate = semsesterEndData; 
        this.studendAccessEndDate = studendAccessEndDate;  
    }

    public StudentClass(String classID, Date semesterStartDate, Date semsesterEndData, Date studendAccessEndDate, boolean isArchived) {
        this.classID = classID; 
        this.semesterStartDate = semesterStartDate; 
        this.semsesterEndDate = semsesterEndData; 
        this.studendAccessEndDate = studendAccessEndDate; 
        this.isArchived = isArchived; 
    }

    public String getClassID() {
        return classID;
    }

    public void setClassID(String classID) {
        this.classID = classID;
    }

    public Date getSemesterStartDate() {
        return semesterStartDate;
    }

    public void setSemesterStartDate(Date semesterStartDate) {
        this.semesterStartDate = semesterStartDate;
    }

    public Date getSemsesterEndDate() {
        return semsesterEndDate;
    }

    public void setSemsesterEndDate(Date semsesterEndDate) {
        this.semsesterEndDate = semsesterEndDate;
    }

    public Date getStudendAccessEndDate() {
        return studendAccessEndDate;
    }

    public void setStudendAccessEndDate(Date studendAccessEndDate) {
        this.studendAccessEndDate = studendAccessEndDate;
    }

    public boolean getIsArchived() {
        return isArchived;
    }

    public void setIsArchived(boolean isArchived) {
        this.isArchived = isArchived;
    }

    public ArrayList<User> getStudents() {
        return students;
    }

    public void addStudent(User student) {
        if (students.contains(student)) {
            return;
        }
        students.add(student);
    }

    public void removeStudent(User student) {
        if (!students.contains(student)) {
            return;
        }
        students.remove(student);
    }
}
