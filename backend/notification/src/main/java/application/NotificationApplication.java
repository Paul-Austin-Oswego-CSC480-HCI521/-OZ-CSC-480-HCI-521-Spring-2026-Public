package application;
import org.eclipse.microprofile.auth.LoginConfig;

import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;


@ApplicationPath("/")
@LoginConfig(authMethod = "MP-JWT")
public class NotificationApplication extends Application {

}


