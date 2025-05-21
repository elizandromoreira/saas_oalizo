-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS boolean AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = $1
    AND column_name = $2
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
RETURNS boolean AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = $1
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql;
