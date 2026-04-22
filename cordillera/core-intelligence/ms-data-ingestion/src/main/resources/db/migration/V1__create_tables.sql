CREATE TABLE IF NOT EXISTS ingested_data (
    id              BIGSERIAL       PRIMARY KEY,
    source_service  VARCHAR(50)     NOT NULL,
    raw_data        JSONB           NOT NULL,
    timestamp       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(30)     NOT NULL DEFAULT 'SUCCESS'
);

CREATE TABLE IF NOT EXISTS ingestion_log (
    id                  BIGSERIAL   PRIMARY KEY,
    execution_date      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    records_processed   INT         DEFAULT 0,
    errors              INT         DEFAULT 0,
    source_service      VARCHAR(50),
    status              VARCHAR(30) DEFAULT 'SUCCESS'
);

CREATE INDEX idx_ingested_source ON ingested_data(source_service);
CREATE INDEX idx_ingested_timestamp ON ingested_data(timestamp);
CREATE INDEX idx_log_date ON ingestion_log(execution_date);
