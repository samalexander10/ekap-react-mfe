package com.ekap.hrservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;

import java.time.OffsetDateTime;

@Table("name_change_requests")
public class NameChangeRequest {

    @Id
    private String id;

    @Column("employee_id")
    private String employeeId;

    @Column("previous_name")
    private String previousName;

    @Column("requested_new_name")
    private String requestedNewName;

    @Column("confirmed_new_name")
    private String confirmedNewName;

    @Column("document_type")
    private String documentType;

    @Column("document_path")
    private String documentPath;

    @Column("status")
    private String status = "PENDING";

    @Column("rejection_reason")
    private String rejectionReason;

    @Column("workday_request_id")
    private String workdayRequestId;

    @Column("confirmation_code")
    private String confirmationCode;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;

    @Column("completed_at")
    private OffsetDateTime completedAt;

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getPreviousName() { return previousName; }
    public void setPreviousName(String previousName) { this.previousName = previousName; }

    public String getRequestedNewName() { return requestedNewName; }
    public void setRequestedNewName(String requestedNewName) { this.requestedNewName = requestedNewName; }

    public String getConfirmedNewName() { return confirmedNewName; }
    public void setConfirmedNewName(String confirmedNewName) { this.confirmedNewName = confirmedNewName; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getDocumentPath() { return documentPath; }
    public void setDocumentPath(String documentPath) { this.documentPath = documentPath; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getWorkdayRequestId() { return workdayRequestId; }
    public void setWorkdayRequestId(String workdayRequestId) { this.workdayRequestId = workdayRequestId; }

    public String getConfirmationCode() { return confirmationCode; }
    public void setConfirmationCode(String confirmationCode) { this.confirmationCode = confirmationCode; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }
}
