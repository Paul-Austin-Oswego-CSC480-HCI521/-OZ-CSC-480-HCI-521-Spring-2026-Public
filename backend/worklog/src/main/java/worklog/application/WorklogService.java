package worklog.application;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WorklogService {

    // Simple in-memory storage for demo purposes
    private static final List<WorklogEntry> worklogs = new ArrayList<>();

    @Inject
    private WorklogRepository repo = new WorklogRepository();

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