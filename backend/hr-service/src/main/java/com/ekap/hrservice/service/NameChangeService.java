package com.ekap.hrservice.service;

import com.ekap.hrservice.model.NameChangeRequest;
import com.ekap.hrservice.repository.NameChangeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class NameChangeService {

    private static final Logger log = LoggerFactory.getLogger(NameChangeService.class);

    private final NameChangeRepository repository;
    private final MinioStorageService storageService;
    private final AnthropicService anthropicService;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public NameChangeService(NameChangeRepository repository,
                              MinioStorageService storageService,
                              AnthropicService anthropicService,
                              KafkaTemplate<String, String> kafkaTemplate) {
        this.repository = repository;
        this.storageService = storageService;
        this.anthropicService = anthropicService;
        this.kafkaTemplate = kafkaTemplate;
    }

    public Mono<NameChangeRequest> submitRequest(
            String employeeId,
            String previousName,
            String newLastName,
            String documentType,
            byte[] documentBytes,
            String documentFilename,
            String documentContentType) {

        String requestId = "NCR-" + System.currentTimeMillis();
        String requestedNewName = buildNewName(previousName, newLastName);

        return storageService.uploadDocument(requestId, documentFilename, documentBytes, documentContentType)
                .flatMap(documentPath -> {
                    NameChangeRequest ncr = new NameChangeRequest();
                    ncr.setId(requestId);
                    ncr.setEmployeeId(employeeId);
                    ncr.setPreviousName(previousName);
                    ncr.setRequestedNewName(requestedNewName);
                    ncr.setDocumentType(documentType);
                    ncr.setDocumentPath(documentPath);
                    ncr.setStatus("PENDING");
                    ncr.setCreatedAt(OffsetDateTime.now());
                    ncr.setUpdatedAt(OffsetDateTime.now());
                    return repository.save(ncr);
                })
                .flatMap(saved -> {
                    // Trigger async verification via Anthropic
                    return anthropicService.verifyNameChangeDocument(
                            documentBytes,
                            documentContentType,
                            previousName,
                            requestedNewName,
                            documentType)
                            .flatMap(result -> {
                                saved.setConfirmedNewName(result.confirmedNewName());
                                if (result.verified() && result.confidence() >= 0.7) {
                                    saved.setStatus("APPROVED");
                                    saved.setConfirmationCode("CONF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                                    saved.setWorkdayRequestId("WD-" + System.currentTimeMillis());
                                } else {
                                    saved.setStatus("REJECTED");
                                    saved.setRejectionReason(result.reason());
                                }
                                saved.setUpdatedAt(OffsetDateTime.now());
                                return repository.save(saved);
                            })
                            .doOnSuccess(updated -> publishKafkaEvent(updated))
                            .onErrorResume(e -> {
                                log.error("Verification failed: {}", e.getMessage());
                                return Mono.just(saved);
                            });
                });
    }

    private String buildNewName(String previousName, String newLastName) {
        String[] parts = previousName.trim().split("\\s+");
        if (parts.length > 1) {
            return parts[0] + " " + newLastName;
        }
        return newLastName;
    }

    private void publishKafkaEvent(NameChangeRequest ncr) {
        try {
            ObjectNode event = objectMapper.createObjectNode();
            event.put("eventType", "NAME_CHANGE_" + ncr.getStatus());
            event.put("requestId", ncr.getId());
            event.put("employeeId", ncr.getEmployeeId());
            event.put("status", ncr.getStatus());
            kafkaTemplate.send("hr-events", ncr.getId(), objectMapper.writeValueAsString(event));
            log.info("Published Kafka event for request: {}", ncr.getId());
        } catch (Exception e) {
            log.error("Failed to publish Kafka event: {}", e.getMessage());
        }
    }

    public Mono<NameChangeRequest> getRequest(String requestId) {
        return repository.findById(requestId);
    }
}
