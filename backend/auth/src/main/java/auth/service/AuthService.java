package auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

import auth.google.GoogleTokenVerifier;
import auth.user.AuthRepository;
import auth.user.RefreshRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.bson.Document;

import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class AuthService {
        @Inject
        private AuthRepository repo;

        @Inject
        private RefreshRepository refreshRepo;

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
            if(email.equals("paul.austin@oswego.edu") || email.equals("vanessa.maike@oswego.edu")){
                role="instructor";
            }

            return repo.createUser(email, name, role);

            
        }

        public Document createRefreshToken(String userId, String email) {
            return refreshRepo.create(userId, email);
        }

        public Document validateRefreshToken(String token) {
            Document doc = refreshRepo.findByToken(token);
            if (doc == null) {
                throw new SecurityException("Invalid refresh token");
            }
            java.util.Date expiresAt = doc.getDate("expiresAt");
            if (expiresAt.before(java.util.Date.from(Instant.now()))) {
                refreshRepo.deleteByToken(token);
                throw new SecurityException("Refresh token expired");
            }
            return doc;
        }

        public void revokeRefreshToken(String token) {
            refreshRepo.deleteByToken(token);
        }

        public Document getUserByEmail(String email) {
            Document user = repo.findByEmail(email);
            if (user == null) throw new SecurityException("User not found");
            return user;
        }

        public List<Document> getAllUsers(){
            return repo.getAllUsers();
        }
}
