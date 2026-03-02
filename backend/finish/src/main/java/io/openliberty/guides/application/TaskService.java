package io.openliberty.guides.application;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
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

import java.io.StringWriter;
import java.util.Set;

/**
 * TaskService implementation for use with REST API functions. Adapted from the code seen in CrewService.java, to be changed as needed
 */
public class TaskService {

    @Inject
    MongoDatabase db;

    @Inject
    Validator validator;

    private JsonArray getViolations(Task task) {
        Set<ConstraintViolation<Task>> violations = validator.validate(task);
        JsonArrayBuilder messages = Json.createArrayBuilder();
        for (ConstraintViolation<Task> v : violations) {
            messages.add(v.getMessage());
        }
        return messages.build();
    }

    @POST
    @Path("/")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @APIResponses({
            @APIResponse(
                    responseCode = "200",
                    description = "Successfully added task."),
            @APIResponse(
                    responseCode = "400",
                    description = "Invalid task configuration.") })
    @Operation(summary = "Add or modify a new task.")
    public Response add(Task task) {
        JsonArray violations = getViolations(task);

        if (!violations.isEmpty()) {
            return Response
                    .status(Response.Status.BAD_REQUEST)
                    .entity(violations.toString())
                    .build();
        }
        MongoCollection<Document> taskCollection = db.getCollection("Tasks");

        Document newTask = new Document();
        newTask.put("taskName", task.getTaskName());
        newTask.put("goal", task.getGoal());
        newTask.put("assignedName", task.getAssignedName());
        newTask.put("deadline", task.getDeadline());
        newTask.put("status", task.getStatus());

        taskCollection.insertOne(newTask);

        return Response
                .status(Response.Status.OK)
                .entity(newTask.toJson())
                .build();
    }


    @GET
    @Path("/")
    @Produces(MediaType.APPLICATION_JSON)
    @APIResponses({
            @APIResponse(
                    responseCode = "200",
                    description = "Successfully listed tasks."),
            @APIResponse(
                    responseCode = "500",
                    description = "Failed to list tasks.") })
    @Operation(summary = "List the tasks within database.")
    public Response retrieve() {
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
        } catch (Exception e) {
            e.printStackTrace(System.out);
            return Response
                    .status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("[\"Unable to list crew members!\"]")
                    .build();
        }

        return Response
                .status(Response.Status.OK)
                .entity(sb.toString())
                .build();
    }


}
