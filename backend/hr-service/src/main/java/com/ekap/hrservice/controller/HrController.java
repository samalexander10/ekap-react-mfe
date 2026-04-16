package com.ekap.hrservice.controller;

import com.ekap.hrservice.model.NameChangeRequest;
import com.ekap.hrservice.service.NameChangeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/hr")
public class HrController {

    private static final Logger log = LoggerFactory.getLogger(HrController.class);

    private final NameChangeService nameChangeService;

    public HrController(NameChangeService nameChangeService) {
        this.nameChangeService = nameChangeService;
    }

    @GetMapping("/health")
    public Mono<Map<String, String>> health() {
        return Mono.just(Map.of("status", "ok", "service", "hr-service"));
    }

    @PostMapping(value = "/name-change", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<Map<String, Object>> submitNameChange(
            @RequestPart("employeeId") String employeeId,
            @RequestPart("previousName") String previousName,
            @RequestPart("newLastName") String newLastName,
            @RequestPart("documentType") String documentType,
            @RequestPart("file") FilePart file) {

        log.info("Received name change request for employee: {}", employeeId);

        return file.content()
                .map(dataBuffer -> {
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(bytes);
                    return bytes;
                })
                .reduce((a, b) -> {
                    byte[] combined = new byte[a.length + b.length];
                    System.arraycopy(a, 0, combined, 0, a.length);
                    System.arraycopy(b, 0, combined, a.length, b.length);
                    return combined;
                })
                .flatMap(fileBytes -> {
                    String filename = file.filename();
                    String contentType = file.headers().getContentType() != null
                            ? file.headers().getContentType().toString()
                            : "application/octet-stream";

                    return nameChangeService.submitRequest(
                            employeeId, previousName, newLastName, documentType,
                            fileBytes, filename, contentType);
                })
                .map(ncr -> Map.of(
                        "requestId", ncr.getId(),
                        "status", ncr.getStatus(),
                        "message", getStatusMessage(ncr),
                        "confirmationCode", ncr.getConfirmationCode() != null ? ncr.getConfirmationCode() : ""
                ));
    }

    @GetMapping("/name-change/{requestId}")
    public Mono<NameChangeRequest> getNameChange(@PathVariable String requestId) {
        return nameChangeService.getRequest(requestId);
    }

    private String getStatusMessage(NameChangeRequest ncr) {
        return switch (ncr.getStatus()) {
            case "APPROVED" -> "Name change request approved. Confirmation: " + ncr.getConfirmationCode();
            case "REJECTED" -> "Name change request rejected: " + ncr.getRejectionReason();
            default -> "Name change request submitted successfully. Request ID: " + ncr.getId();
        };
    }
}
