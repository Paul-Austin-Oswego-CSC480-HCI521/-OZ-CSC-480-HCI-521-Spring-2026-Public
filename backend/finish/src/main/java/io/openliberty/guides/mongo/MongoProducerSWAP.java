// // tag::copyright[]
// /*******************************************************************************
//  * Copyright (c) 2020, 2024 IBM Corporation and others.
//  * All rights reserved. This program and the accompanying materials
//  * are made available under the terms of the Eclipse Public License 2.0
//  * which accompanies this distribution, and is available at
//  * http://www.eclipse.org/legal/epl-2.0/
//  *
//  * SPDX-License-Identifier: EPL-2.0
//  *******************************************************************************/
// // end::copyright[]
// package io.openliberty.guides.mongo;

// import org.eclipse.microprofile.config.inject.ConfigProperty;

// import com.ibm.websphere.ssl.SSLException;
// import com.mongodb.ConnectionString;
// import com.mongodb.MongoClientSettings;
// import com.mongodb.client.MongoClient;
// import com.mongodb.client.MongoClients;
// import com.mongodb.client.MongoDatabase;

// import jakarta.enterprise.context.ApplicationScoped;
// import jakarta.enterprise.inject.Disposes;
// import jakarta.enterprise.inject.Produces;
// import jakarta.inject.Inject;

// @ApplicationScoped
// public class MongoProducerSWAP {

//     // tag::mongoProducerInjections[]
//     @Inject
//     @ConfigProperty(name = "mongo.hostname", defaultValue = "localhost")
//     String hostname;

//     @Inject
//     @ConfigProperty(name = "mongo.port", defaultValue = "27017")
//     int port;

//     @Inject
//     @ConfigProperty(name = "mongo.dbname", defaultValue = "testdb")
//     String dbName;

//     @Inject
//     @ConfigProperty(name = "mongo.user")
//     String user;

//     @Inject
//     @ConfigProperty(name = "mongo.pass.encoded")
//     String encodedPass;
//     // end::mongoProducerInjections[]

//     // tag::produces1[]
//     @Produces
//     // end::produces1[]
//     // tag::createMongo[]
//     public MongoClient createMongo() throws SSLException { //LANDON'S CHANGES: Please ensure that this runs on your machines as well. I had to adjust the code so it would run on my machine properly (old processor).
        
//         /* String password = PasswordUtil.passwordDecode(encodedPass);
        
//         MongoCredential creds = MongoCredential.createCredential(
//                 user,
//                 dbName,
//                 password.toCharArray()
//         );

//         SSLContext sslContext = JSSEHelper.getInstance().getSSLContext(
//                 "outboundSSLContext",
//                 Collections.emptyMap(),
//                 null
//         );
//         */
//         // --------------------------------------------------

//         // SIMPLIFIED CLIENT (for older mongo 4.4)
//         return MongoClients.create(MongoClientSettings.builder()
//                    .applyConnectionString(
//                        new ConnectionString("mongodb://" + hostname + ":" + port))
//                    //.credential(creds) // Commented out auth
//                    //.applyToSslSettings(builder -> { // Commented out SSL
//                    //    builder.enabled(true);
//                    //    builder.context(sslContext); })
//                    .build());
//     }
//     // end::createMongo[]

//     // tag::produces2[]
//     @Produces
//     // end::produces2[]
//     // tag::createDB[]
//     public MongoDatabase createDB(
//             // tag::injectMongoClient[]
//             MongoClient client) {
//             // end::injectMongoClient[]
//         // tag::getDatabase[]
//         return client.getDatabase(dbName);
//         // end::getDatabase[]
//     }
//     // end::createDB[]

//     // tag::close[]
//     public void close(
//             // tag::disposes[]
//             @Disposes MongoClient toClose) {
//             // end::disposes[]
//         // tag::toClose[]
//         toClose.close();
//         // end::toClose[]
//     }
//     // end::close[]
// }
