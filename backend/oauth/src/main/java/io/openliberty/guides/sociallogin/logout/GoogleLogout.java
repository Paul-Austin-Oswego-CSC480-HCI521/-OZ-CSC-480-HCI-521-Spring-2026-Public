package io.openliberty.guides.sociallogin.logout;


import com.ibm.websphere.security.social.UserProfileManager;

import jakarta.enterprise.context.RequestScoped;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.core.Response;

@RequestScoped
public class GoogleLogout implements ILogout {

        public Response logout() {
        String accessToken = UserProfileManager
                .getUserProfile()
                .getAccessToken();

        return ClientBuilder
                .newClient()
                .target("https://oauth2.googleapis.com/revoke")
                .queryParam("token", accessToken)
                .request()
                .post(null);
    }
    
    
}