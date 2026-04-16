package worklog.application;

import java.time.LocalDateTime;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.eclipse.microprofile.openapi.annotations.Operation;

import jakarta.annotation.security.RolesAllowed;
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
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;


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
        return repo.getByAuthorName(authorName);
    }

    @GET
    @Path("/team/{teamName}")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get worklog by team name in the database.")
    public Response getWorklogByTeamName(@jakarta.ws.rs.PathParam("teamName") String teamName) {
        logger.log(Level.INFO, "GET: getWorklogByTeamName()");
        return repo.getByTeamName(teamName);
    }

    @GET
    @Path("/deadline/{deadline}")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get worklog by deadline in the database.")
    public Response getWorklogByDeadline(@jakarta.ws.rs.PathParam("deadline") LocalDateTime deadline) {
        logger.log(Level.INFO, "GET: getWorklogByDeadline()");
        return repo.getByDeadline(deadline);
    }

    @GET
    @Path("/dateSubmitted/{dateSubmitted}")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get worklog by date submitted in the database.")
    public Response getWorklogByDateSubmitted(@jakarta.ws.rs.PathParam("dateSubmitted") LocalDateTime dateSubmitted) {
        logger.log(Level.INFO, "GET: getWorklogByDateSubmitted()");
        return repo.getByDateSubmitted(dateSubmitted);
    }


    @POST
    @Path("/")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Uploads new worklog to db")
    public Response createWorklog(@Valid WorklogEntry entry) {
        logger.log(Level.INFO, "POST: createWorklog()");
        return repo.addWorklog(entry);
    }


    @Context
    SecurityContext securityContext;
    @PUT
    @Path("/id/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Update worklog draft by mongo ID in the database.")
    public Response updateWorklog(@jakarta.ws.rs.PathParam("id") String id, @Valid WorklogEntry updatedEntry) {
        boolean isInstructor = securityContext.isUserInRole("instructor");
        return repo.updateWorklog(id, updatedEntry, isInstructor);
    }


    //Draft saving
    @PUT
    @Path("/draft")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Save draft of worklog in the database.")
    public Response update(WorklogEntry worklog) {
        logger.log(Level.INFO, "PUT: update()");
        return repo.addWorklogDraft(worklog);
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