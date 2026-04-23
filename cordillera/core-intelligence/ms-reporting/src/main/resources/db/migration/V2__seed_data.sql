INSERT INTO reporte (tipo, titulo, fecha_generacion, parametros, estado) VALUES
('VENTAS_POR_SUCURSAL',     'Reporte seed de ventas por sucursal',  '2026-04-01 08:00:00', '{"periodo":"2026-03"}',   'GENERADO'),
('INVENTARIO_CONSOLIDADO',  'Reporte seed consolidado inventario',  '2026-04-02 08:30:00', '{}',                       'GENERADO'),
('KPI_MENSUAL',             'Reporte seed KPI mensual',             '2026-04-05 09:00:00', '{"periodoId":3}',          'GENERADO'),
('BALANCE_FINANCIERO',      'Reporte seed balance financiero',      '2026-04-10 10:15:00', '{"trimestre":"2026-Q1"}',  'GENERADO');

INSERT INTO contenido_reporte (reporte_id, seccion, datos_json, orden) VALUES
(1, 'totales_por_sucursal', '{"1":150000,"2":320000,"3":210000}',                               1),
(2, 'inventario_raw',       '[{"sku":"SKU-1","stock":50},{"sku":"SKU-2","stock":120}]',         1),
(3, 'indicadores',          '[{"codigo":"KPI-001","tipo":"PORCENTUAL"}]',                       1),
(3, 'resultados_periodo',   '[{"indicadorId":1,"valorReal":80,"estado":"EN_RIESGO"}]',          2),
(4, 'balance',              '{"ingresos":5000000,"egresos":3200000,"utilidad":1800000}',         1);
