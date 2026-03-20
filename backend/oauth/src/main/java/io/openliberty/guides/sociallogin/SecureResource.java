package io.openliberty.guides.sociallogin;

import java.util.Arrays;

import com.ibm.websphere.security.jwt.JwtBuilder;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.SecurityContext; // 1. Import HttpServletRequest

@ApplicationScoped
@Path("/protected")
public class SecureResource {

    @GET
    @RolesAllowed("users")
    public String getSecureData(
            @Context SecurityContext securityContext,
            @Context HttpServletRequest request // 2. Inject the request context
    ) throws Exception {
        
        // 1. Get the authenticated user's name
        String username = securityContext.getUserPrincipal().getName();

        // 2. Build the JWT
        String jwtToken = JwtBuilder.create("myBuilder")
                .claim("upn", username) 
                .claim("groups", Arrays.asList("user"))
                .claim("iss", "OAuthService")
                .buildJwt()
                .compact();

        
        System.out.println("MY AWESOME TOKEN: " + jwtToken);
        // 3. Store the JWT securely in the user's server-side session
        request.getSession().setAttribute("jwt", jwtToken);

        // 4. Return a response without exposing the token to the browser
        return "You have successfully logged in! Your token is safely stored in your session.";
    }
}