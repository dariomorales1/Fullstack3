CREATE TABLE IF NOT EXISTS indicador (
    id      BIGSERIAL       PRIMARY KEY,
    codigo  VARCHAR(30)     NOT NULL UNIQUE,
    nombre  VARCHAR(200)    NOT NULL,
    tipo    VARCHAR(50)     NOT NULL,
    unidad  VARCHAR(30)     NOT NULL,
    formula VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS periodo (
    id              BIGSERIAL   PRIMARY KEY,
    anio            INT         NOT NULL,
    mes             INT         NOT NULL,
    trimestre       INT,
    fecha_inicio    DATE        NOT NULL,
    fecha_fin       DATE        NOT NULL
);

CREATE TABLE IF NOT EXISTS objetivo (
    id              BIGSERIAL       PRIMARY KEY,
    indicador_id    BIGINT          NOT NULL REFERENCES indicador(id) ON DELETE CASCADE,
    periodo_id      BIGINT          NOT NULL REFERENCES periodo(id),
    valor_meta      DECIMAL(14,2)   NOT NULL,
    umbral_alerta   DECIMAL(14,2)
);

CREATE TABLE IF NOT EXISTS resultado (
    id                      BIGSERIAL       PRIMARY KEY,
    indicador_id            BIGINT          NOT NULL REFERENCES indicador(id) ON DELETE CASCADE,
    periodo_id              BIGINT          NOT NULL REFERENCES periodo(id),
    valor_real              DECIMAL(14,2)   NOT NULL,
    porcentaje_cumplimiento DECIMAL(6,2),
    estado                  VARCHAR(30)     NOT NULL
);

CREATE INDEX idx_objetivo_indicador ON objetivo(indicador_id);
CREATE INDEX idx_objetivo_periodo ON objetivo(periodo_id);
CREATE INDEX idx_resultado_indicador ON resultado(indicador_id);
CREATE INDEX idx_resultado_periodo ON resultado(periodo_id);
