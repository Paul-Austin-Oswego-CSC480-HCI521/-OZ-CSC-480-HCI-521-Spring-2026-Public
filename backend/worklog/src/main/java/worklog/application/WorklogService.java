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
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllWorklogs() {
        return repo.getAll();
    }

    @GET
    @Path("/draft")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCurrentDraft() {
        return repo.getDraft();
    }

    @GET
    @Path("/author/{authorName}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getWorklogByAuthorName(@jakarta.ws.rs.PathParam("authorName") String authorName) {
       return  repo.findByAuthor(authorName);
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createWorklog(@Valid WorklogEntry entry) {

        // Automatically set dateCreated if not provided
        if (entry.getDateCreated() == null) {
            entry.setDateCreated(LocalDate.now());
        }

        return repo.addWorklog(entry);

    }


    @PUT
    @Path("/id/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Update worklog draft in the database.")
    public Response updateWorklog(@jakarta.ws.rs.PathParam("id") String id, @Valid WorklogEntry updatedEntry) {
        return repo.updateWorklog(id, updatedEntry);
    }


    //Draft saving
    //TODO NEED TO MAKE BASED ON ID NOT AUTHOR_NAME
    @PUT
    @Path("/draft/{userId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Save draft in the database.")
    public Response update(WorklogEntry worklog,
        @Parameter(description = "studentID of owner.",required = true) 
        @PathParam("userId") String userId) {

        return repo.addWorklogDraft(worklog, userId);
    }


    @DELETE
    @Path("/delAll")
    public Response deleteAll() {

        return repo.deleteAll();
    }


    @DELETE
    @Path("/id/{id}")
    public Response deleteWorklog(@jakarta.ws.rs.PathParam("id") String id) {
        return repo.deleteWorklog(id);
    }

}