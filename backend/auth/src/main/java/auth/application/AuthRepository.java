package auth.application;

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

    public Document createUser(String email){
        Document newUser = new Document()
            .append("email", email)
            .append("role", "user")
            .append("createdAt", Instant.now().toString());
        collection.insertOne(newUser);
        return newUser;
    }
    public List<Document> getAllUsers(){
        return collection.find().into(new ArrayList<>());
    }

}