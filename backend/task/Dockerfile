# Stage 1: Builder
FROM maven:3.8-openjdk-11 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package

# Stage 2: Production
FROM icr.io/appcafe/open-liberty:kernel-slim-java11-openj9-ubi AS production
ARG VERSION=1.0
ARG REVISION=SNAPSHOT

LABEL org.opencontainers.image.source=https://github.com/Paul-Austin-Oswego-CSC480-HCI521/-OZ-CSC-480-HCI-521-Spring-2026-Public
LABEL org.opencontainers.image.description="Backend microservice Finish with Open Liberty for OZ CSC 480"
LABEL org.opencontainers.image.licenses=MIT
LABEL org.opencontainers.image.version="$VERSION"
LABEL org.opencontainers.image.revision="$REVISION"
LABEL org.opencontainers.image.authors="OZ Team"
LABEL vendor="Open Liberty"
LABEL name="backend-csc480-prod-finish"

COPY --chown=1001:0 src/main/liberty/config /config/
RUN features.sh
COPY --chown=1001:0 --from=builder /app/target/*.war /config/apps/
RUN configure.sh

EXPOSE 7001
