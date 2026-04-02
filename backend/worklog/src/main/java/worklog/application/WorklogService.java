package worklog.application;

import java.time.LocalDate;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;

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
import jakarta.annotation.security.RolesAllowed;


@Path("/")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
@RolesAllowed({"student", "instructor"})
public class WorklogService {
    @Inject
    Validator validator;

    @Inject
    private WorklogRepository repo;

    @Inject
    private Logger logger;

    @GET
    @Path("/")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Gets all worklogs in the db")
    public Response getAllWorklogs() {
        logger.log(Level.INFO, "GET: getAllWorklogs()");
        return repo.getAll();
    }

    @GET
    @Path("/draft")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Gets all drafts in the db")
    public Response getCurrentDraft() {
        logger.log(Level.INFO, "GET: getCurrentDraft()");
        return repo.getDraft();
    }

    @GET
    @Path("/author/{authorName}")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get worklog by author name in the database.")
    public Response getWorklogByAuthorName(@jakarta.ws.rs.PathParam("authorName") String authorName) {
        logger.log(Level.INFO, "GET: getWorklogByAuthorName()");
        return repo.findByAuthor(authorName);
    }

    @POST
    @Path("/")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Uploads new worklog to db")
    public Response createWorklog(@Valid WorklogEntry entry) {

        // Automatically set dateCreated if not provided
        if (entry.getDateCreated() == null) {
            entry.setDateCreated(LocalDate.now());
        }

        logger.log(Level.INFO, "POST: createWorklog()");
        return repo.addWorklog(entry);

    }


    @PUT
    @Path("/id/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Update worklog draft by mongo ID in the database.")
    public Response updateWorklog(@jakarta.ws.rs.PathParam("id") String id, @Valid WorklogEntry updatedEntry) {
        logger.log(Level.INFO, "PUT: updateWorklog()");
        return repo.updateWorklog(id, updatedEntry);
    }


    //Draft saving
    //TODO NEED TO MAKE BASED ON ID NOT AUTHOR_NAME
    @PUT
    @Path("/draft/{userId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Save draft of userID in the database.")
    public Response update(WorklogEntry worklog,
        @Parameter(description = "studentID of owner.",required = true) 
        @PathParam("userId") String userId) {
        logger.log(Level.INFO, "PUT: update()");
        return repo.addWorklogDraft(worklog, userId);
    }


    @DELETE
    @Path("/delAll")
    @Operation(summary = "WARNING DELETES *EVERY* WORKLOG")
    public Response deleteAll() {
        logger.log(Level.INFO, "DELETE: deleteAll()");
        return repo.deleteAll();
    }

    @DELETE
    @Path("/id/{id}")
    @Operation(summary = "Deletes by mongo ID")
    public Response deleteWorklog(@jakarta.ws.rs.PathParam("id") String id) {
        logger.log(Level.INFO, "DELETE: deleteWorklog()");
        return repo.deleteWorklog(id);
    }

}