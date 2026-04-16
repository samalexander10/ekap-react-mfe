CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS conversation_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    role VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    vertical VARCHAR(50),
    sub_vertical VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conv_turns_conversation_id ON conversation_turns(conversation_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    conversation_id VARCHAR(36),
    query_text TEXT,
    vertical VARCHAR(50),
    sensitivity_level VARCHAR(20),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS name_change_requests (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(100) NOT NULL,
    previous_name VARCHAR(200) NOT NULL,
    requested_new_name VARCHAR(200) NOT NULL,
    confirmed_new_name VARCHAR(200),
    document_type VARCHAR(50) NOT NULL,
    document_path VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    verification_result JSONB,
    rejection_reason TEXT,
    workday_request_id VARCHAR(100),
    confirmation_code VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ncr_employee_id ON name_change_requests(employee_id);
