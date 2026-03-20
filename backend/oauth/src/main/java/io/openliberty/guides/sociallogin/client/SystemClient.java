package io.openliberty.guides.sociallogin.client;

import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;

// The configKey links this interface to your microprofile-config.properties file
@RegisterRestClient(configKey = "systemClient")
@Path("/system/properties")
public interface SystemClient {

    @GET
    @Path("/os")
    Response getOsInfo(@HeaderParam("Authorization") String authHeader);
}