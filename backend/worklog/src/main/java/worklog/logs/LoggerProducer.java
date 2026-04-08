package worklog.logs;

import jakarta.enterprise.context.Dependent;
import jakarta.enterprise.inject.Produces;
import jakarta.enterprise.inject.spi.InjectionPoint;
import java.io.IOException;
import java.util.logging.FileHandler;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;

@Dependent
public class LoggerProducer {

    @Produces
    public Logger produceLogger(InjectionPoint injectionPoint) throws IOException {
        String className = injectionPoint.getMember().getDeclaringClass().getName();
        String simpleName = injectionPoint.getMember().getDeclaringClass().getSimpleName();

        Logger logger = Logger.getLogger(className);

        FileHandler handler = new FileHandler("logs/" + simpleName + ".log", true);
        handler.setFormatter(new SimpleFormatter());
        handler.setLevel(Level.INFO);

        logger.addHandler(handler);

        logger.setLevel(Level.INFO);
        return logger;
    }
}