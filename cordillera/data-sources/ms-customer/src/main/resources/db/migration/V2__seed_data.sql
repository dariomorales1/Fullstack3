INSERT INTO customer (id, rut, name, email, phone, type, registration_date) VALUES
(1, '76.123.456-1', 'Mineria Cordillera Norte',     'compras@cordilleranorte.cl',   '+56 2 2400 1001', 'CORPORATE',   '2025-11-12 09:00:00'),
(2, '77.234.567-2', 'Servicios Portuarios Valpo',   'abastecimiento@spv.cl',        '+56 32 251 4400', 'CORPORATE',   '2025-12-03 10:20:00'),
(3, '78.345.678-3', 'Energia Metropolitana SPA',    'operaciones@emspa.cl',         '+56 2 2765 8830', 'DISTRIBUTOR', '2026-01-05 08:45:00'),
(4, '79.456.789-4', 'Ingenieria Biobio Limitada',   'contacto@ibiobio.cl',          '+56 41 222 1100', 'CORPORATE',   '2026-01-22 15:10:00'),
(5, '80.567.890-5', 'Operaciones del Norte SA',     'contratos@odn.cl',             '+56 55 245 7788', 'CORPORATE',   '2026-02-10 11:30:00'),
(6, '81.678.901-6', 'Red Comercial Pacifico',       'ventas@rcpacifico.cl',         '+56 32 299 3140', 'RETAIL',      '2026-03-18 16:00:00');

INSERT INTO contact (id, customer_id, name, position, email, phone) VALUES
(1, 1, 'Paula Rojas',    'Jefa de Compras',    'paula.rojas@cordilleranorte.cl', '+56 9 8888 1001'),
(2, 2, 'Luis Vergara',   'Encargado Supply',   'luis.vergara@spv.cl',            '+56 9 8888 1002'),
(3, 3, 'Camila Soto',    'Coordinadora Ops',   'camila.soto@emspa.cl',           '+56 9 8888 1003'),
(4, 4, 'Jorge Mella',    'Gerente Comercial',  'jorge.mella@ibiobio.cl',         '+56 9 8888 1004'),
(5, 5, 'Daniela Nuñez',  'Analista Contratos', 'daniela.nunez@odn.cl',           '+56 9 8888 1005'),
(6, 6, 'Matias Pizarro', 'Supervisor Retail',  'matias.pizarro@rcpacifico.cl',   '+56 9 8888 1006');
