FROM maven:3.8-openjdk-11 AS builder
WORKDIR /app
COPY worklog/pom.xml .
COPY worklog/src ./src
RUN mvn clean package

FROM icr.io/appcafe/open-liberty:full-java11-openj9-ubi AS production

RUN mkdir -p /opt/ol/wlp/output/defaultServer/resources/security && \
    chown -R 1001:0 /opt/ol/wlp/output/defaultServer/resources/security

COPY --chown=1001:0 --from=builder /app/target/*.war /config/apps/
COPY --chown=1001:0 certs/truststore.p12 /opt/ol/wlp/output/defaultServer/resources/security/truststore.p12
COPY --chown=1001:0 worklog/src/main/liberty/config /config/

ENV JVM_ARGS="-Djavax.net.ssl.trustStore=/opt/ol/wlp/output/defaultServer/resources/security/truststore.p12 \
              -Djavax.net.ssl.trustStorePassword=mongodb \
              -Djavax.net.ssl.trustStoreType=PKCS12 \
              -Djavax.net.debug=ssl:handshake"