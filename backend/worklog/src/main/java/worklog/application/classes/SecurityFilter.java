package worklog.application.classes;

import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
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
        String classID = token.getClaim("classID");

        userContext.setClassID(classID);
    }

}
