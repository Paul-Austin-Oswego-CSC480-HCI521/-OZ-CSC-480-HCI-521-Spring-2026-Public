// tag::copyright[]
/*******************************************************************************
 * Copyright (c) 2020, 2022 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/
// end::copyright[]
package it.io.openliberty.guides.application;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.StringReader;
import java.util.ArrayList;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.TestMethodOrder;

import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonArrayBuilder;
import jakarta.json.JsonObject;
import jakarta.json.JsonObjectBuilder;
import jakarta.json.JsonReader;
import jakarta.json.JsonValue;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.client.Entity;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class CrewServiceIT {

    private static Client client;
    private static String rootURL;
    private static ArrayList<String> testIDs = new ArrayList<>(2);

    @BeforeAll
    public static void setup() {
        client = ClientBuilder.newClient();

        String port = System.getProperty("app.http.port");
        String context = System.getProperty("app.context.root");
        rootURL = "http://localhost:" + port + context;
        System.out.println(rootURL);
    }

    @AfterAll
    public static void teardown() {
        client.close();
    }

}
