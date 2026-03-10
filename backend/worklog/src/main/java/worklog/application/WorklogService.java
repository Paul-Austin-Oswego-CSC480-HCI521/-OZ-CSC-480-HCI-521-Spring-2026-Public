package worklog.application;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;

import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonArrayBuilder;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;


@Path("/")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WorklogService {
    @Inject
    Validator validator;

    @Inject
    private WorklogRepository repo = new WorklogRepository();
    
    private JsonArray getViolations(WorklogEntry crewMember) {
        Set<ConstraintViolation<WorklogEntry>> violations = validator.validate(
                crewMember);

        JsonArrayBuilder messages = Json.createArrayBuilder();

        for (ConstraintViolation<WorklogEntry> v : violations) {
            messages.add(v.getMessage());
        }

        return messages.build();
    }



    @GET
    @Path("/getall")
    public Response getAllWorklogs() {
        return Response.ok(repo.getAll()).build();
    }

    @GET
    @Path("/author/{authorName}")
    public Response getWorklogByAuthorName(@jakarta.ws.rs.PathParam("authorName") String authorName) {
        List<WorklogEntry> results = repo.findByAuthor(authorName);
        if (!results.isEmpty()) {
            return Response.ok(results).build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    @POST
    public Response createWorklog(@Valid WorklogEntry entry) {

        // Automatically set dateCreated if not provided
        if (entry.getDateCreated() == null) {
            entry.setDateCreated(LocalDate.now());
        }

        repo.addWorklog(entry);

        return Response
                .status(Response.Status.CREATED)
                .entity(entry)
                .build();
    }


    @PUT
    @Path("/{userId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Successfully saved draft."),
        @APIResponse(
            responseCode = "400",
            description = "Invalid object id or draft configuration."),
        @APIResponse(
            responseCode = "404",
            description = "User id was not found.") })
    @Operation(summary = "Save draft in the database.")
    public Response update(WorklogEntry worklog,
        @Parameter(
            description = "Object id of the crew member to update.",
            required = true
        )
        @PathParam("id") String id) {

        JsonArray violations = getViolations(worklog);

        if (!violations.isEmpty()) {
            return Response
                    .status(Response.Status.BAD_REQUEST)
                    .entity(violations.toString())
                    .build();
        }

        ObjectId oid;
        Document newWorklog = new Document();

        try {
            oid = new ObjectId(id);
        } catch (Exception e) {
            return Response
                .status(Response.Status.BAD_REQUEST)
                .entity("[\"Inva    lid object id!\"]")
                .build();
        }


        return Response
            .status(Response.Status.OK)
            .entity(newWorklog.toJson())
            .build();
    }
}