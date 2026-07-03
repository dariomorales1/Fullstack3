CREATE TABLE sale (
    id BIGSERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    amount DECIMAL (12,2) NOT NULL,
    branch_id BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL
);

CREATE TABLE sale_detail (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_sale FOREIGN KEY (sale_id) REFERENCES sale(id)
)
