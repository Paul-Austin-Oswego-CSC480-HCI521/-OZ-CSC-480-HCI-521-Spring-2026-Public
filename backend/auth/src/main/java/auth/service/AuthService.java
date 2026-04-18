package auth.service;

import java.time.Instant;
import java.util.List;

import org.bson.Document;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.mongodb.client.MongoCollection;

import auth.google.GoogleTokenVerifier;
import auth.user.AuthRepository;
import auth.user.RefreshRepository;
import auth.user.StudentClass;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

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
            if(email.equals("shusank8basyal@gmail.com") ||  email.equals("paul.austin@oswego.edu") || email.equals("vanessa.maike@oswego.edu")){
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

        public Document createInstuctor(String email, String name) {
            if (repo.findByEmail(email) != null) {
                return repo.updateUserRole(email, "instructor");
            }
            return repo.createUser(email, name, "instructor");
        }

        public Document getUserByEmail(String email) {
            Document user = repo.findByEmail(email);
            if (user == null) throw new SecurityException("User not found");
            return user;
        }

        public List<Document> getAllUsers(){
            return repo.getAllUsers();
        }

        public Document addUserToClass(String email, String classID) {
            return repo.addUserToClass(email, classID);
        }

        public Document removeUserFromClass(String email) {
            return repo.removeUserFromClass(email);
        }

        public List<Document> getInstructors(){
            return repo.getUsersByRole("instructor");
        }

        public Document changeUserRole(String email, String newRole){
            Document user = repo.findByEmail(email);
            if(user==null){
                throw new IllegalArgumentException("User not found");
            }
            if(newRole==null || (!newRole.equals("student") && !newRole.equals("instructor"))){
                throw new IllegalArgumentException("Valid role is required");
            }
            repo.updateUserRole(email, newRole);
            return user;
        }

        public Document changeUserTeams(String email, List<String> newTeams) {
            Document user = repo.findByEmail(email);
            if(user==null){
                throw new IllegalArgumentException("User not found");
            }
            if(newTeams==null || newTeams.isEmpty()){
                repo.removeUserTeams(email);
                return user;
            }
            repo.updateUserTeams(email, newTeams);
            return user;
        }

        public Document removeUser(String email) {
            return repo.removeUser(email);
        }

        public List<Document> getUsersFromClass(String classID) {
            return repo.getUsersFromClass(classID);
        }

        public Document createClass(StudentClass studentClass) {
            return repo.createClass(studentClass);
        }

        public List<Document> getClasses() {
            return repo.getClasses();
        }

        public Document removeClass(String classID) {
            return repo.removeClass(classID);
        }

        public Document getStudentClass(String classID) {
            return repo.getStudentClass(classID);
        }

}
