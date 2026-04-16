package com.ekap.hrservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ToneConfigService {

    private static final String DEFAULT_PROMPT =
        "You are a professional and helpful HR assistant. Provide clear, accurate answers based on company policy.";

    private final ObjectMapper yaml = new ObjectMapper(new YAMLFactory());
    private final Map<String, Map<String, Object>> cache = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    public String getSystemPrompt(String subVertical) {
        Map<String, Object> config = loadConfig(subVertical);
        return config != null ? (String) config.getOrDefault("systemPrompt", DEFAULT_PROMPT) : DEFAULT_PROMPT;
    }

    @SuppressWarnings("unchecked")
    public String getSensitivityLevel(String subVertical) {
        Map<String, Object> config = loadConfig(subVertical);
        return config != null ? (String) config.getOrDefault("sensitivityLevel", "NORMAL") : "NORMAL";
    }

    @SuppressWarnings("unchecked")
    public boolean requiresEscalation(String subVertical) {
        Map<String, Object> config = loadConfig(subVertical);
        return config != null && Boolean.TRUE.equals(config.get("escalationRecommended"));
    }

    @SuppressWarnings("unchecked")
    public boolean isManagerOnly(String subVertical) {
        Map<String, Object> config = loadConfig(subVertical);
        return config != null && Boolean.TRUE.equals(config.get("managerOnly"));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> loadConfig(String subVertical) {
        return cache.computeIfAbsent(subVertical, key -> {
            String path = "tone-configs/" + key + ".yml";
            try {
                ClassPathResource resource = new ClassPathResource(path);
                if (!resource.exists()) return Map.of();
                try (InputStream is = resource.getInputStream()) {
                    return yaml.readValue(is, Map.class);
                }
            } catch (IOException e) {
                return Map.of();
            }
        });
    }
}
