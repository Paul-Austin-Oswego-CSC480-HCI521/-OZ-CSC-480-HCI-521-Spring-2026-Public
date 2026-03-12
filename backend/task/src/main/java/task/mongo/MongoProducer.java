package task.mongo;

import java.util.List;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoCredential;
import com.mongodb.ServerAddress;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Disposes;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;

@ApplicationScoped
public class MongoProducer {

    @Inject @ConfigProperty(name = "mongo.hostname", defaultValue = "localhost")
    String hostname;

    @Inject @ConfigProperty(name = "mongo.port", defaultValue = "27017")
    int port;

    @Inject @ConfigProperty(name = "mongo.dbname", defaultValue = "worklogs")
    String dbName;

    @Inject @ConfigProperty(name = "mongo.username")
    String user;

    @Inject @ConfigProperty(name = "mongo.password")
    String password;

    @Produces
    @ApplicationScoped
    public MongoClient createMongo() {
        MongoCredential creds = MongoCredential.createCredential(
            user, dbName, password.toCharArray());

        MongoClientSettings settings = MongoClientSettings.builder()
            .credential(creds)
            .applyToClusterSettings(b -> b.hosts(List.of(new ServerAddress(hostname, port))))
            .build();

        return MongoClients.create(settings);
    }

    @Produces
    public MongoDatabase createDB(MongoClient client) {
        return client.getDatabase(dbName);
    }

    public void close(@Disposes MongoClient toClose) {
        toClose.close();
    }
}