package worklog.application.classes;

import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Provider
public class SecurityFilter implements ContainerRequestFilter {

    @Inject
    private UserContext userContext;

    @Inject
    private JsonWebToken token;

    @Override
    public void filter(ContainerRequestContext requestContext) {
          String path = requestContext.getUriInfo().getPath();   
                                                                                                                             
                                                                                                                                                                                     
        // Instructor endpoints take classID from the URL, not the JWT                                                                                                                     
        if (path.startsWith("/class/")) {                                                                                                                                                   
            return;                                                                                                                                                                        
        }     
        // Instructors don't have a classID claim; they manage multiple classes.
        // Authorization is still enforced per-endpoint via @RolesAllowed.
        if (token.getGroups() != null && (token.getGroups().contains("instructor") || token.getGroups().contains("co-instructor"))) {                                                                                                       
        // Instructors can scope a request to a class via ?classID=                                                                                                                    
            String paramClassID = requestContext.getUriInfo()                                                                                                                              
                .getQueryParameters()                                                                                                                                                      
                .getFirst("classID");                                                                                                                                                      
            if (paramClassID != null && !paramClassID.isBlank()) {                                                                                                                         
                userContext.setClassID(paramClassID);
            }                                                                                                                                                                              
            return;                                               
        }

        String classID = token.getClaim("classID");
        
        /*
         * THE BELOW IF STATEMENT SHOULD ONLY BE UNCOMMENTED IF TESTING ON LOCAL BRANCH
         * THIS IS A BIG SECURITY RISK IN DEPLOYMENT CODE, ONLY HERE FOR SIMPLIFYING TESTING
         */
        // if (classID == null) {
        //     classID = "DEVMODE";
        // }


        if (classID == null || classID.isBlank()) {
            requestContext.abortWith(
                Response.status(Response.Status.FORBIDDEN)
                    .entity("User is not assigned to a class")
                    .build()
            );
            return;
        }


        userContext.setClassID(classID);
    }

}
