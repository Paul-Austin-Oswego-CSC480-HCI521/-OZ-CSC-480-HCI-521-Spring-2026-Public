# Stage 1: Builder
FROM maven:3.8-openjdk-11 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package

# Stage 2: Development
FROM icr.io/appcafe/open-liberty:kernel-slim-java11-openj9-ubi AS development
ARG VERSION=1.0
ARG REVISION=SNAPSHOT
LABEL \
  org.opencontainers.image.authors="Your Name" \
  org.opencontainers.image.vendor="IBM" \
  vendor="Open Liberty" \
  name="system-dev"
COPY --chown=1001:0 src/main/liberty/config/ /config/
RUN features.sh
COPY --chown=1001:0 --from=builder /app/target/*.war /config/apps/
RUN configure.sh

# Stage 3: Production
FROM icr.io/appcafe/open-liberty:kernel-slim-java11-openj9-ubi AS production
ARG VERSION=1.0
ARG REVISION=SNAPSHOT
LABEL \
  org.opencontainers.image.authors="Your Name" \
  org.opencontainers.image.vendor="IBM" \
  vendor="Open Liberty" \
  name="system-prod"
COPY --chown=1001:0 src/main/liberty/config /config/
RUN features.sh
COPY --chown=1001:0 --from=builder /app/target/*.war /config/apps/
RUN configure.sh