package worklog.application;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import jakarta.inject.Inject;
import jakarta.enterprise.context.ApplicationScoped;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import com.mongodb.client.model.Filters;
import static com.mongodb.client.model.Filters.eq;
import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;
import com.mongodb.MongoClientSettings;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped // Add this so CDI can manage this class
public class WorklogRepository {

    private MongoCollection<WorklogEntry> collection;

    // Use Inject! The MongoProducer will provide the 'db' automatically
    @Inject
    public void setCollection(MongoDatabase db) {
        // 1. Set up your POJO translator
        CodecRegistry pojoCodecRegistry = fromRegistries(
            MongoClientSettings.getDefaultCodecRegistry(),
            fromProviders(PojoCodecProvider.builder().automatic(true).build())
        );

        // 2. Apply the registry to the database provided by the producer
        MongoDatabase codecDb = db.withCodecRegistry(pojoCodecRegistry);

        // 3. Initialize the collection
        this.collection = codecDb.getCollection("worklogs", WorklogEntry.class);
    }

    public void addWorklog(WorklogEntry entry) {
        collection.insertOne(entry);
    }

	public List<WorklogEntry> getAll() {
		return collection.find().into(new ArrayList<>());
	}

	public List<WorklogEntry> findByAuthor(String authorName) {
		return collection.find(eq("authorName", authorName)).into(new ArrayList<>());
	}
    
}