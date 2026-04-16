package auth.user;

import java.time.Instant;
import java.util.UUID;

import org.bson.Document;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class RefreshRepository {
    private MongoCollection<Document> collection;

    @Inject
    public void setCollection(MongoDatabase db) {
        this.collection = db.getCollection("refresh_tokens");
        collection.createIndex(
            new Document("expiresAt", 1),
            new com.mongodb.client.model.IndexOptions().expireAfter(0L, java.util.concurrent.TimeUnit.SECONDS)
        );
    }

    public Document create(String userId, String email) {
        String token = UUID.randomUUID().toString() + UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusSeconds(604800); // 7 days

        Document doc = new Document()
            .append("token", token)
            .append("userId", userId) //is use
            .append("email", email)
            .append("expiresAt", java.util.Date.from(expiresAt))
            .append("createdAt", java.util.Date.from(Instant.now()));

        collection.insertOne(doc);
        return doc;
    }

    public Document findByToken(String token) {
        return collection.find(new Document("token", token)).first();
    }

    public void deleteByToken(String token) {
        collection.deleteOne(new Document("token", token));
    }

    public void deleteAllForUser(String email) {
        collection.deleteMany(new Document("email", email));
    }
}

