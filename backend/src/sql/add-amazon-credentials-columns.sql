-- Adiciona colunas para rastrear o status das credenciais da Amazon na tabela stores
-- Verifica se as colunas já existem antes de adicioná-las

DO $$
BEGIN
    -- Verifica se a coluna has_amazon_credentials existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'stores'
        AND column_name = 'has_amazon_credentials'
    ) THEN
        -- Adiciona a coluna has_amazon_credentials
        ALTER TABLE stores
        ADD COLUMN has_amazon_credentials BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Coluna has_amazon_credentials adicionada à tabela stores';
    ELSE
        RAISE NOTICE 'Coluna has_amazon_credentials já existe na tabela stores';
    END IF;
    
    -- Verifica se a coluna has_amazon_credentials_attempted existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'stores'
        AND column_name = 'has_amazon_credentials_attempted'
    ) THEN
        -- Adiciona a coluna has_amazon_credentials_attempted
        ALTER TABLE stores
        ADD COLUMN has_amazon_credentials_attempted BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Coluna has_amazon_credentials_attempted adicionada à tabela stores';
    ELSE
        RAISE NOTICE 'Coluna has_amazon_credentials_attempted já existe na tabela stores';
    END IF;
    
    -- Atualiza as colunas para todas as lojas que já têm credenciais da Amazon
    -- Isso garante que as lojas existentes com credenciais sejam marcadas corretamente
    UPDATE stores s
    SET 
        has_amazon_credentials = TRUE,
        has_amazon_credentials_attempted = TRUE
    FROM amazon_credentials ac
    WHERE ac.store_uuid = s.id::text
    OR ac.store_id = (
        -- Usa a mesma lógica de conversão do controlador
        (('x' || substring(replace(s.id::text, '-', ''), 1, 8))::bit(32)::int % 1000000)
    );
    
    RAISE NOTICE 'Status das credenciais da Amazon atualizado para lojas existentes';
END $$;