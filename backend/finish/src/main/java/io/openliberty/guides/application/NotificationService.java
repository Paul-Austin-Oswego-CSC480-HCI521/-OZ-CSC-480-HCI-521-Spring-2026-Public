package io.openliberty.guides.application;

import java.io.StringWriter;
import java.util.Set;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonArrayBuilder;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/notifications") //LANDON: Most of this is kinda adapted from the crewmember endpoint. Once the actual Task objects have been created, we can comfortably create that "automatic notification formulation" functionality that is supposed to build notifications automatically based on which task logs are incomplete.
@ApplicationScoped      //FOR NOW, this is just a plain endpoint that allows for manual notification generation, list, and deletion.
public class NotificationService {

    @Inject
    MongoDatabase db;

    @Inject
    Validator validator;

    private JsonArray getViolations(Notification notification) {
        Set<ConstraintViolation<Notification>> violations = validator.validate(notification);
        JsonArrayBuilder messages = Json.createArrayBuilder();
        for (ConstraintViolation<Notification> v : violations) {
            messages.add(v.getMessage());
        }
        return messages.build();
    }

    @POST
    @Path("/")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @APIResponses({
        @APIResponse(responseCode = "200", description = "Successfully created notification."),
        @APIResponse(responseCode = "400", description = "Invalid notification config.") })
    @Operation(summary = "Create a new notification.")
    public Response add(Notification notification) {
        JsonArray violations = getViolations(notification);

        if (!violations.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity(violations.toString()).build();
        }

        MongoCollection<Document> collection = db.getCollection("Notifications");

        Document newDoc = new Document();
        newDoc.put("id", notification.getID());
        newDoc.put("Message", notification.getMessage());
        newDoc.put("date", notification.getDate());

        collection.insertOne(newDoc);

        return Response.status(Response.Status.OK).entity(newDoc.toJson()).build();
    }

    @GET
    @Path("/")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "List all notifications.")
    public Response retrieve() {
        StringWriter sb = new StringWriter();
        try {
            MongoCollection<Document> collection = db.getCollection("Notifications");
            sb.append("[");
            boolean first = true;
            FindIterable<Document> docs = collection.find();
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


    @DELETE
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Successfully deleted Notification."),
        @APIResponse(
            responseCode = "400",
            description = "Invalid object id."),
        @APIResponse(
            responseCode = "404",
            description = "Notification object id was not found.") })
    @Operation(summary = "Delete a Notification from the database.")
    // tag::remove[]
    public Response remove(
        @Parameter(
            description = "Object id of the Notification to delete.",
            required = true
        )
        @PathParam("id") String id) {

        ObjectId oid;

        try {
            oid = new ObjectId(id);
        } catch (Exception e) {
            return Response
                .status(Response.Status.BAD_REQUEST)
                .entity("[\"Invalid object id!\"]")
                .build();
        }

        // tag::getCollectionDelete[]
        MongoCollection<Document> crew = db.getCollection("Notifications");
        // end::getCollectionDelete[]

        // tag::queryDelete[]
        Document query = new Document("_id", oid);
        // end::queryDelete[]

        // tag::deleteOne[]
        DeleteResult deleteResult = crew.deleteOne(query);
        // end::deleteOne[]

        // tag::getDeletedCount[]
        if (deleteResult.getDeletedCount() == 0) {
        // end::getDeletedCount[]
            return Response
                .status(Response.Status.NOT_FOUND)
                .entity("[\"_id was not found!\"]")
                .build();
        }

        return Response
            .status(Response.Status.OK)
            .entity(query.toJson())
            .build();
    }
    // end::remove[]



    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Successfully updated crew member."),
        @APIResponse(
            responseCode = "400",
            description = "Invalid object id or crew member configuration."),
        @APIResponse(
            responseCode = "404",
            description = "Crew member object id was not found.") })
    @Operation(summary = "Update a crew member in the database.")
    // tag::update[]
    public Response update(Notification notification,
        @Parameter(
            description = "Object id of the crew member to update.",
            required = true
        )
        @PathParam("id") String id) {

        JsonArray violations = getViolations(notification);

        if (!violations.isEmpty()) {
            return Response
                    .status(Response.Status.BAD_REQUEST)
                    .entity(violations.toString())
                    .build();
        }

        ObjectId oid;

        try {
            oid = new ObjectId(id);
        } catch (Exception e) {
            return Response
                .status(Response.Status.BAD_REQUEST)
                .entity("[\"Inva    lid object id!\"]")
                .build();
        }

        // tag::getCollectionUpdate[]
        MongoCollection<Document> crew = db.getCollection("Notifications");
        // end::getCollectionUpdate[]

        // tag::queryUpdate[]
        Document query = new Document("_id", oid);
        // end::queryUpdate[]

        // tag::crewMemberUpdate[]
        Document newDoc = new Document();
        newDoc.put("id", notification.getID());
        newDoc.put("message", notification.getMessage());
        newDoc.put("date", notification.getDate());
        // end::crewMemberUpdate[]

        // tag::replaceOne[]
        UpdateResult updateResult = crew.replaceOne(query, newDoc);
        // end::replaceOne[]

        // tag::getMatchedCount[]
        if (updateResult.getMatchedCount() == 0) {
        // end::getMatchedCount[]
            return Response
                .status(Response.Status.NOT_FOUND)
                .entity("[\"_id was not found!\"]")
                .build();
        }

        newDoc.put("_id", oid);

        return Response
            .status(Response.Status.OK)
            .entity(newDoc.toJson())
            .build();
    }
    // end::update[]


}