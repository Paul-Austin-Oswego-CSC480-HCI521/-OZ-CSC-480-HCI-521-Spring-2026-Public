package auth.resource;

import java.util.HashMap;
import java.util.List;
import java.util.Map;





import org.bson.Document;

import com.ibm.websphere.security.jwt.Claims;
import com.ibm.websphere.security.jwt.JwtBuilder;

import auth.service.AuthService;
import auth.user.User;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;




@Path("/auth")
@RequestScoped

public class AuthResource{

    private static final int REFRESH_MAX_AGE = 604800; // 7 days
    private static final String REFRESH_TOKEN_NAME = "refresh_token";
    private static final boolean ISHTTPS = false; // just for hotswapping during development
    
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


            // build JWT (shortlived)
            String accessToken = JwtBuilder.create("jwtAuthBuilder")
            .claim(Claims.SUBJECT, email)
            .claim("id", id)
            .claim("email", email)
            .claim("name", name)
            .claim("role", role)
            .claim("groups", new String[]{role})
            .buildJwt()
            .compact();

            Document refreshDoc = authservice.createRefreshToken(id, email);
            String refreshToken = refreshDoc.getString("token");

            // return JWT TO FRONTEND
            Map<String, String> response = new HashMap<>();
            response.put("token", accessToken);
            response.put("email", email);
            response.put("name", name);
            response.put("role", role);
            // System.out.println(response);
            
            NewCookie refreshCookie = new NewCookie.Builder(REFRESH_TOKEN_NAME)
            .value(refreshToken)
            .httpOnly(true)
            .secure(ISHTTPS) //Set to true once https is up and running
            .path("/")
            .maxAge(REFRESH_MAX_AGE)
            .sameSite(NewCookie.SameSite.LAX)
            .build();
            
            return Response.ok(response).cookie(refreshCookie).build();
            
        }catch(Exception e){
            // System.out.println("error");
            e.printStackTrace();
 
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(e.getMessage())
            .build();
        }   
    }


    @POST
    @Path("/refresh")
    @Produces(MediaType.APPLICATION_JSON)
    public Response refresh(@CookieParam(REFRESH_TOKEN_NAME) String refreshToken) {
        try {
            if (refreshToken == null || refreshToken.isEmpty()) {
                return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("No refresh token").build();
            }

            // look up user
            Document tokenDoc = authservice.validateRefreshToken(refreshToken);
            String email = tokenDoc.getString("email");

            Document user = authservice.getUserByEmail(email);
            String id = user.getObjectId("_id").toHexString();
            String name = user.getString("name") != null ? user.getString("name") : email;
            String role = user.getString("role");

            // delete old token, issue new one
            authservice.revokeRefreshToken(refreshToken);
            Document newRefreshDoc = authservice.createRefreshToken(id, email);
            String newRefreshToken = newRefreshDoc.getString("token");

            // Issue new access token
            String accessToken = JwtBuilder.create("jwtAuthBuilder")
                .claim(Claims.SUBJECT, email)
                .claim("id", id)
                .claim("email", email)
                .claim("name", name)
                .claim("role", role)
                .claim("groups", new String[]{role})
                .buildJwt()
                .compact();

            Map<String, String> response = new HashMap<>();
            response.put("token", accessToken);
            response.put("email", email);
            response.put("name", name);
            response.put("role", role);

            NewCookie newCookie = new NewCookie.Builder(REFRESH_TOKEN_NAME)
                .value(newRefreshToken)
                .httpOnly(true)
                .secure(ISHTTPS)
                .path("/")
                .maxAge(REFRESH_MAX_AGE)
                .sameSite(NewCookie.SameSite.LAX)
                .build();

            return Response.ok(response).cookie(newCookie).build();

        } catch (SecurityException e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(e.getMessage()).build();
        } catch (Exception e) {
            e.printStackTrace();
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(e.getMessage()).build();
        }

    }


    @POST
    @Path("/logout")
    public Response logout(@CookieParam(REFRESH_TOKEN_NAME) String refreshToken) {
        if (refreshToken != null) {
            authservice.revokeRefreshToken(refreshToken);
        }

        // Expire the cookie immediately
        NewCookie expiredCookie = new NewCookie.Builder(REFRESH_TOKEN_NAME)
            .value("")
            .httpOnly(true)
            .secure(true)
            .path("/")
            .maxAge(0)
            .build();

        return Response.ok().cookie(expiredCookie).build();
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

    @DELETE
    @Path("/users/remove/{email}")
    // @RolesAllowed("instructor")// we Might want to add admin role later to manage instructors (this line restructs what users can call this endpoint)
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteUser(@PathParam("email") String email){
        try {
            Document user = authservice.removeUser(email);
            return Response.ok(user).build();
            
        } catch(Exception e){
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(e.getMessage())
                .build();
        }
    }
    
    @GET
    @Path("/instructors")
    // @RolesAllowed("instructor")// we Might want to add admin role later to manage instructors (this line restructs what users can call this endpoint)
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

    @POST
    @Path("/instructor/create")
    @RolesAllowed("instructor")// we Might want to add admin role later to manage instructors (this line restructs what users can call this endpoint)
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createInstructor(User user){
        try {
            Document userDoc = authservice.createInstuctor(user.getEmail(), user.getName());
            return Response.ok(userDoc).build();
            
        } catch(Exception e){
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(e.getMessage())
                .build();
        }
    }


    @PUT
    @Path("/instructor/create/{email}")
    @RolesAllowed("instructor")// we Might want to add admin role later to manage instructors (this line restructs what users can call this endpoint)
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateInstructor(@PathParam("email") String email){
        try {
            Document user = authservice.changeUserRole(email, "instructor");
            return Response.ok(user).build();
            
        } catch(Exception e){
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(e.getMessage())
                .build();
        }
    }

    @PUT
    @Path("/instructor/remove/{email}")
    @RolesAllowed("instructor")// we Might want to add admin role later to manage instructors (this line restructs what users can call this endpoint)
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response removeInstructor(@PathParam("email") String email){
        try {
            Document user = authservice.changeUserRole(email, "student");
            return Response.ok(user).build();
            
        } catch(Exception e){
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(e.getMessage())
                .build();
        }
    }


}