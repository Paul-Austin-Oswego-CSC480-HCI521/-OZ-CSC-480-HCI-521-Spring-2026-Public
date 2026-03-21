package auth.application;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import com.ibm.websphere.security.jwt.JwtBuilder;
import com.ibm.websphere.security.jwt.Claims;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;


@Path("/auth")
@RequestScoped

public class AuthResource{

    @GET
    @Path("/login")
    @RolesAllowed("users")
    @Produces(MediaType.APPLICATION_JSON)
    public Response login(@Context HttpServletRequest request){

        try{
            // GET USER INFO 
            var principal = request.getUserPrincipal();
            String email = principal.getName();

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
}