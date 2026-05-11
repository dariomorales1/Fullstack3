INSERT INTO ingested_data (id, source_service, raw_data, timestamp, status) VALUES
(1, 'ms-sales', '[
  {"id":1,"date":"2026-01-12T10:15:00","amount":125000.00,"branchId":1,"customerId":1,"paymentMethod":"TRANSFERENCIA","status":"COMPLETADA"},
  {"id":2,"date":"2026-01-18T16:20:00","amount":182000.00,"branchId":2,"customerId":2,"paymentMethod":"TARJETA","status":"COMPLETADA"},
  {"id":3,"date":"2026-02-07T12:10:00","amount":214000.00,"branchId":1,"customerId":3,"paymentMethod":"TRANSFERENCIA","status":"COMPLETADA"},
  {"id":4,"date":"2026-02-21T15:30:00","amount":148000.00,"branchId":3,"customerId":4,"paymentMethod":"TARJETA","status":"COMPLETADA"},
  {"id":5,"date":"2026-03-03T09:45:00","amount":265000.00,"branchId":2,"customerId":2,"paymentMethod":"TRANSFERENCIA","status":"COMPLETADA"},
  {"id":6,"date":"2026-03-15T11:25:00","amount":198000.00,"branchId":4,"customerId":5,"paymentMethod":"EFECTIVO","status":"PENDIENTE"},
  {"id":7,"date":"2026-03-26T17:40:00","amount":321000.00,"branchId":1,"customerId":1,"paymentMethod":"TRANSFERENCIA","status":"COMPLETADA"},
  {"id":8,"date":"2026-04-05T10:05:00","amount":286000.00,"branchId":2,"customerId":6,"paymentMethod":"TARJETA","status":"COMPLETADA"},
  {"id":9,"date":"2026-04-14T13:35:00","amount":176000.00,"branchId":3,"customerId":4,"paymentMethod":"EFECTIVO","status":"COMPLETADA"},
  {"id":10,"date":"2026-04-28T18:10:00","amount":94000.00,"branchId":4,"customerId":5,"paymentMethod":"TRANSFERENCIA","status":"ANULADA"}
]'::jsonb, '2026-05-06 10:15:00', 'SUCCESS'),
(2, 'ms-inventory', '[
  {"id":1,"sku":"SKU-AND-001","name":"Kit Seguridad Andina","category":"Seguridad","price":12500.00,"totalStock":191},
  {"id":2,"sku":"SKU-CAB-002","name":"Cableado Industrial","category":"Infraestructura","price":13000.00,"totalStock":200},
  {"id":3,"sku":"SKU-SEN-003","name":"Sensor Geotermico","category":"Sensores","price":10700.00,"totalStock":221},
  {"id":4,"sku":"SKU-BAT-004","name":"Bateria Respaldo 24V","category":"Energia","price":22000.00,"totalStock":103},
  {"id":5,"sku":"SKU-MON-005","name":"Monitor Operacional","category":"Monitoreo","price":16500.00,"totalStock":138},
  {"id":6,"sku":"SKU-VAL-006","name":"Valvula Control Inteligente","category":"Operacion","price":22000.00,"totalStock":85}
]'::jsonb, '2026-05-06 10:15:00', 'SUCCESS'),
(3, 'ms-finance', '[
  {"branchId":1,"period":"2026-Q1","income":660000.00,"expenses":120000.00,"profit":540000.00},
  {"branchId":2,"period":"2026-Q1","income":447000.00,"expenses":0.00,"profit":447000.00},
  {"branchId":3,"period":"2026-Q1","income":148000.00,"expenses":63000.00,"profit":85000.00},
  {"branchId":4,"period":"2026-Q1","income":198000.00,"expenses":145000.00,"profit":53000.00},
  {"branchId":2,"period":"2026-04","income":286000.00,"expenses":58000.00,"profit":228000.00},
  {"branchId":3,"period":"2026-04","income":176000.00,"expenses":0.00,"profit":176000.00}
]'::jsonb, '2026-05-06 10:15:00', 'SUCCESS'),
(4, 'ms-customer', '[
  {"id":1,"name":"Mineria Cordillera Norte","type":"CORPORATE","registrationDate":"2025-11-12T09:00:00"},
  {"id":2,"name":"Servicios Portuarios Valpo","type":"CORPORATE","registrationDate":"2025-12-03T10:20:00"},
  {"id":3,"name":"Energia Metropolitana SPA","type":"DISTRIBUTOR","registrationDate":"2026-01-05T08:45:00"},
  {"id":4,"name":"Ingenieria Biobio Limitada","type":"CORPORATE","registrationDate":"2026-01-22T15:10:00"},
  {"id":5,"name":"Operaciones del Norte SA","type":"CORPORATE","registrationDate":"2026-02-10T11:30:00"},
  {"id":6,"name":"Red Comercial Pacifico","type":"RETAIL","registrationDate":"2026-03-18T16:00:00"}
]'::jsonb, '2026-05-06 10:15:00', 'SUCCESS');

INSERT INTO ingestion_log (id, execution_date, records_processed, errors, source_service, status) VALUES
(1, '2026-05-06 10:15:00', 1, 0, 'ms-sales',     'SUCCESS'),
(2, '2026-05-06 10:15:00', 1, 0, 'ms-inventory', 'SUCCESS'),
(3, '2026-05-06 10:15:00', 1, 0, 'ms-finance',   'SUCCESS'),
(4, '2026-05-06 10:15:00', 1, 0, 'ms-customer',  'SUCCESS');
