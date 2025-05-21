-- Script para unificar as tabelas stores e amazon_credentials
-- Este script migra os dados da tabela amazon_credentials para a tabela stores

-- 1. Adicionar colunas de credenciais da Amazon à tabela stores (se não existirem)
DO $$
BEGIN
    -- Verificar e adicionar amazon_seller_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'stores' AND column_name = 'amazon_seller_id') THEN
        ALTER TABLE stores ADD COLUMN amazon_seller_id TEXT;
    END IF;

    -- Verificar e adicionar amazon_client_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'stores' AND column_name = 'amazon_client_id') THEN
        ALTER TABLE stores ADD COLUMN amazon_client_id TEXT;
    END IF;

    -- Verificar e adicionar amazon_client_secret
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'stores' AND column_name = 'amazon_client_secret') THEN
        ALTER TABLE stores ADD COLUMN amazon_client_secret TEXT;
    END IF;

    -- Verificar e adicionar amazon_refresh_token
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'stores' AND column_name = 'amazon_refresh_token') THEN
        ALTER TABLE stores ADD COLUMN amazon_refresh_token TEXT;
    END IF;

    -- Verificar e adicionar amazon_marketplace_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'stores' AND column_name = 'amazon_marketplace_id') THEN
        ALTER TABLE stores ADD COLUMN amazon_marketplace_id TEXT;
    END IF;

    -- Verificar e adicionar amazon_credentials_updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'stores' AND column_name = 'amazon_credentials_updated_at') THEN
        ALTER TABLE stores ADD COLUMN amazon_credentials_updated_at TIMESTAMP;
    END IF;
END $$;

-- 2. Migrar dados da tabela amazon_credentials para a tabela stores
-- Primeiro, criar lojas faltantes para credenciais órfãs
INSERT INTO stores (id, name, description, is_active, has_amazon_credentials, has_amazon_credentials_attempted)
SELECT 
    ac.store_uuid, 
    'Loja Amazon ' || ac.seller_id, 
    'Loja criada automaticamente durante migração de credenciais',
    TRUE,
    TRUE,
    TRUE
FROM 
    amazon_credentials ac
WHERE 
    NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = ac.store_uuid)
AND
    ac.store_uuid IS NOT NULL;

-- Agora, atualizar as lojas existentes com os dados das credenciais
UPDATE stores s
SET 
    amazon_seller_id = ac.seller_id,
    amazon_client_id = ac.client_id,
    amazon_client_secret = ac.client_secret,
    amazon_refresh_token = ac.refresh_token,
    amazon_marketplace_id = ac.marketplace_id,
    amazon_credentials_updated_at = ac.updated_at,
    has_amazon_credentials = TRUE,
    has_amazon_credentials_attempted = TRUE
FROM 
    amazon_credentials ac
WHERE 
    s.id = ac.store_uuid;

-- 3. Criar uma view para compatibilidade com código legado (opcional)
CREATE OR REPLACE VIEW amazon_credentials_view AS
SELECT 
    id as store_uuid,
    CAST(('x' || substring(replace(id::text, '-', ''), 1, 8))::bit(32)::int % 1000000 AS INTEGER) as store_id,
    amazon_seller_id as seller_id,
    amazon_client_id as client_id,
    amazon_client_secret as client_secret,
    amazon_refresh_token as refresh_token,
    amazon_marketplace_id as marketplace_id,
    amazon_credentials_updated_at as updated_at
FROM 
    stores
WHERE 
    amazon_seller_id IS NOT NULL;

-- 4. Adicionar índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_stores_amazon_seller_id ON stores(amazon_seller_id) 
WHERE amazon_seller_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stores_amazon_client_id ON stores(amazon_client_id) 
WHERE amazon_client_id IS NOT NULL;

-- 5. Backup da tabela amazon_credentials antes de removê-la (opcional)
CREATE TABLE IF NOT EXISTS amazon_credentials_backup AS
SELECT * FROM amazon_credentials;

-- Não remover a tabela original até que tudo esteja funcionando corretamente
-- DROP TABLE amazon_credentials;