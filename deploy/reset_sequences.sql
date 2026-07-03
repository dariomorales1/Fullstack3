-- Resincroniza todas las secuencias (SERIAL/IDENTITY) de la base de datos actual
-- con el MAX(id) real de cada tabla. Necesario tras seeds con IDs explicitos via Flyway.
--
-- Uso (desde el bastion EC2-1, que tiene acceso a RDS por el Security Group):
--   docker run --rm -e PGPASSWORD='<password>' -v $(pwd)/reset_sequences.sql:/reset_sequences.sql postgres:16-alpine \
--     psql -h <rds-endpoint> -U cordillera_admin -d <nombre_db> -f /reset_sequences.sql
--
-- Repetir por cada base: db_auth, db_sales, db_inventory, db_finance, db_customer,
-- db_ingestion, db_kpis, db_reporting

DO $$
DECLARE
    r RECORD;
    max_id BIGINT;
BEGIN
    FOR r IN
        SELECT
            t.relname AS table_name,
            a.attname AS column_name,
            s.relname AS sequence_name
        FROM pg_class s
        JOIN pg_depend d ON d.objid = s.oid AND d.classid = 'pg_class'::regclass AND d.refclassid = 'pg_class'::regclass
        JOIN pg_class t ON t.oid = d.refobjid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
        WHERE s.relkind = 'S'
    LOOP
        EXECUTE format('SELECT MAX(%I) FROM %I', r.column_name, r.table_name) INTO max_id;
        PERFORM setval(format('%I', r.sequence_name)::regclass, COALESCE(max_id, 1), max_id IS NOT NULL);
        RAISE NOTICE 'Reset % (col %) -> max_id=%', r.sequence_name, r.column_name, max_id;
    END LOOP;
END $$;
