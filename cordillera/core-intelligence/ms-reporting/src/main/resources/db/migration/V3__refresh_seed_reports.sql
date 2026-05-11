DELETE FROM contenido_reporte;
DELETE FROM reporte;

INSERT INTO reporte (id, tipo, titulo, fecha_generacion, parametros, estado) VALUES
(1, 'VENTAS_POR_SUCURSAL',    'Ventas consolidadas abril 2026',      '2026-05-06 10:20:00', '{"periodo":"2026-04"}',       'GENERADO'),
(2, 'INVENTARIO_CONSOLIDADO', 'Inventario consolidado abril 2026',   '2026-05-06 10:25:00', '{"corte":"2026-04-30"}',      'GENERADO'),
(3, 'KPI_MENSUAL',            'KPIs operacionales abril 2026',       '2026-05-06 10:30:00', '{"periodoId":4}',             'GENERADO'),
(4, 'BALANCE_FINANCIERO',     'Balance ejecutivo abril 2026',        '2026-05-06 10:35:00', '{"periodo":"2026-04"}',       'GENERADO');

INSERT INTO contenido_reporte (id, reporte_id, seccion, datos_json, orden) VALUES
(1, 1, 'totales_por_sucursal', '{"1":0,"2":286000,"3":176000,"4":94000}', 1),
(2, 1, 'ventas_estado',        '{"completadas":2,"pendientes":0,"anuladas":1}', 2),
(3, 2, 'inventario_critico',   '[{"branchId":4,"sku":"SKU-VAL-006","quantity":6,"minimumStock":10},{"branchId":4,"sku":"SKU-BAT-004","quantity":9,"minimumStock":12}]', 1),
(4, 2, 'valorizacion_total',   '{"monto":9047200}', 2),
(5, 3, 'resultados_periodo',   '[{"codigo":"KPI-001","estado":"CUMPLIDO"},{"codigo":"KPI-002","estado":"EN_RIESGO"},{"codigo":"KPI-003","estado":"EN_RIESGO"},{"codigo":"KPI-004","estado":"CRITICO"},{"codigo":"KPI-005","estado":"CUMPLIDO"}]', 1),
(6, 4, 'balance',              '{"income":462000,"expenses":171000,"profit":291000}', 1);
