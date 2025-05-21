-- Create the amazon_credentials table if it doesn't exist
CREATE TABLE IF NOT EXISTS amazon_credentials (
  id SERIAL PRIMARY KEY,
  store_id UUID NOT NULL,
  seller_id VARCHAR(50),
  client_id VARCHAR(100),
  client_secret VARCHAR(100),
  refresh_token TEXT,
  marketplace_id VARCHAR(50) DEFAULT 'ATVPDKIKX0DER', -- US marketplace
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index on store_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_amazon_credentials_store_id ON amazon_credentials(store_id);
