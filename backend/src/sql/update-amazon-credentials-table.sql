-- Check if the amazon_credentials table exists
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'amazon_credentials'
  ) INTO table_exists;
  
  IF table_exists THEN
    -- Table exists, so we'll update it
    
    -- First, create a temporary table with the new structure
    CREATE TABLE amazon_credentials_temp (
      id SERIAL PRIMARY KEY,
      store_id INTEGER NOT NULL, -- Changed from UUID/VARCHAR to INTEGER
      seller_id VARCHAR(50),
      client_id VARCHAR(100),
      client_secret VARCHAR(100),
      refresh_token TEXT,
      marketplace_id VARCHAR(50),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    
    -- Copy data from the old table to the new one, converting store_id to sequential numbers
    INSERT INTO amazon_credentials_temp (
      store_id, 
      seller_id, 
      client_id, 
      client_secret, 
      refresh_token, 
      marketplace_id, 
      updated_at
    )
    SELECT 
      ROW_NUMBER() OVER (ORDER BY id), -- Generate sequential numbers for store_id
      seller_id, 
      client_id, 
      client_secret, 
      refresh_token, 
      marketplace_id, 
      COALESCE(updated_at, CURRENT_TIMESTAMP)
    FROM amazon_credentials;
    
    -- Drop the old table
    DROP TABLE amazon_credentials;
    
    -- Rename the temporary table to the original name
    ALTER TABLE amazon_credentials_temp RENAME TO amazon_credentials;
    
    -- Create an index on store_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_amazon_credentials_store_id ON amazon_credentials(store_id);
    
    RAISE NOTICE 'Successfully updated amazon_credentials table';
  ELSE
    -- Table doesn't exist, so we'll create it from scratch
    CREATE TABLE amazon_credentials (
      id SERIAL PRIMARY KEY,
      store_id INTEGER NOT NULL,
      seller_id VARCHAR(50),
      client_id VARCHAR(100),
      client_secret VARCHAR(100),
      refresh_token TEXT,
      marketplace_id VARCHAR(50) DEFAULT 'ATVPDKIKX0DER', -- US marketplace
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    
    -- Create an index on store_id for faster lookups
    CREATE INDEX idx_amazon_credentials_store_id ON amazon_credentials(store_id);
    
    RAISE NOTICE 'Created new amazon_credentials table';
  END IF;
END $$;
