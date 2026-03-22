package auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

import auth.google.GoogleTokenVerifier;
import auth.user.AuthRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.bson.Document;

import java.util.List;

@ApplicationScoped
public class AuthService {
        @Inject
        private AuthRepository repo;

        @Inject
        private GoogleTokenVerifier googleTokenVerifier;
        public Document verifyAndGetUser(String token, String requestedRole) throws Exception {
            GoogleIdToken googleToken = googleTokenVerifier.verify(token);
            if(googleToken==null){
                throw new SecurityException("Invalid Google token");
            }
            GoogleIdToken.Payload payload = googleToken.getPayload();
            String name = (String) payload.get("name");
            String email = payload.getEmail();

            Document user = repo.findByEmail(email);
            if(user!=null){
                return user;
            }
            if(requestedRole==null || requestedRole.trim().isEmpty()){
                throw new IllegalArgumentException("ROLE IS REQUIRED");
            }
            String role = requestedRole.trim().toLowerCase();
            if(!role.equals("student") && !role.equals("instructor")){
                throw new IllegalArgumentException("Valid role is required");
            }
            return repo.createUser(email, name, role);

            
        }

        public List<Document> getAllUsers(){
            return repo.getAllUsers();
        }
}
