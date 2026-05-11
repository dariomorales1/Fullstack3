INSERT INTO objetivo (indicador_id, periodo_id, valor_meta, umbral_alerta) VALUES
(1, 4, 100.00,      80.00),
(2, 4, 900000.00,   80.00),
(3, 4, 200000.00,   80.00),
(4, 4, 75.00,       60.00),
(5, 4, 250000.00,   70.00);

INSERT INTO resultado (id, indicador_id, periodo_id, valor_real, porcentaje_cumplimiento, estado) VALUES
(1, 1, 4, 104.50,   104.50, 'CUMPLIDO'),
(2, 2, 4, 877000.00, 97.44, 'EN_RIESGO'),
(3, 3, 4, 185333.33, 92.67, 'EN_RIESGO'),
(4, 4, 4, 58.20,     77.60, 'CRITICO'),
(5, 5, 4, 291000.00,116.40, 'CUMPLIDO');
