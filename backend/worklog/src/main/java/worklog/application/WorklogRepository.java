package worklog.application;

import java.io.StringWriter;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.bson.Document;
import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.bson.conversions.Bson;
import org.bson.json.JsonWriterSettings;
import org.bson.types.ObjectId;

import com.mongodb.MongoClientSettings;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import static com.mongodb.client.model.Filters.eq;
import com.mongodb.client.model.FindOneAndReplaceOptions;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonArrayBuilder;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import jakarta.ws.rs.core.Response;
import worklog.application.classes.Task;

@ApplicationScoped // Add this so CDI can manage this class
public class WorklogRepository {

    private MongoCollection<Document> collection;

    @Inject
    Validator validator;

    Bson excludeDraft = Filters.or(
            Filters.exists("isDraft", false),
            Filters.eq("isDraft", false));

    @Inject
    public void setCollection(MongoDatabase db) {
        CodecRegistry pojoCodecRegistry = fromRegistries(
                MongoClientSettings.getDefaultCodecRegistry(),
                fromProviders(PojoCodecProvider.builder().automatic(true).build()));

        // Apply the registry to the database provided by the producer
        MongoDatabase codecDb = db.withCodecRegistry(pojoCodecRegistry);

        this.collection = codecDb.getCollection("worklogs");
    }

    public Response addWorklog(WorklogEntry entry) {
        JsonArray violations = getViolations(entry);

        if (!violations.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity(violations.toString()).build();
        }

        collection.deleteMany(Filters.and(
                Filters.eq("authorName", entry.getAuthorName()),
                Filters.eq("worklogName", entry.getWorklogName()),
                Filters.eq("isDraft", true)));

        Document newDoc = new Document();

        newDoc.put("authorName", entry.getAuthorName());
        newDoc.put("dateCreated", Date.from(entry.getDateCreated().toInstant(ZoneOffset.UTC)));
        newDoc.put("dateSubmitted", Date.from(entry.getDateSubmitted().toInstant(ZoneOffset.UTC)));
        newDoc.put("collaborators", entry.getCollaborators());
        newDoc.put("worklogName", entry.getWorklogName());
        newDoc.put("taskList", formatTask(entry.getTaskList()));
        newDoc.put("teamNames", entry.getTeamNames());
        newDoc.put("deadline", entry.getDeadline());
        newDoc.put("reviewed", false);
        newDoc.put("isDraft", false);

        collection.insertOne(newDoc);

        return Response.status(Response.Status.OK).entity(newDoc.toJson()).build();
    }

    public Response addWorklogDraft(WorklogEntry entry) {

        Document newDoc = new Document();

        Optional.ofNullable(entry.getDateCreated())
                .ifPresent(v -> newDoc.put("dateCreated", Date.from(v.toInstant(ZoneOffset.UTC))));

        Optional.ofNullable(entry.getDateSubmitted())
                .ifPresent(v -> newDoc.put("dateSubmitted", Date.from(v.toInstant(ZoneOffset.UTC))));

        Optional.ofNullable(entry.getCollaborators())
                .ifPresent(v -> newDoc.put("collaborators", v));

        Optional.ofNullable(entry.getTaskList())
                .ifPresent(v -> newDoc.put("taskList", formatTask(v)));

        newDoc.put("authorName", entry.getAuthorName());
        newDoc.put("worklogName", entry.getWorklogName());
        newDoc.put("teamNames", entry.getTeamNames());
        newDoc.put("isDraft", true);
        newDoc.put("reviewed", false);

        collection.findOneAndReplace(Filters.and(
                Filters.eq("authorName", entry.getAuthorName()),
                Filters.eq("worklogName", entry.getWorklogName()),
                Filters.eq("isDraft", true)

        ), newDoc, new FindOneAndReplaceOptions().upsert(true));

        return Response.status(Response.Status.OK).entity(newDoc.toJson()).build();
    }

    public Response getAll() {
        return responseByQuery(excludeDraft);
    }

    // TODO ADD FILTER FOR CURRENT USER
    public Response getDraft() {
        return responseByQuery(Filters.eq("isDraft", true));
    }

    public Response getByDeadline(LocalDateTime deadline) {
        return responseByQuery(Filters.eq("deadline", deadline));
    }

    public Response getByDateSubmitted(LocalDateTime dateSubmitted) {
        return responseByQuery(Filters.eq("dateSubmitted", dateSubmitted));
    }

    public Response getByAuthorName(String authorName) {
        return responseByQuery(Filters.eq("authorName", authorName));
    }

    public Response getByTeamNames(List<String> teamNames) {
        return responseByQuery(Filters.eq("teamNames", teamNames));
    }

    // New functionality for findByAuthor: if an instructor is the one seeing it,
    // then update the "reviewed" field.
    public Response findByAuthor(String authorName) {
        return responseByQuery(Filters.and(Filters.eq("authorName", authorName), excludeDraft));
    }

    public Response deleteAll() {
        collection.drop();
        return Response.status(Response.Status.OK).entity("[\"Dropped collection\"]").build();
    }

    private static final JsonWriterSettings JSON_SETTINGS = JsonWriterSettings.builder()
            .dateTimeConverter((value, writer) -> writer.writeString(
                    new java.util.Date(value).toInstant().toString()))
            .objectIdConverter((value, writer) -> writer.writeString(value.toHexString()))
            .build();

    // input null for getAll
    private Response responseByQuery(Bson query) {
        StringWriter sb = new StringWriter();
        try {
            sb.append("[");
            FindIterable<Document> docs;

            if (query != null) {
                docs = collection.find(query);
            } else {
                docs = collection.find();
            }

            boolean first = true;
            for (Document d : docs) {
                if (!first)
                    sb.append(",");
                else
                    first = false;
                sb.append(d.toJson(JSON_SETTINGS));
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
                    .ifPresent(v -> newDoc.put("dueDate", Date.from(v.toInstant(ZoneOffset.UTC))));

            Optional.ofNullable(task.getCreationDate())
                    .ifPresent(v -> newDoc.put("creationDate", Date.from(v.toInstant(ZoneOffset.UTC))));

            Optional.ofNullable(task.getCollaborators())
                    .ifPresent(v -> newDoc.put("collaborators", v));

            Optional.ofNullable(task.getStatus())
                    .ifPresent(v -> newDoc.put("status", v));

            Optional.ofNullable(task.getReflection())
                    .ifPresent(v -> newDoc.put("reflection", v));

            taskDocs.add(newDoc);
        }

        return taskDocs;
    }

    // Need to make other functions to update specific fields like title, duedate,
    // etc.
    // Right now this replaces the entire entry.
    // (Xander): ^May not be needed, worklog aspects dont really have to be updated
    // once they're in the db.... question for requirments?
    public Response updateWorklog(String id, WorklogEntry updatedEntry, boolean isInstructor) {
        Document newDoc = new Document();

        newDoc.put("authorName", updatedEntry.getAuthorName());
        newDoc.put("dateCreated", Date.from(updatedEntry.getDateCreated().toInstant(ZoneOffset.UTC)));
        newDoc.put("dateSubmitted", Date.from(updatedEntry.getDateSubmitted().toInstant(ZoneOffset.UTC)));
        newDoc.put("collaborators", updatedEntry.getCollaborators());
        newDoc.put("taskList", formatTask(updatedEntry.getTaskList()));
        newDoc.put("worklogName", updatedEntry.getWorklogName());
        newDoc.put("teamNames", updatedEntry.getTeamNames());
        newDoc.put("deadline", updatedEntry.getDeadline());

        if (isInstructor) {
            newDoc.put("reviewed", updatedEntry.isReviewed());
        } else {
            newDoc.put("reviewed", false);
        }

        ObjectId oid; // ID of mongo collection entry
        try {
            oid = new ObjectId(id);
        } catch (Exception e) {
            return Response
                    .status(Response.Status.BAD_REQUEST)
                    .entity("[\"Invalid object id!\"]")
                    .build();
        }

        collection.replaceOne(eq("_id", oid), newDoc);
        return Response.ok(updatedEntry).build();

    }

    public Response deleteWorklog(String id) {

        ObjectId oid; // ID of mongo collection entry
        try {
            oid = new ObjectId(id);
        } catch (Exception e) {
            return Response
                    .status(Response.Status.BAD_REQUEST)
                    .entity("[\"Invalid object id!\"]")
                    .build();
        }

        collection.deleteOne(eq("_id", oid));
        return Response.noContent().build();
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