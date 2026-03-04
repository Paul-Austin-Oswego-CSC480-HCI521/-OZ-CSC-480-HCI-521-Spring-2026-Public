 package worklog.application;

  import jakarta.servlet.*;
  import jakarta.servlet.annotation.WebFilter;
  import jakarta.servlet.http.HttpServletRequest;
  import jakarta.servlet.http.HttpServletResponse;
  import java.io.IOException;

  @WebFilter("/*")
  public class CorsFilter implements Filter {

      @Override
      public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
              throws IOException, ServletException {
          HttpServletResponse response = (HttpServletResponse) res;
          HttpServletRequest request = (HttpServletRequest) req;

          response.setHeader("Access-Control-Allow-Origin", "*");
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
