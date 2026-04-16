package com.ekap.hrservice.repository;

import com.ekap.hrservice.model.NameChangeRequest;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface NameChangeRepository extends ReactiveCrudRepository<NameChangeRequest, String> {
    Flux<NameChangeRequest> findByEmployeeId(String employeeId);
}
