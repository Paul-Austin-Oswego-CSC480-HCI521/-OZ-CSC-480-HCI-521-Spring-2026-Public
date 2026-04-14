package auth.user;


public class User{
    private String email;
    private String name;
    private String role;
    private String createdAt;
    private String classID;

    public User(){}


    public User(String email, String name, String role, String createdAt){
            this.email = email;
            this.name = name;
            this.role = role;
            this.createdAt = createdAt;
        }

    public User(String email, String name, String role, String createdAt, String classID){
            this.email = email;
            this.name = name;
            this.role = role;
            this.createdAt = createdAt;
            this.classID = classID;
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
        public String getClassID(){
            return classID;
        }
        public void setClassID(String classID){
            this.classID = classID;
        }
    }
