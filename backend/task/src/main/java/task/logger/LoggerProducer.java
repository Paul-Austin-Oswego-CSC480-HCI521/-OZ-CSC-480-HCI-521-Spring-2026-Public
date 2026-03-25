package task.logger;

import jakarta.enterprise.context.Dependent;
import jakarta.enterprise.inject.spi.InjectionPoint;
import jakarta.ws.rs.Produces;

import java.io.IOException;
import java.util.logging.FileHandler;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;

@Dependent
public class LoggerProducer {

    @Produces
    public Logger produceLogger(InjectionPoint injectionPoint) throws IOException {
        String serviceName = injectionPoint.getMember().getDeclaringClass().getName();
        Logger logger = Logger.getLogger(serviceName);
        FileHandler handler = new FileHandler("logs/log.log", (5*1024*1024), 10, true);
        handler.setFormatter(new SimpleFormatter());

        logger.addHandler(handler);
        logger.setUseParentHandlers(false);
        logger.setLevel(Level.INFO);

        return logger;
    }

}
