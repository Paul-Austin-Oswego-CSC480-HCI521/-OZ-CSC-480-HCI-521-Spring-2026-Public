package io.openliberty.guides.sociallogin;

import org.eclipse.microprofile.rest.client.inject.RestClient;

import io.openliberty.guides.sociallogin.client.SystemClient;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;

@RequestScoped
@Path("/frontend/data")
public class BackendDataResource {

    // 1. Inject the Rest Client
    @Inject
    @RestClient
    private SystemClient systemClient;

    @GET
    public String fetchDownstreamData(@Context HttpServletRequest request) {
        
        // 2. Access the user's session (passing 'false' prevents creating a new session if one doesn't exist)
        var session = request.getSession(false);
        if (session == null || session.getAttribute("jwt") == null) {
            return "Error: User is not authenticated or token is missing. Please log in first.";
        }

        // 3. Retrieve the raw JWT from the session
        String jwtToken = (String) session.getAttribute("jwt");

        // 4. Prepend "Bearer " so it meets the standard Authorization header format
        String authHeader = "Bearer " + jwtToken;

        // 5. Make the call to the downstream microservice
        Response response = systemClient.getOsInfo(authHeader);

        // 6. Return the result to the user
        if (response.getStatus() == 200) {
            return "Success! Downstream service reports the OS is: " + response.readEntity(String.class);
        } else {
            return "Request failed. Downstream service returned HTTP status: " + response.getStatus();
        }
    }
}