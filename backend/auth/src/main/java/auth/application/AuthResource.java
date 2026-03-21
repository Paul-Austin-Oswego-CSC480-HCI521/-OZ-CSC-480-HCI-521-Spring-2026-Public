package auth.application;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;

import com.ibm.websphere.security.jwt.Claims;
import com.ibm.websphere.security.jwt.JwtBuilder;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;


@Path("/auth")
@RequestScoped

public class AuthResource{

    @Inject AuthRepository repo;

    @GET
    @Path("/login")
    @RolesAllowed("users")
    @Produces(MediaType.APPLICATION_JSON)
    public Response login(@Context HttpServletRequest request){

        try{
            // GET USER INFO 
            var principal = request.getUserPrincipal();
            String email = principal.getName();

            // check is user exisits, if not create
            Document user = repo.findByEmail(email);
            String role;
            if(user==null){
                Document newUser = repo.createUser(email);
                role = "user";
            }
            else{
                // rn hardcoded role to be user in AuthRepo
                role = user.getString("role");
            }

            // build jwt
            String token = JwtBuilder.create("jwtAuthBuilder").
            claim(Claims.SUBJECT, email)
            .claim("email", email)
            .claim("groups", new String[]{"users"})
            .buildJwt()
            .compact();

            // return the token to frontend
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("email", email);


            return Response.ok(response).build();

        } catch(Exception e){
            // return error

            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage())
            .build();
        }
    }

    @GET
    @Path("/users")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllUsers(){
        try{
            List<Document> users = repo.getAllUsers();
            return Response.ok(users).build();
        } catch (Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(e.getMessage())
            .build();
        }
    }
}