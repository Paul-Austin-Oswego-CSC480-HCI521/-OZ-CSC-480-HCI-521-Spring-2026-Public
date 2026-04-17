package auth.user;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.bson.Document;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class AuthRepository{
    private MongoCollection<Document> collection;

    @Inject 
    public void setCollection(MongoDatabase db){
        this.collection = db.getCollection("users");
    }

    public Document findByEmail(String email){
        return collection.find(new Document("email", email)).first();
    }

    public Document createUser(String email, String name, String role){
        List<String> teams = new ArrayList<>();
        if(role==null || (!role.equals("student") && !role.equals("instructor"))){
            role = "student";
        }
        if(role.equals("instructor")) {
            teams.add("stakeholders");
        }
        else {
            teams.add("unassigned");
        }
        Document newUser = new Document()
            .append("email", email)
            .append("name", name)
            .append("role", role)
            .append("createdAt", Instant.now())
            .append("teams", teams);
        collection.insertOne(newUser);
        return newUser;
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
        Document user = findByEmail(email);
        collection.deleteOne(new Document("email", email));
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

}