package auth.user;

import java.util.List;

public class User{
    private String email;
    private String name;
    private String role;
    private String createdAt;
    private String preferredName;
    private List<String> team;
    private String classStanding;
    private Boolean isArchived;
    private String classID;

    public User(){}


    public User(String email, String name, String role, String createdAt, String preferredName, List<String> team, String classStanding, Boolean isArchived){
            this.email = email;
            this.name = name;
            this.role = role;
            this.createdAt = createdAt;
            this.preferredName = preferredName;
            this.team = team;
            this.classStanding = classStanding;
            this.isArchived = isArchived;
        }

    public User(String email, String name, String role, String createdAt, String classID){
            this.email = email;
            this.name = name;
            this.role = role;
            this.createdAt = createdAt;
            this.classID = classID;
        }

    public User(String email, String name, String role, String createdAt){
            this.email = email;
            this.name = name;
            this.role = role;
            this.createdAt = createdAt;
        }

        public String getEmail(){
            return email;
        }

        public void setEmail(String email){
            this.email = email;
        }

        public String getName(){
            return name;
        }

        public void setName(String name){
            this.name = name;
        }

        public String getRole(){
            return role;
        }

        public void setRole(String role){
            this.role = role;
        }

        public String getCreatedAt(){
            return createdAt;
        }

        public void setCreatedAt(String createdAt){
            this.createdAt = createdAt;
        }

        public String getPreferredName(){
            return preferredName;
        }

        public void setPreferredName(String preferredName){
            this.preferredName = preferredName;
        }

        public List<String> getTeam(){
            return team;
        }

        public void setTeam(List<String> team){
            this.team = team;
        }

        public String getClassStanding(){
            return classStanding;
        }

        public void setClassStanding(String classStanding){
            this.classStanding = classStanding;
        }

        public Boolean getIsArchived(){
            return isArchived;
        }

        public void setIsArchived(Boolean isArchived){
            this.isArchived = isArchived;
        }

        public String getClassID(){
            return classID;
        }
        
        public void setClassID(String classID){
            this.classID = classID;
        }
    }
