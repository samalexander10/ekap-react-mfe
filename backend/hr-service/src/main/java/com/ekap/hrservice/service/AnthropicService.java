package com.ekap.hrservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Base64;

@Service
public class AnthropicService {

    private static final Logger log = LoggerFactory.getLogger(AnthropicService.class);

    @Value("${anthropic.api-key}")
    private String apiKey;

    @Value("${anthropic.api-url}")
    private String apiUrl;

    @Value("${anthropic.model}")
    private String model;

    private final OkHttpClient httpClient = new OkHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Mono<VerificationResult> verifyNameChangeDocument(
            byte[] documentBytes,
            String mediaType,
            String previousName,
            String newName,
            String documentType) {

        return Mono.fromCallable(() -> {
            String base64Doc = Base64.getEncoder().encodeToString(documentBytes);

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);
            requestBody.put("max_tokens", 1024);

            ArrayNode messages = requestBody.putArray("messages");
            ObjectNode message = messages.addObject();
            message.put("role", "user");

            ArrayNode content = message.putArray("content");

            // Image/document content
            ObjectNode imageContent = content.addObject();
            imageContent.put("type", "image");
            ObjectNode imageSource = imageContent.putObject("source");
            imageSource.put("type", "base64");
            imageSource.put("media_type", mediaType);
            imageSource.put("data", base64Doc);

            // Text prompt
            ObjectNode textContent = content.addObject();
            textContent.put("type", "text");
            textContent.put("text", String.format("""
                    You are an HR document verification specialist.

                    Please verify this %s document for a legal name change request.
                    - Previous name: %s
                    - Requested new name: %s

                    Check if:
                    1. The document appears legitimate and readable
                    2. The document supports the name change from "%s" to "%s"
                    3. Extract the confirmed new name from the document

                    Respond in JSON format:
                    {
                      "verified": true/false,
                      "confidence": 0.0-1.0,
                      "confirmedNewName": "extracted name or null",
                      "reason": "brief explanation"
                    }
                    """,
                    documentType, previousName, newName, previousName, newName));

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            log.debug("Sending verification request to Anthropic");

            Request request = new Request.Builder()
                    .url(apiUrl)
                    .post(RequestBody.create(jsonBody, MediaType.parse("application/json")))
                    .addHeader("x-api-key", apiKey)
                    .addHeader("anthropic-version", "2023-06-01")
                    .addHeader("Content-Type", "application/json")
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    log.error("Anthropic API error: {}", response.code());
                    return new VerificationResult(false, 0.0, null, "API error: " + response.code());
                }

                String responseBody = response.body().string();
                JsonNode jsonResponse = objectMapper.readTree(responseBody);
                String textResponse = jsonResponse
                        .path("content")
                        .get(0)
                        .path("text")
                        .asText();

                // Extract JSON from response
                int jsonStart = textResponse.indexOf('{');
                int jsonEnd = textResponse.lastIndexOf('}') + 1;
                if (jsonStart >= 0 && jsonEnd > jsonStart) {
                    String jsonStr = textResponse.substring(jsonStart, jsonEnd);
                    JsonNode result = objectMapper.readTree(jsonStr);
                    return new VerificationResult(
                            result.path("verified").asBoolean(false),
                            result.path("confidence").asDouble(0.0),
                            result.path("confirmedNewName").asText(null),
                            result.path("reason").asText(""));
                }

                return new VerificationResult(false, 0.0, null, "Could not parse verification response");
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    public record VerificationResult(
            boolean verified,
            double confidence,
            String confirmedNewName,
            String reason) {}
}
