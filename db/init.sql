CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    tenant VARCHAR(50) NOT NULL,
    source VARCHAR(50),
    vendor VARCHAR(50),
    product VARCHAR(50),
    severity INT CHECK (severity >= 0 AND severity <= 10),
    action VARCHAR(50),
    event_type VARCHAR(100),
    event_subtype VARCHAR(100),
    src_ip INET,
    dst_ip INET,
    src_port INT,
    dst_port INT,
    protocol VARCHAR(20),
    message TEXT,
    policy VARCHAR(200),
    interface VARCHAR(100),
    user_name VARCHAR(100),
    host VARCHAR(100),
    process VARCHAR(200),
    url VARCHAR(500),
    http_method VARCHAR(10),
    status_code INT,
    rule_name VARCHAR(200),
    rule_id VARCHAR(100),          
    cloud_account_id VARCHAR(50), 
    cloud_region VARCHAR(50),
    cloud_service VARCHAR(100),
    raw_data TEXT,                 
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_tenant ON logs(tenant);
CREATE INDEX idx_logs_source ON logs(source);
CREATE INDEX idx_logs_raw_data ON logs USING GIN (raw_data);