package io.openliberty.guides.sociallogin.logout;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import com.ibm.websphere.security.social.UserProfileManager;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.client.Entity;
import jakarta.ws.rs.core.Response;

@RequestScoped
public class GitHubLogout implements ILogout {

    @Inject
    @ConfigProperty(name = "github.client.id")
    private String clientId;

    @Inject
    @ConfigProperty(name = "github.client.secret")
    private String clientSecret;

    public Response logout() {

        final String unauthorizeUrl = "https://api.github.com/"
                + "applications/{client_id}/grant";

        String accessToken = UserProfileManager
                .getUserProfile()
                .getAccessToken();

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("access_token", accessToken);

        String auth = clientId + ":" + clientSecret;
        byte[] encodedAuthStream = Base64
                .getEncoder()
                .encode(auth.getBytes(StandardCharsets.ISO_8859_1));
        String encodedAuth = new String(encodedAuthStream);

        return ClientBuilder
                .newClient()
                .target(unauthorizeUrl)
                .resolveTemplate("client_id", clientId)
                .request()
                .header("Authorization", "Basic " + encodedAuth)
                .method("DELETE", Entity.json(requestBody));
    }
}