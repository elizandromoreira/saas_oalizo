# Refatoração das Credenciais da Amazon

Este documento descreve a refatoração realizada para unificar as tabelas `stores` e `amazon_credentials`, simplificando o sistema e eliminando problemas de consistência.

## Problema

O sistema original utilizava duas tabelas separadas:
- `stores`: Armazenava informações gerais das lojas
- `amazon_credentials`: Armazenava credenciais da Amazon

Esta separação causava vários problemas:
1. **Inconsistência de dados**: Era possível ter credenciais sem lojas correspondentes
2. **Complexidade desnecessária**: Conversão de UUID para ID numérico
3. **Joins frequentes**: Impacto na performance
4. **Manutenção difícil**: Necessidade de sincronizar flags como `has_amazon_credentials`

## Solução

A solução implementada unifica as tabelas, movendo todas as informações de credenciais da Amazon para a tabela `stores`:

```sql
-- Exemplo simplificado da estrutura unificada
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Campos de credenciais da Amazon
  amazon_seller_id TEXT,
  amazon_client_id TEXT,
  amazon_client_secret TEXT,
  amazon_refresh_token TEXT,
  amazon_marketplace_id TEXT,
  amazon_credentials_updated_at TIMESTAMP,
  
  -- Outros campos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Arquivos Criados/Modificados

1. **SQL de Migração**:
   - `src/sql/unify-stores-amazon-credentials.sql`: Script SQL para migrar os dados e unificar as tabelas

2. **Script de Migração**:
   - `src/scripts/migrate-amazon-credentials.js`: Script para executar a migração e verificar os resultados

3. **Serviço Atualizado**:
   - `src/services/amazon.service.js`: Atualizado para trabalhar com a nova estrutura unificada

4. **Controlador Atualizado**:
   - `src/controllers/amazon-credentials.controller.js`: Atualizado para trabalhar com a nova estrutura

5. **Script de Teste Atualizado**:
   - `src/scripts/test-amazon-auth.js`: Atualizado para verificar credenciais na nova estrutura

## Como Executar a Migração

1. **Backup do Banco de Dados**:
   Antes de executar a migração, faça um backup do banco de dados para garantir que você possa reverter se necessário.

2. **Executar o Script de Migração**:
   ```bash
   cd amazon-store-saas/backend
   node src/scripts/migrate-amazon-credentials.js
   ```

3. **Verificar os Resultados**:
   O script exibirá informações detalhadas sobre o resultado da migração, incluindo:
   - Colunas adicionadas à tabela `stores`
   - Lojas com credenciais migradas
   - Criação da view de compatibilidade

4. **Testar a Conexão**:
   Após a migração, teste a conexão com a Amazon usando o script atualizado:
   ```bash
   node src/scripts/test-amazon-auth.js
   ```

## Benefícios da Refatoração

1. **Simplicidade**: Sem necessidade de joins ou conversão de IDs
2. **Integridade garantida**: Não é possível ter credenciais sem loja
3. **Consultas mais eficientes**: Todos os dados em uma única tabela
4. **Manutenção mais fácil**: Menos código para gerenciar a relação entre entidades

## Compatibilidade com Código Legado

Para manter a compatibilidade com código legado que ainda possa estar usando a tabela `amazon_credentials`, foi criada uma view:

```sql
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
```

Esta view permite que o código existente continue funcionando sem modificações, enquanto a migração para a nova estrutura é realizada gradualmente.

## Próximos Passos

1. **Remover a Tabela Original**:
   Após confirmar que tudo está funcionando corretamente, você pode remover a tabela `amazon_credentials` original:
   ```sql
   DROP TABLE amazon_credentials;
   ```

2. **Atualizar Outros Componentes**:
   Verifique e atualize outros componentes do sistema que possam estar usando diretamente a tabela `amazon_credentials`.

3. **Remover Código Legado**:
   Remova qualquer código de conversão de UUID para ID numérico que não seja mais necessário.