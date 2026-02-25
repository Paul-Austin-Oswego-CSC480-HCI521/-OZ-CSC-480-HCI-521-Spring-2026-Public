// tag::copyright[]
/*******************************************************************************
 * Copyright (c) 2020, 2024 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/
// end::copyright[]
package worklog.mongo;

import java.util.Collections;

import javax.net.ssl.SSLContext;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import com.ibm.websphere.crypto.PasswordUtil;
import com.ibm.websphere.ssl.JSSEHelper;
import com.ibm.websphere.ssl.SSLException;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoCredential;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Disposes;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;

@ApplicationScoped
public class MongoProducer {

    // tag::mongoProducerInjections[]
    @Inject
    @ConfigProperty(name = "mongo.hostname", defaultValue = "localhost")
    String hostname;

    @Inject
    @ConfigProperty(name = "mongo.port", defaultValue = "27017")
    int port;

    @Inject
    @ConfigProperty(name = "mongo.dbname", defaultValue = "worklogs")
    String dbName;

    @Inject
    @ConfigProperty(name = "mongo.user")
    String user;

    @Inject
    @ConfigProperty(name = "mongo.pass.encoded")
    String encodedPass;
    // end::mongoProducerInjections[]

    // tag::produces1[]
    @Produces
    // end::produces1[]
    // tag::createMongo[]
    public MongoClient createMongo() throws SSLException {
        // tag::decode[]
        String password = PasswordUtil.passwordDecode(encodedPass);
        // end::decode[]
        // tag::createCredential[]
        MongoCredential creds = MongoCredential.createCredential(
                user,
                dbName,
                password.toCharArray()
        );
        // end::createCredential[]

        // tag::sslContext[]
        SSLContext sslContext = JSSEHelper.getInstance().getSSLContext(
                // tag::outboundSSLContext[]
                "outboundSSLContext",
                // end::outboundSSLContext[]
                Collections.emptyMap(),
                null
        );
        // end::sslContext[]

        // tag::mongoClient[]
        return MongoClients.create(MongoClientSettings.builder()
                   .applyConnectionString(
                       new ConnectionString("mongodb://" + hostname + ":" + port))
                   .credential(creds)
                   .applyToSslSettings(builder -> {
                       builder.enabled(true);
                       builder.context(sslContext); })
                   .build());
        // end::mongoClient[]
    }
    // end::createMongo[]

    // tag::produces2[]
    @Produces
    // end::produces2[]
    // tag::createDB[]
    public MongoDatabase createDB(
            // tag::injectMongoClient[]
            MongoClient client) {
            // end::injectMongoClient[]
        // tag::getDatabase[]
        return client.getDatabase(dbName);
        // end::getDatabase[]
    }
    // end::createDB[]

    // tag::close[]
    public void close(
            // tag::disposes[]
            @Disposes MongoClient toClose) {
            // end::disposes[]
        // tag::toClose[]
        toClose.close();
        // end::toClose[]
    }
    // end::close[]
}
