package worklog.application;

import java.io.StringWriter;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import jakarta.ws.rs.GET;
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
import com.mongodb.client.MongoClient;
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
import worklog.application.classes.UserContext;

@ApplicationScoped // Add this so CDI can manage this class
public class WorklogRepository {

    @Inject
    private MongoClient mongoCl;

    @Inject
    Validator validator;

    @Inject
    UserContext userContext;
    
    Bson excludeDraft = Filters.or(
        Filters.exists("isDraft", false),
        Filters.eq("isDraft", false)
    );

    private static final CodecRegistry POJO_CODEC_REGISTRY = fromRegistries(
            MongoClientSettings.getDefaultCodecRegistry(),
            fromProviders(PojoCodecProvider.builder().automatic(true).build())
        );

    private MongoCollection<Document> getClassCollection() {
        return mongoCl
                .getDatabase(userContext.getClassID())
                .withCodecRegistry(POJO_CODEC_REGISTRY)
                .getCollection("worklogs");
    }


    public Response addWorklog(WorklogEntry entry) {
        MongoCollection<Document> collection = getClassCollection();
        JsonArray violations = getViolations(entry);

        if (!violations.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity(violations.toString()).build();
        }

        collection.deleteMany(Filters.and(
                Filters.eq("authorEmail", entry.getAuthorEmail()),
                Filters.eq("worklogName", entry.getWorklogName()),
                Filters.eq("isDraft", true)));

        Document newDoc = new Document();

        newDoc.put("authorName", entry.getAuthorName());
        newDoc.put("authorEmail", entry.getAuthorEmail());
        newDoc.put("dateCreated", Date.from(entry.getDateCreated().toInstant(ZoneOffset.UTC)));
        newDoc.put("dateSubmitted", Date.from(entry.getDateSubmitted().toInstant(ZoneOffset.UTC)));
        newDoc.put("collaborators", entry.getCollaborators());
        newDoc.put("worklogName", entry.getWorklogName());
        newDoc.put("taskList", formatTask(entry.getTaskList()));
        newDoc.put("teamNames", entry.getTeamNames());
        newDoc.put("reviewed", false);
        newDoc.put("isDraft", false);

        if (entry.getDeadline() != null) newDoc.put("deadline", entry.getDeadline());

        collection.insertOne(newDoc);

        return Response.status(Response.Status.OK).entity(newDoc.toJson()).build();
    }

    public Response addWorklogDraft(WorklogEntry entry) {
        MongoCollection<Document> collection = getClassCollection();

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
        newDoc.put("authorEmail", entry.getAuthorEmail());
        newDoc.put("worklogName", entry.getWorklogName());
        newDoc.put("teamNames", entry.getTeamNames());
        newDoc.put("isDraft", true);
        newDoc.put("reviewed", false);

        collection.findOneAndReplace(Filters.and(
                Filters.eq("authorName", entry.getAuthorName()),
                Filters.eq("authorEmail", entry.getAuthorEmail()),
                Filters.eq("worklogName", entry.getWorklogName()),
                Filters.eq("isDraft", true)

        ), newDoc, new FindOneAndReplaceOptions().upsert(true));

        return Response.status(Response.Status.OK).entity(newDoc.toJson()).build();
    }

    public Response getAll() {
        return responseByQuery(excludeDraft);
    }

    // for instructor
    public Response getAllForClass(String classID) {                                                                                                                                   
      MongoCollection<Document> collection = mongoCl        
              .getDatabase(classID)                                                                                                                                                  
              .withCodecRegistry(POJO_CODEC_REGISTRY)                                                                                                                                
              .getCollection("worklogs");                                                                                                                                            
                                                                                                                                                                                     
      StringWriter sb = new StringWriter();                                                                                                                                          
      try {                                                 
          sb.append("[");                                                                                                                                                            
          FindIterable<Document> docs = collection.find(excludeDraft);
          boolean first = true;                                                                                                                                                      
          for (Document d : docs) {
              if (!first) sb.append(",");                                                                                                                                            
              else first = false;                           
              sb.append(d.toJson(JSON_SETTINGS));                                                                                                                                    
          }                                                                                                                                                                          
          sb.append("]");
      } catch (Exception e) {                                                                                                                                                        
          e.printStackTrace();                              
          return Response.status(Response.Status.INTERNAL_SERVER_ERROR)                                                                                                              
              .entity("{\"error\": \"" + e.getMessage() + "\"}")
              .build();                                                                                                                                                              
      }                                                     
      return Response.status(Response.Status.OK).entity(sb.toString()).build();                                                                                                      
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
        getClassCollection().drop();
        return Response.status(Response.Status.OK).entity("[\"Dropped collection\"]").build();
    }

    private static final JsonWriterSettings JSON_SETTINGS = JsonWriterSettings.builder()
            .dateTimeConverter((value, writer) -> writer.writeString(
                    new java.util.Date(value).toInstant().toString()))
            .objectIdConverter((value, writer) -> writer.writeString(value.toHexString()))
            .build();

    // input null for getAll
    private Response responseByQuery(Bson query) {
        MongoCollection<Document> collection = getClassCollection();
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
            e.printStackTrace();
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity("{\"error\": \"" + e.getMessage() + "\"}") 
                .build();
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
            Optional.ofNullable(task.getCollabDescription())
                    .ifPresent(v -> newDoc.put("collabDescription", v));

            taskDocs.add(newDoc);
        }

        return taskDocs;
    }

    public Response updateWorklog(String id, WorklogEntry updatedEntry, boolean isInstructor) {
        MongoCollection<Document> collection = getClassCollection();
        Document newDoc = new Document();

        newDoc.put("authorName", updatedEntry.getAuthorName());
        newDoc.put("authorEmail", updatedEntry.getAuthorEmail());
        newDoc.put("dateCreated", Date.from(updatedEntry.getDateCreated().toInstant(ZoneOffset.UTC)));
        newDoc.put("dateSubmitted", Date.from(updatedEntry.getDateSubmitted().toInstant(ZoneOffset.UTC)));
        newDoc.put("collaborators", updatedEntry.getCollaborators());
        newDoc.put("taskList", formatTask(updatedEntry.getTaskList()));
        newDoc.put("worklogName", updatedEntry.getWorklogName());
        newDoc.put("teamNames", updatedEntry.getTeamNames());
        if (updatedEntry.getDeadline() != null) newDoc.put("deadline", updatedEntry.getDeadline());

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
        MongoCollection<Document> collection = getClassCollection();

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

    public Response listCollections() {
        ArrayList<String> db_collections = new ArrayList<>();
         for (String name : mongoCl.getDatabase("appdb").listCollectionNames()) {
            db_collections.add(name);
        }

        return Response.ok(db_collections).build();
    }

    public Response listDBs() {
        ArrayList<String> db_names = new ArrayList<>();
         for (String name : mongoCl.listDatabaseNames()) {
            db_names.add(name);
        }

        return Response.ok(db_names).build();
    }

    
}
