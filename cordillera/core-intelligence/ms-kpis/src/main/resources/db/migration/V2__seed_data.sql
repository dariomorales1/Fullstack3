INSERT INTO indicador (codigo, nombre, tipo, unidad, formula) VALUES
('KPI-001', 'Cumplimiento de ventas mensual',    'PORCENTUAL', 'PORCENTAJE', '(ventas_actual / meta_ventas) * 100'),
('KPI-002', 'Ventas acumuladas del trimestre',   'ACUMULADO',  'CLP',        'SUM(ventas_mensuales)'),
('KPI-003', 'Ticket promedio por sucursal',      'PROMEDIO',   'CLP',        'AVG(monto_venta)'),
('KPI-004', 'Rotacion de inventario',            'PORCENTUAL', 'PORCENTAJE', '(unidades_vendidas / stock_inicial) * 100'),
('KPI-005', 'Margen financiero acumulado',       'ACUMULADO',  'CLP',        'SUM(ingresos - egresos)');

INSERT INTO periodo (anio, mes, trimestre, fecha_inicio, fecha_fin) VALUES
(2026, 1, 1, '2026-01-01', '2026-01-31'),
(2026, 2, 1, '2026-02-01', '2026-02-28'),
(2026, 3, 1, '2026-03-01', '2026-03-31'),
(2026, 4, 2, '2026-04-01', '2026-04-30');

INSERT INTO objetivo (indicador_id, periodo_id, valor_meta, umbral_alerta) VALUES
(1, 1, 100.00,    80.00),
(1, 2, 100.00,    80.00),
(1, 3, 100.00,    80.00),
(2, 3, 5000000.00, 4000000.00),
(3, 1, 50000.00,   40000.00),
(4, 1, 75.00,      60.00),
(5, 3, 3000000.00, 2500000.00);
