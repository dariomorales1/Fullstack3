CREATE TABLE customer (
    id BIGSERIAL PRIMARY KEY,
    rut VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    type VARCHAR(50) NOT NULL, -- Ej: RETAIL, CORPORATE, DISTRIBUTOR
    registration_date TIMESTAMP NOT NULL
);

CREATE TABLE contact (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    position VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(50),
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE
);