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
import jakarta.ws.rs.core.Response;

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

    public Document createUser(String email, String name, String role){
        if(role==null || (!role.equals("student") && !role.equals("instructor"))){
            role = "student";
        }
        Document newUser = new Document()
            .append("email", email)
            .append("name", name)
            .append("role", role)
            .append("createdAt", Instant.now());
        collection.insertOne(newUser);
        return newUser;
    }

    public Document addUserToClass(String email, String classID) {
        Document user = findByEmail(email);
        if (user != null) {
            user.put("classID", classID);
            collection.replaceOne(new Document("email", email), user);
        }
        return user;
    }

    public Document removeUserFromClass(String email) {
        Document user = findByEmail(email);
        if (user != null) {
            user.remove("classID");
            collection.replaceOne(new Document("email", email), user);
        }
        return user;
    }

    public List<Document> getAllUsers(){
        return collection.find().into(new ArrayList<>());
    }

    public List<Document> getUsersByRole(String role){
        return collection.find(new Document("role", role)).into(new ArrayList<>());
    }

    public Document updateUserRole(String email, String newRole){
        Document user = findByEmail(email);
        if(user!=null){
            user.put("role", newRole);
            collection.replaceOne(new Document("email", email), user);
        }
        return user;
    }

    public Document removeUser(String email) {
        Document user = findByEmail(email);
        collection.deleteOne(new Document("email", email));
        return user;
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
            .append("isArchived", studentClass.getIsArchived());

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

}