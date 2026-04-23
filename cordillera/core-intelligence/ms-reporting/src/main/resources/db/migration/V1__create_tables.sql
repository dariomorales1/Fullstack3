CREATE TABLE IF NOT EXISTS reporte (
    id                  BIGSERIAL       PRIMARY KEY,
    tipo                VARCHAR(50)     NOT NULL,
    titulo              VARCHAR(300)    NOT NULL,
    fecha_generacion    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    parametros          JSONB,
    estado              VARCHAR(30)     NOT NULL DEFAULT 'EN_PROCESO'
);

CREATE TABLE IF NOT EXISTS contenido_reporte (
    id          BIGSERIAL       PRIMARY KEY,
    reporte_id  BIGINT          NOT NULL REFERENCES reporte(id) ON DELETE CASCADE,
    seccion     VARCHAR(100)    NOT NULL,
    datos_json  JSONB           NOT NULL,
    orden       INT
);

CREATE INDEX idx_reporte_tipo ON reporte(tipo);
CREATE INDEX idx_reporte_fecha ON reporte(fecha_generacion);
CREATE INDEX idx_contenido_reporte ON contenido_reporte(reporte_id);
