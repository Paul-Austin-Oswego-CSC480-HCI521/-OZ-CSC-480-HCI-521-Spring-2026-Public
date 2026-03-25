package task.application;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonArrayBuilder;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.bson.Document;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import task.application.classes.Task;

import java.io.StringWriter;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * TaskService implementation for use with REST API functions. Adapted from the code seen in CrewService.java, to be changed as needed
 */
@Path("/")
@ApplicationScoped
public class TaskService {

    @Inject
    MongoDatabase db;

    @Inject
    Validator validator;

    @Inject
    Logger logger;

    @GET
    @Path("/")
    @Produces(MediaType.APPLICATION_JSON)
    @APIResponses({
            @APIResponse(
                    responseCode = "200",
                    description = "Successfully listed tasks."
            ),
            @APIResponse(
                    responseCode = "400",
                    description = "BAD REQUEST: client provided malformed HTTP GET request"
            ),
            @APIResponse(
                    responseCode = "500",
                    description = "INTERNAL SERVER ERROR: issue with server prevented HTTP GET request")
    })
    @Operation(summary = "List the tasks within database.")
    public Response retrieve() {
        Response response;
        StringWriter sb = new StringWriter();

        try {
            MongoCollection<Document> taskCollection = db.getCollection("Tasks");
            sb.append("[");
            boolean first = true;
            FindIterable<Document> docs = taskCollection.find();
            for (Document d : docs) {
                if (!first) {
                    sb.append(",");
                } else {
                    first = false;
                }
                sb.append(d.toJson());
            }
            sb.append("]");

            response = Response
                    .status(Response.Status.OK)
                    .entity(sb.toString())
                    .build();
        } catch (Exception e) {
            e.printStackTrace(System.out);
            response = Response
                    .status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("[\"Unable to list crew members!\"]")
                    .build();
        }

        logger.log(Level.INFO, "TaskService HTTP GET request returned with code: " + response.getStatus());

        return response;
    }

    @POST
    @Path("/")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @APIResponses({
            @APIResponse(
                    responseCode = "200",
                    description = "Successfully added task."
            ),
            @APIResponse(
                    responseCode = "400",
                    description = "BAD REQUEST: client provided malformed HTTP POST request"
            ),
            @APIResponse(
                    responseCode = "500",
                    description = "INTERNAL SERVER ERROR: issue with server prevented HTTP POST request")
    })
    @Operation(summary = "Add or modify a new task.")
    public Response add(Task task) {
        Response response;
        JsonArray violations = getViolations(task);

        if (!violations.isEmpty()) {
            response = Response
                    .status(Response.Status.BAD_REQUEST)
                    .entity(violations.toString())
                    .build();
            logger.log(Level.INFO, "HTTP POST request returned code: " + response.getStatus());
            return response;
        }
        MongoCollection<Document> taskCollection = db.getCollection("Tasks");

        Document newTask = new Document();
        newTask.put("taskName", task.getTaskName());
        newTask.put("goal", task.getGoal());
        newTask.put("assignedName", task.getAssignedName());
        newTask.put("deadline", task.getDeadline());
        newTask.put("status", task.getStatus());

        taskCollection.insertOne(newTask);

        response = Response
                .status(Response.Status.OK)
                .entity(newTask.toJson())
                .build();
        logger.log(Level.INFO, "HTTP POST request returned code: " + response.getStatus());
        return response;
    }

    private JsonArray getViolations(Task task) {
        Set<ConstraintViolation<Task>> violations = validator.validate(task);
        JsonArrayBuilder messages = Json.createArrayBuilder();
        for (ConstraintViolation<Task> v : violations) {
            messages.add(v.getMessage());
        }
        return messages.build();
    }

}
