package worklog.application.cors;

import java.io.IOException;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebFilter("/*")
public class CorsFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;
        HttpServletRequest request = (HttpServletRequest) req;

        // response.setHeader("Access-Control-Allow-Origin", "*");
         String origin = request.getHeader("Origin");                                                                                                                                  
        String[] allowedOrigins = {                                                                                                                                                   
            "http://localhost:3000",                                                                                                                                                  
            "http://localhost:3001",
            //ADD MOXIE URL AS WELL,                                                                                                                                                // 
        };                                                                                                                                                                            

        for (String allowed : allowedOrigins) {                                                                                                                                       
            if (allowed.equals(origin)) {
                response.setHeader("Access-Control-Allow-Origin", origin);                                                                                                            
                break;                                            
            }
        }                                                                                                 
        response.setHeader("Access-Control-Allow-Credentials", "true"); 
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Max-Age", "3600");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(200);
            return;
        }

        chain.doFilter(req, res);
    }
}