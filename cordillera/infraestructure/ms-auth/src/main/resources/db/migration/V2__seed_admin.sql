-- Password: Admin1234!
INSERT INTO users (email, password_hash, role, activo) VALUES
('admin@cordillera.cl', '$2a$10$GOBewXql8TOJ7nLTNua38uAIIcTZVQseqgkapQ4/2Jr8OIZZpgdUa', 'ADMIN', true),
('usuario@cordillera.cl', '$2a$10$GOBewXql8TOJ7nLTNua38uAIIcTZVQseqgkapQ4/2Jr8OIZZpgdUa', 'USER', true)
ON CONFLICT (email) DO NOTHING;
