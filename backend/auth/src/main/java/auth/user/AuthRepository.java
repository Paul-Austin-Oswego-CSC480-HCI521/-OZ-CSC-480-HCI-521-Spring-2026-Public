package auth.user;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.bson.Document;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class AuthRepository{

    @Inject
    private MongoClient mongoClient;

    private MongoCollection<Document> collection;

    @Inject 
    public void setCollection(MongoDatabase db){
        this.collection = db.getCollection("users");
    }

    public Document findByEmail(String email){
        return collection.find(new Document("email", email)).first();
    }

    public Document createUser(String email, String name, String role, String preferredName, List<String> team){
        if (team == null) team = new ArrayList<>();     
        if(role==null || (!role.equals("student") && !role.equals("instructor"))){
            role = "student";
        }
        if(role.equals("instructor")) {
            team.add("stakeholders");
        }
        else {
            team.add("unassigned");
        }
        Document newUser = new Document()
            .append("email", email)
            .append("name", name)
            .append("role", role)
            .append("preferredName", preferredName)
            .append("team", team)
            .append("classStanding", "")
            .append("isArchived", false)
            .append("createdAt", Instant.now());
        collection.insertOne(newUser);
        return newUser;
    }

    public Document addUserToClass(String email, String classID) {

        if (!mongoClient.listDatabaseNames().into(new ArrayList<>()).contains(classID)) return null;

        Document user = findByEmail(email);
        if (user == null) return null;

        String existingClassID = user.getString("classID");

        if (existingClassID != null) {
            if (existingClassID.equals(classID)) return null;

            MongoDatabase oldClassDb = mongoClient.getDatabase(existingClassID);
            MongoCollection<Document> oldClassData = oldClassDb.getCollection("classData");
            oldClassData.updateOne(
                new Document("classID", existingClassID),
                new Document("$pull", new Document("students", new Document("email", email)))
            );
        }


        user.put("classID", classID);
        collection.replaceOne(new Document("email", email), user);

        MongoDatabase classDb = mongoClient.getDatabase(classID);
        MongoCollection<Document> classData = classDb.getCollection("classData");

        Document studentDoc = new Document()
            .append("email", email)
            .append("name", user.getString("name"))
            .append("role", user.getString("role"))
            .append("createdAt", user.get("createdAt"));

        classData.updateOne(
            new Document("classID", classID),
            new Document("$push", new Document("students", studentDoc))
        );

        return user;
    }

    public Document removeUserFromClass(String email) {
        
        Document user = findByEmail(email);
        
        if (user == null) return null;
        if (!mongoClient.listDatabaseNames().into(new ArrayList<>()).contains(user.getString("classID"))) return null;

        String existingClassID = user.getString("classID");
        if (existingClassID != null) {
            MongoDatabase oldClassDb = mongoClient.getDatabase(existingClassID);
            MongoCollection<Document> oldClassData = oldClassDb.getCollection("classData");
            oldClassData.updateOne(
                new Document("classID", existingClassID),
                new Document("$pull", new Document("students", new Document("email", email)))
            );
        }

        user.remove("classID");
        collection.replaceOne(new Document("email", email), user);
        
        return user;
    }

    public List<Document> getAllUsers(){
        return collection.find().into(new ArrayList<>());
    }

    public List<Document> getUsersByRole(String role){
        return collection.find(new Document("role", role)).into(new ArrayList<>());
    }

    public List<Document> getUsersByTeam(String teams) {
        return collection.find(new Document("teams", teams)).into(new ArrayList<>());
    }

    public Document updateUserRole(String email, String newRole){
        Document user = findByEmail(email);
        if(user!=null){
            user.put("role", newRole);
            collection.replaceOne(new Document("email", email), user);
        }
        return user;
    }

    public Document updateUserTeams(String email, List<String> newTeams) {
        Document user = findByEmail(email);
        if(user!=null){
            user.put("teams", newTeams);
            collection.replaceOne(new Document("email", email), user);
        }
        return user;
    }

    public Document removeUser(String email) {
        removeUserFromClass(email);
        Document user = findByEmail(email);
        collection.deleteOne(new Document("email", email));
        return user;
    }

    public Document updateUserTeam(String email, List<String> teams){
        Document user = findByEmail(email);
        if(user!=null){
            user.put("team", teams);
            collection.replaceOne(new Document("email", email), user);
        }
        return user;
    }

    
    public Document removeUserTeams(String email) {
        Document user = findByEmail(email);
        if (user!=null) {
            List<String> newTeams = new ArrayList<>();
            newTeams.add("unassigned");
            user.put("teams", newTeams);
            collection.replaceOne(new Document("email", email), user);
        }
        return user;
    }

    public Document updateUserPreferredName(String email, String preferredName){
        Document user = findByEmail(email);
        if(user!=null){
            user.put("preferredName", preferredName);
            collection.replaceOne(new Document("email", email), user);
        }
        return user;
     }

    public Document updateUserClassStanding(String email, String classStanding){
        Document user = findByEmail(email);
        if(user!=null){
            user.put("classStanding", classStanding);
            collection.replaceOne(new Document("email", email), user);
        }
        return user;
    }

    public Document archiveUser(String email) {
        Document user = findByEmail(email);
        if(user!=null){
            user.put("isArchived", true);
            collection.replaceOne(new Document("email", email), user);
        }
        return user;
    }

    public Document unarchiveUser(String email) {
        Document user = findByEmail(email);
        if(user!=null){
            user.put("isArchived", false);
            collection.replaceOne(new Document("email", email), user);
        }
        return user;
    }

    public List<Document> getArchivedUsers() {
        return collection.find(new Document("isArchived", true)).into(new ArrayList<>());
    }
    
    public List<Document> getUsersFromClass(String classID) {
        return collection.find(new Document("classID", classID)).into(new ArrayList<>());
    }

    public Document createClass(StudentClass studentClass) {
        MongoDatabase classDb = mongoClient.getDatabase(studentClass.getClassID());
        MongoCollection<Document> classData = classDb.getCollection("classData");

        if (classData.find().first() != null) {
            return null;
        }

        Document classDoc = new Document()
            .append("classID", studentClass.getClassID())
            .append("semesterStartDate", studentClass.getSemesterStartDate())
            .append("semsesterEndDate", studentClass.getSemsesterEndDate())
            .append("studendAccessEndDate", studentClass.getStudendAccessEndDate())
            .append("isArchived", studentClass.getIsArchived())
            .append("students", studentClass.getStudents());

        classData.insertOne(classDoc);
        return classDoc;

    }

    public List<Document> getClasses() {
        Iterable<String> classNames = mongoClient.listDatabaseNames();
        ArrayList<Document> classDocs = new ArrayList<>();
        List<String> systemDBs = List.of("admin", "local", "config");

        for (String name : classNames) {
            if (systemDBs.contains(name)) continue;

            MongoCollection<Document> currCollection = mongoClient.getDatabase(name).getCollection("classData");
            Document classDataDoc = currCollection.find().first();
            if (classDataDoc != null) {
                classDocs.add(classDataDoc);
            }
        }

        return classDocs;

    }

    public Document removeClass(String classID) {
        MongoDatabase classDb = mongoClient.getDatabase(classID);
        MongoCollection<Document> classData = classDb.getCollection("classData");
        Document classDoc = classData.find().first();
        classDb.drop();
        return classDoc;
    }

    public Document getStudentClass(String classID) {
        MongoDatabase classDb = mongoClient.getDatabase(classID);
        MongoCollection<Document> classData = classDb.getCollection("classData");

        return classData.find().first();

    }

     public Document archiveClass(String classID) {                                                                                  
      MongoDatabase classDb = mongoClient.getDatabase(classID);                                                                                                                      
      MongoCollection<Document> classData = classDb.getCollection("classData");                                                                                                      
      classData.updateOne(                                                                                                                                                           
          new Document("classID", classID),                                                                                                                                          
          new Document("$set", new Document("isArchived", true))                                                                                                                     
      );                                                                                                                                                                             
      return classData.find(new Document("classID", classID)).first();
  }    

}
