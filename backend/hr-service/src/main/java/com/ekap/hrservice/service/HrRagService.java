package com.ekap.hrservice.service;

import io.weaviate.client.WeaviateClient;
import io.weaviate.client.v1.graphql.model.GraphQLResponse;
import io.weaviate.client.v1.graphql.query.argument.NearTextArgument;
import io.weaviate.client.v1.graphql.query.fields.Field;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class HrRagService {

    private final WeaviateClient weaviateClient;

    public HrRagService(WeaviateClient weaviateClient) {
        this.weaviateClient = weaviateClient;
    }

    @SuppressWarnings("unchecked")
    public List<String> retrieveRelevantChunks(String query, List<String> subVerticals, List<String> userRoles) {
        List<String> results = new ArrayList<>();
        try {
            NearTextArgument nearText = NearTextArgument.builder()
                .concepts(new String[]{query})
                .build();

            GraphQLResponse response = weaviateClient.graphQL().get()
                .withClassName("HrPolicy")
                .withFields(
                    Field.builder().name("content").build(),
                    Field.builder().name("subVertical").build(),
                    Field.builder().name("managerOnly").build()
                )
                .withNearText(nearText)
                .withLimit(5)
                .run();

            if (response.getData() != null) {
                Map<String, Object> data = (Map<String, Object>) response.getData();
                Map<String, Object> get = (Map<String, Object>) data.get("Get");
                if (get != null) {
                    List<Map<String, Object>> items = (List<Map<String, Object>>) get.get("HrPolicy");
                    if (items != null) {
                        for (Map<String, Object> item : items) {
                            Boolean managerOnly = (Boolean) item.get("managerOnly");
                            if (Boolean.TRUE.equals(managerOnly) && !userRoles.contains("MANAGER")) {
                                continue;
                            }
                            String content = (String) item.get("content");
                            if (content != null) results.add(content);
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Weaviate unavailable - return empty
        }
        return results;
    }
}
