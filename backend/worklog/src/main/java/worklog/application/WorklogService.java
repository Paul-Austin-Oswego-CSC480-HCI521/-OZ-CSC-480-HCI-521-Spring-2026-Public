package worklog.application;

import java.time.LocalDate;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
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


@Path("/")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class WorklogService {
    @Inject
    Validator validator;

    @Inject
    private WorklogRepository repo;
    


    @GET
    @Path("/getall")
    public Response getAllWorklogs() {
        return repo.getAll();
    }

    @GET
    @Path("/author/{authorName}")
    public Response getWorklogByAuthorName(@jakarta.ws.rs.PathParam("authorName") String authorName) {
       return  repo.findByAuthor(authorName);
    }

    @POST
    public Response createWorklog(@Valid WorklogEntry entry) {

        // Automatically set dateCreated if not provided
        if (entry.getDateCreated() == null) {
            entry.setDateCreated(LocalDate.now());
        }

        return repo.addWorklog(entry);

    }




    //Draft saving
    //TODO NEED TO MAKE BASED ON ID NOT AUTHOR_NAME
    @PUT
    @Path("/draft/{userId}")
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
            description = "studentID of owner.",
            required = true
        )
        @PathParam("userId") String userId) {

        return repo.addWorklogDraft(worklog, userId);

    }
    @DELETE
    @Path("/delAll")
    public Response deleteAll() {

        return repo.deleteAll();
    }

    @PUT
    @Path("/id/{id}")
    public Response updateWorklog(@jakarta.ws.rs.PathParam("id") String id, @Valid WorklogEntry updatedEntry) {
        boolean updated = repo.updateWorklog(id, updatedEntry);
        if (updated) {
            return Response.ok(updatedEntry).build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    @DELETE
    @Path("/id/{id}")
    public Response deleteWorklog(@jakarta.ws.rs.PathParam("id") String id) {
        boolean deleted = repo.deleteWorklog(id);
        if (deleted) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }

}