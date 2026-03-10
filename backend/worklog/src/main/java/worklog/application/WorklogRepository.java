package worklog.application;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonArrayBuilder;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import jakarta.ws.rs.core.Response;
import worklog.application.classes.Task;
import jakarta.enterprise.context.ApplicationScoped;

import org.bson.Document;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.FindOneAndReplaceOptions;
import com.mongodb.client.result.DeleteResult;

import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;
import com.mongodb.MongoClientSettings;

import java.io.StringWriter;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;


@ApplicationScoped // Add this so CDI can manage this class
public class WorklogRepository {

    private MongoCollection<Document> collection;

    @Inject
    Validator validator;

    DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

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
        this.collection = codecDb.getCollection("worklogs");
    }

    public Response addWorklog(WorklogEntry entry) {
        JsonArray violations = getViolations(entry);

        if (!violations.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity(violations.toString()).build();
        }

        Document newDoc = new Document();

        newDoc.put("authorName", entry.getAuthorName());
        newDoc.put("dateCreated", entry.getDateCreated().format(dateTimeFormatter));
        newDoc.put("dateSubmitted", entry.getDateSubmitted().format(dateTimeFormatter));
        newDoc.put("collaborators", entry.getCollaborators());
        newDoc.put("taskList", formatTask(entry.getTaskList()));

        collection.insertOne(newDoc);

        return Response.status(Response.Status.OK).entity(newDoc.toJson()).build();
    }

    public Response addWorklogDraft(WorklogEntry entry , String userID) {

        Document newDoc = new Document();

        Optional.ofNullable(entry.getAuthorName())
            .ifPresent(v -> newDoc.put("authorName", v));

        Optional.ofNullable(entry.getDateCreated())
            .ifPresent(v -> newDoc.put("dateCreated", v.format(dateTimeFormatter)));

        Optional.ofNullable(entry.getDateSubmitted())
            .ifPresent(v -> newDoc.put("dateSubmitted", v.format(dateTimeFormatter)));

        Optional.ofNullable(entry.getCollaborators())
            .ifPresent(v -> newDoc.put("collaborators", v));
            
        Optional.ofNullable(entry.getTaskList())
            .ifPresent(v -> newDoc.put("taskList", formatTask(v)));

        newDoc.put("isDraft", true);

        collection.findOneAndReplace(Filters.and(
            Filters.eq("authorName", entry.getAuthorName()),
            Filters.eq("isDraft", true)

        ), newDoc, new FindOneAndReplaceOptions().upsert(true));

        return Response.status(Response.Status.OK).entity(newDoc.toJson()).build();
    }

	public Response getAll() {
		return responseByQuery(null);
	}

	public Response findByAuthor(String authorName) {
        return responseByQuery(new Document("authorName", authorName));
	}

    public Response deleteAll() {
        collection.drop();
        return Response.status(Response.Status.OK).entity("[\"Dropped collection\"]").build();
    }




    //input null for getAll
    private Response responseByQuery(Document query) {
        StringWriter sb = new StringWriter();
        try {
            sb.append("[");
            FindIterable<Document> docs;

            if (query != null) {docs = collection.find(query);}
		    else {docs = collection.find();}

            boolean first = true;
            for (Document d : docs) {
                if (!first) sb.append(",");
                else first = false;
                sb.append(d.toJson());
            }
            sb.append("]");
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
        return Response.status(Response.Status.OK).entity(sb.toString()).build();
    }

    private List<Document> formatTask(List<Task> taskList) {
        List<Document> taskDocs = new ArrayList<>();

        for (Task task : taskList) {
            Document newDoc = new Document();

            Optional.ofNullable(task.getTaskName())
                .ifPresent(v -> newDoc.put("taskName", v));

            Optional.ofNullable(task.getGoal())
                .ifPresent(v -> newDoc.put("goal", v));

            Optional.ofNullable(task.getAssignedUser())
                .ifPresent(v -> newDoc.put("assignedUser", v));

            Optional.ofNullable(task.getDueDate())
                .ifPresent(v -> newDoc.put("dueDate", v.format(dateTimeFormatter)));
                
            Optional.ofNullable(task.getCreationDate())
                .ifPresent(v -> newDoc.put("creationDate", v.format(dateTimeFormatter)));

            Optional.ofNullable(task.getCollaborators())
                .ifPresent(v -> newDoc.put("collaborators", v));

            taskDocs.add(newDoc);
        }

        return taskDocs;
    }


    private JsonArray getViolations(WorklogEntry worklog) {
        Set<ConstraintViolation<WorklogEntry>> violations = validator.validate(worklog);
        JsonArrayBuilder messages = Json.createArrayBuilder();
        for (ConstraintViolation<WorklogEntry> v : violations) {
            messages.add(v.getMessage());
        }
        return messages.build();
    }
    
}