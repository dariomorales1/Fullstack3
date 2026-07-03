CREATE TABLE movement (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(30) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date TIMESTAMP NOT NULL,
    branch_id BIGINT NOT NULL,
    description VARCHAR(500),
    category VARCHAR(100)
);

CREATE TABLE balance (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    period VARCHAR(20) NOT NULL,
    income DECIMAL(14,2) DEFAULT 0,
    expenses DECIMAL(14,2) DEFAULT 0,
    profit DECIMAL(14,2) DEFAULT 0
);