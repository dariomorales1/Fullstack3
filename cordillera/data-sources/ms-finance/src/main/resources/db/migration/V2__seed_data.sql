INSERT INTO movement (id, type, amount, date, branch_id, description, category) VALUES
(1,  'INGRESO', 125000.00, '2026-01-12 10:30:00', 1, 'Venta operacional Santiago',      'VENTAS'),
(2,  'INGRESO', 182000.00, '2026-01-18 16:35:00', 2, 'Venta operacional Valparaiso',    'VENTAS'),
(3,  'EGRESO',   54000.00, '2026-01-29 09:00:00', 4, 'Compra urgente de repuestos',     'ABASTECIMIENTO'),
(4,  'INGRESO', 214000.00, '2026-02-07 12:25:00', 1, 'Venta corporativa Santiago',      'VENTAS'),
(5,  'INGRESO', 148000.00, '2026-02-21 15:45:00', 3, 'Venta operativa Concepcion',      'VENTAS'),
(6,  'EGRESO',   63000.00, '2026-02-25 11:10:00', 3, 'Mantencion equipos sucursal',     'MANTENCION'),
(7,  'INGRESO', 265000.00, '2026-03-03 10:00:00', 2, 'Venta corporativa Valparaiso',    'VENTAS'),
(8,  'INGRESO', 198000.00, '2026-03-15 11:40:00', 4, 'Venta Antofagasta en proceso',    'VENTAS'),
(9,  'INGRESO', 321000.00, '2026-03-26 17:55:00', 1, 'Venta consolidada Santiago',      'VENTAS'),
(10, 'EGRESO',   91000.00, '2026-03-27 08:20:00', 4, 'Regularizacion logistica norte',  'LOGISTICA'),
(11, 'INGRESO', 286000.00, '2026-04-05 10:20:00', 2, 'Venta Abril Valparaiso',          'VENTAS'),
(12, 'INGRESO', 176000.00, '2026-04-14 13:50:00', 3, 'Venta Abril Concepcion',          'VENTAS'),
(13, 'EGRESO',   72000.00, '2026-04-18 09:10:00', 1, 'Recambio de sensores',            'MANTENCION'),
(14, 'EGRESO',   58000.00, '2026-04-22 14:30:00', 2, 'Reposicion de stock critico',     'ABASTECIMIENTO'),
(15, 'EGRESO',   41000.00, '2026-04-28 18:25:00', 4, 'Anulacion parcial y costos',      'AJUSTE');

INSERT INTO balance (id, branch_id, period, income, expenses, profit) VALUES
(1, 1, '2026-Q1', 660000.00, 120000.00, 540000.00),
(2, 2, '2026-Q1', 447000.00, 0.00,      447000.00),
(3, 3, '2026-Q1', 148000.00, 63000.00,   85000.00),
(4, 4, '2026-Q1', 198000.00, 145000.00,  53000.00),
(5, 1, '2026-04',      0.00, 72000.00,  -72000.00),
(6, 2, '2026-04', 286000.00, 58000.00,  228000.00),
(7, 3, '2026-04', 176000.00,     0.00,  176000.00),
(8, 4, '2026-04',      0.00, 41000.00,  -41000.00);
