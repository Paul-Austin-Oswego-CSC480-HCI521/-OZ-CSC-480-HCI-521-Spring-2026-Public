package auth.resource;

import java.util.HashMap;
import java.util.List;
import java.util.Map;





import org.bson.Document;

import com.ibm.websphere.security.jwt.Claims;
import com.ibm.websphere.security.jwt.JwtBuilder;

import auth.service.AuthService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.Consumes;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;




@Path("/auth")
@RequestScoped

public class AuthResource{

    @Inject 
    private AuthService authservice;

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
            Document user = authservice.verifyAndGetUser(tokenIdFrontend, rolerequested);
            String id = user.getObjectId("_id").toHexString();

            String email = user.getString("email");
            String name = user.getString("name") != null ? user.getString("name") : email;
            String role = user.getString("role");


            // build JWT
            String token = JwtBuilder.create("jwtAuthBuilder")
            .claim(Claims.SUBJECT, email)
            .claim("id", id)
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
            // System.out.println(response);
            return Response.ok(response).build();

        
        }catch(Exception e){
            // System.out.println("error");
            e.printStackTrace();
 
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
            List<Document> users = authservice.getAllUsers();
            return Response.ok(users).build();
        } catch(Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(e.getMessage())
            .build();
        }
    }

    @GET
    @Path("/instructors")
    @RolesAllowed("instructor")// we Might want to add admin role later to manage instructors (this line restructs what users can call this endpoint)
    @Produces(MediaType.APPLICATION_JSON)
    public Response getInstructors(){
        try {
            List<Document> users = authservice.getInstructors();
            return Response.ok(users).build();
        } catch(Exception e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(e.getMessage())
            .build();
        }
    }

    @PUT
    @Path("/instructor/create")
    @RolesAllowed("instructor")// we Might want to add admin role later to manage instructors (this line restructs what users can call this endpoint)
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createInstructor(Map<String, String> body){
        try {
            String email = body.get("email");
            Document user = authservice.changeUserRole(email, "instructor");
            return Response.ok(user).build();
            
        } catch(Exception e){
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(e.getMessage())
                .build();
        }
    }

    @PUT
    @Path("/instructor/remove")
    @RolesAllowed("instructor")// we Might want to add admin role later to manage instructors (this line restructs what users can call this endpoint)
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response removeInstructor(Map<String, String> body){
        try {
            String email = body.get("email");
            Document user = authservice.changeUserRole(email, "student");
            return Response.ok(user).build();
            
        } catch(Exception e){
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(e.getMessage())
                .build();
        }
    }

}