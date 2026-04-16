package com.ekap.hrservice.service;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.ByteArrayInputStream;

@Service
public class MinioStorageService {

    private static final Logger log = LoggerFactory.getLogger(MinioStorageService.class);

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket}")
    private String bucket;

    private MinioClient getClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }

    public Mono<String> uploadDocument(String requestId, String filename, byte[] data, String contentType) {
        return Mono.fromCallable(() -> {
            MinioClient client = getClient();

            // Ensure bucket exists
            boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("Created bucket: {}", bucket);
            }

            String objectName = requestId + "/" + filename;
            client.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .stream(new ByteArrayInputStream(data), data.length, -1)
                    .contentType(contentType)
                    .build());

            log.info("Uploaded document: {}/{}", bucket, objectName);
            return objectName;
        }).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<byte[]> downloadDocument(String objectPath) {
        return Mono.fromCallable(() -> {
            MinioClient client = getClient();
            var stream = client.getObject(
                    io.minio.GetObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectPath)
                            .build());
            return stream.readAllBytes();
        }).subscribeOn(Schedulers.boundedElastic());
    }
}
