package io.openliberty.guides.sociallogin;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

@ApplicationScoped
@Path("/protected")
public class SecureResource {

    @GET
    @RolesAllowed("users") // Or specific Google roles/emails if mapped
    public String getSecureData() {
        return "You have successfully logged in with Google!";
    }
}