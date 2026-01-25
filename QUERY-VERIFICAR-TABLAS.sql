-- Query para verificar tablas en Railway Query
-- Copia y pega esto en Railway → Database → Query

-- 1. Ver todas las tablas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Contar cuántas tablas hay
SELECT COUNT(*) as total_tablas
FROM pg_tables 
WHERE schemaname = 'public';

-- 3. Ver estructura de Customer (ejemplo)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'Customer'
ORDER BY ordinal_position;

-- 4. Ver estructura de Ticket (ejemplo)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'Ticket'
ORDER BY ordinal_position;
