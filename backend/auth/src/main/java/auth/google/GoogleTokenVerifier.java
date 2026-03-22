package auth.google;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.resource.spi.IllegalStateException;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Collections;

@ApplicationScoped
public class GoogleTokenVerifier {
    @Inject
    @ConfigProperty(name="google.client.id")
    private String googleClientId;
    private GoogleIdTokenVerifier verifier;

    @PostConstruct
    public void init() throws IllegalStateException{
        try{
            this.verifier = new GoogleIdTokenVerifier.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance()
            ).setAudience(Collections.singletonList(googleClientId)).build();
        } catch(Exception e){
            throw new IllegalStateException("failed to initialize Google token verifier");
        }
    }

    public GoogleIdToken verify(String token) throws Exception{
        return verifier.verify(token);
    }
}
