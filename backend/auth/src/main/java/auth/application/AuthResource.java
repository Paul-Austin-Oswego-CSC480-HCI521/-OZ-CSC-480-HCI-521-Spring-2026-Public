package auth.application;

import java.util.HashMap;
import java.util.List;
import java.util.Map;



import java.util.Collections;
import org.eclipse.microprofile.config.inject.ConfigProperty;


import org.bson.Document;

import com.ibm.websphere.security.jwt.Claims;
import com.ibm.websphere.security.jwt.JwtBuilder;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.gson.Gson;


@Path("/auth")
@RequestScoped

public class AuthResource{

    @Inject 
    private AuthRepository repo;

    @Inject
    @ConfigProperty(name="google.client.id")
    private String googleClientId;

    @POST
    @Path("/login")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    // login should be public so anyone can call it
    public Response login(Map<String, String> body){
        try{
            String tokenIdFrontend = body.get("token_id");
            String rolerequested = body.get("role");

            if(tokenIdFrontend==null || tokenIdFrontend.isEmpty()){
                return Response.status(Response.Status.BAD_REQUEST)
                .entity("Token id is required")
                .build();
            }
            // verify google tokem
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance()
            ).setAudience(Collections.singletonList(googleClientId)).build();

            GoogleIdToken googletoken = verifier.verify(tokenIdFrontend);
            if(googletoken==null){
                return Response.status(Response.Status.UNAUTHORIZED)
                .entity("invalid google token")
                .build();
            }
            // get user info
            GoogleIdToken.Payload payload = googletoken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            // does user exists in db if not create a user
            Document user = repo.findByEmail(email);
            String role;

            if(user==null){
                // Create new user
                Document newuser = repo.createUser(email, name, rolerequested);
                role = newuser.getString("role");
            }
            else{
            role = user.getString("role");
            name = user.getString("name");
            }

            // build JWT
            String token = JwtBuilder.create("jwtAuthBuilder")
            .claim(Claims.SUBJECT, email)
            .claim("email", email)
            .claim("name", name)
            .claim("role", role)
            .claim("groups", new String[]{role})
            .buildJwt()
            .compact();

            // return JWT TO FRONTEND
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("email", email);
            response.put("name", name);
            response.put("role", role);
            return Response.ok(response).build();

        
        }catch(Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(e.getMessage())
            .build();
        }   
    }

    @GET
    @Path("/users")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllUsers(){
        try {
            List<Document> users = repo.getAllUsers();
            return Response.ok(users).build();
        } catch(Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(e.getMessage())
            .build();
        }
    }
}