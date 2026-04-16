package com.ekap.hrservice.config;

import io.weaviate.client.Config;
import io.weaviate.client.WeaviateClient;
import io.weaviate.client.v1.auth.exception.AuthException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;

@Configuration
public class WeaviateConfig {

    @Value("${ekap.weaviate.url:http://weaviate:8080}")
    private String weaviateUrl;

    @Bean
    public WeaviateClient weaviateClient() {
        URI uri = URI.create(weaviateUrl);
        String scheme = uri.getScheme();
        String host = uri.getHost() + (uri.getPort() > 0 ? ":" + uri.getPort() : "");
        Config config = new Config(scheme, host);
        return new WeaviateClient(config);
    }
}
