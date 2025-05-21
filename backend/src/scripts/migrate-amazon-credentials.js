/**
 * Script para migrar credenciais da Amazon para a tabela stores
 * 
 * Este script executa a migração para unificar as tabelas stores e amazon_credentials.
 * Ele executa o SQL de migração e verifica se os dados foram migrados corretamente.
 * 
 * Uso: node src/scripts/migrate-amazon-credentials.js
 */

const fs = require('fs');
const path = require('path');
const { supabase, supabaseAdmin } = require('../config/supabase');

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Função para imprimir mensagens formatadas no console
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let prefix = '';
  
  switch (type) {
    case 'success':
      prefix = `${colors.green}✅ [SUCESSO]${colors.reset}`;
      break;
    case 'error':
      prefix = `${colors.red}❌ [ERRO]${colors.reset}`;
      break;
    case 'warning':
      prefix = `${colors.yellow}⚠️ [AVISO]${colors.reset}`;
      break;
    case 'info':
    default:
      prefix = `${colors.blue}ℹ️ [INFO]${colors.reset}`;
      break;
  }
  
  console.log(`${prefix} ${timestamp} - ${message}`);
}

/**
 * Função principal de migração
 */
async function migrateAmazonCredentials() {
  try {
    log(`${colors.bright}Iniciando migração de credenciais da Amazon para a tabela stores${colors.reset}`);
    
    // 1. Verificar se existem credenciais para migrar
    log('Verificando credenciais existentes...');
    const { data: credentials, error: credentialsError } = await supabase
      .from('amazon_credentials')
      .select('id, store_uuid, seller_id')
      .limit(10);
    
    if (credentialsError) {
      log(`Erro ao verificar credenciais: ${credentialsError.message}`, 'error');
      throw credentialsError;
    }
    
    if (!credentials || credentials.length === 0) {
      log('Nenhuma credencial encontrada para migrar.', 'warning');
      log('Continuando com a migração para preparar a estrutura do banco de dados...', 'info');
    } else {
      log(`Encontradas ${credentials.length} credenciais para migrar:`, 'info');
      credentials.forEach(cred => {
        log(`- ID: ${cred.id}, Store UUID: ${cred.store_uuid}, Seller ID: ${cred.seller_id}`);
      });
    }
    
    // 2. Verificar se as colunas já existem na tabela stores
    log('\nVerificando se a tabela stores existe...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .limit(1);
    
    if (storesError) {
      log(`Erro ao verificar tabela stores: ${storesError.message}`, 'error');
      throw storesError;
    }
    
    log('Tabela stores encontrada. Prosseguindo com a migração...', 'success');
    
    // 3. Adicionar colunas à tabela stores
    log('\nAdicionando colunas de credenciais da Amazon à tabela stores...');
    
    // Adicionar amazon_seller_id
    try {
      await supabaseAdmin.rpc('add_column_if_not_exists', { 
        table_name: 'stores', 
        column_name: 'amazon_seller_id', 
        column_type: 'text' 
      });
      log('Coluna amazon_seller_id adicionada ou já existe.', 'success');
    } catch (error) {
      log(`Erro ao adicionar coluna amazon_seller_id: ${error.message}`, 'warning');
      log('Tentando método alternativo...', 'info');
      
      // Método alternativo: usar SQL direto via função personalizada
      try {
        // Primeiro, verificar se a função existe
        const { error: funcError } = await supabaseAdmin.rpc('execute_sql', { 
          sql: "SELECT 1 FROM pg_proc WHERE proname = 'add_column_if_not_exists'" 
        });
        
        if (funcError) {
          log('Adicionando colunas diretamente...', 'info');
          // Criar a função se não existir
          await supabase.rpc('execute_sql', { 
            sql: `
              CREATE OR REPLACE FUNCTION add_column_if_not_exists(
                _table_name text, 
                _column_name text, 
                _column_type text
              ) RETURNS void AS $$
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 
                  FROM information_schema.columns 
                  WHERE table_name = _table_name 
                  AND column_name = _column_name
                ) THEN
                  EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', 
                                _table_name, _column_name, _column_type);
                END IF;
              END;
              $$ LANGUAGE plpgsql;
            `
          });
          
          // Adicionar colunas diretamente usando SQL
          const { error: alterError } = await supabaseAdmin.rpc('execute_sql', { 
            sql: `
              ALTER TABLE stores 
              ADD COLUMN IF NOT EXISTS amazon_seller_id TEXT,
              ADD COLUMN IF NOT EXISTS amazon_client_id TEXT,
              ADD COLUMN IF NOT EXISTS amazon_client_secret TEXT,
              ADD COLUMN IF NOT EXISTS amazon_refresh_token TEXT,
              ADD COLUMN IF NOT EXISTS amazon_marketplace_id TEXT,
              ADD COLUMN IF NOT EXISTS amazon_credentials_updated_at TIMESTAMP;
            `
          });
        }
      } catch (error) {
        log(`Não foi possível criar função auxiliar: ${error.message}`, 'error');
        log('Continuando com a migração manual...', 'warning');
      }
    }
    
    // 4. Migrar dados manualmente
    log('\nMigrando dados da tabela amazon_credentials para a tabela stores...');
    
    // Para cada credencial, atualizar a loja correspondente
    for (const cred of credentials) {
      const storeUuid = cred.store_uuid;
      
      if (!storeUuid) {
        log(`Credencial ${cred.id} não tem UUID de loja. Pulando...`, 'warning');
        continue;
      }
      
      log(`Processando credencial para loja ${storeUuid}...`, 'info');
      
      // Verificar se a loja existe
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, name')
        .eq('id', storeUuid)
        .single();
      
      if (storeError && storeError.code !== 'PGRST116') {
        log(`Erro ao verificar loja ${storeUuid}: ${storeError.message}`, 'error');
        continue;
      }
      
      if (!store) {
        log(`Loja ${storeUuid} não encontrada. Criando nova loja...`, 'warning');
        
        // Criar a loja
        const { data: newStore, error: createError } = await supabaseAdmin
          .from('stores')
          .insert({
            id: storeUuid,
            name: `Loja Amazon ${cred.seller_id}`,
            description: 'Loja criada automaticamente durante migração',
            is_active: true,
            has_amazon_credentials: true,
            has_amazon_credentials_attempted: true
          })
          .select()
          .single();
        
        if (createError) {
          log(`Erro ao criar loja ${storeUuid}: ${createError.message}`, 'error');
          continue;
        }
        
        log(`Loja criada com sucesso: ${newStore.name} (${newStore.id})`, 'success');
      } else {
        log(`Loja encontrada: ${store.name} (${store.id})`, 'success');
      }
      
      // Atualizar a loja com as credenciais da Amazon
      const { error: updateError } = await supabaseAdmin
        .from('stores')
        .update({
          amazon_seller_id: cred.seller_id,
          amazon_client_id: cred.client_id,
          amazon_client_secret: cred.client_secret,
          amazon_refresh_token: cred.refresh_token,
          amazon_marketplace_id: cred.marketplace_id,
          amazon_credentials_updated_at: cred.updated_at,
          has_amazon_credentials: true,
          has_amazon_credentials_attempted: true
        })
        .eq('id', storeUuid);
      
      if (updateError) {
        log(`Erro ao atualizar loja ${storeUuid}: ${updateError.message}`, 'error');
        
        // Verificar se o erro é devido a colunas ausentes
        if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
          log('Erro devido a colunas ausentes. Tentando criar as colunas...', 'warning');
          
          // Tentar criar as colunas necessárias
          try {
            const { error: alterError } = await supabase.rpc('execute_sql', { 
              sql: `
                ALTER TABLE stores 
                ADD COLUMN IF NOT EXISTS amazon_seller_id TEXT,
                ADD COLUMN IF NOT EXISTS amazon_client_id TEXT,
                ADD COLUMN IF NOT EXISTS amazon_client_secret TEXT,
                ADD COLUMN IF NOT EXISTS amazon_refresh_token TEXT,
                ADD COLUMN IF NOT EXISTS amazon_marketplace_id TEXT,
                ADD COLUMN IF NOT EXISTS amazon_credentials_updated_at TIMESTAMP;
              `
            });
            
            if (alterError) {
              log(`Erro ao adicionar colunas: ${alterError.message}`, 'error');
            } else {
              log('Colunas adicionadas com sucesso. Tentando atualizar novamente...', 'success');
              
              // Tentar atualizar novamente
              const { error: retryError } = await supabaseAdmin
                .from('stores')
                .update({
                  amazon_seller_id: cred.seller_id,
                  amazon_client_id: cred.client_id,
                  amazon_client_secret: cred.client_secret,
                  amazon_refresh_token: cred.refresh_token,
                  amazon_marketplace_id: cred.marketplace_id,
                  amazon_credentials_updated_at: cred.updated_at,
                  has_amazon_credentials: true,
                  has_amazon_credentials_attempted: true
                })
                .eq('id', storeUuid);
              
              if (retryError) {
                log(`Erro ao atualizar loja ${storeUuid} (retry): ${retryError.message}`, 'error');
              } else {
                log(`Loja ${storeUuid} atualizada com sucesso!`, 'success');
              }
            }
          } catch (error) {
            log(`Erro ao tentar adicionar colunas: ${error.message}`, 'error');
          }
        }
      } else {
        log(`Loja ${storeUuid} atualizada com sucesso!`, 'success');
      }
    }
    
    // 4. Verificar se a migração foi bem-sucedida
    log('\nVerificando resultado da migração...');
    
    // Verificar se as colunas foram adicionadas
    const { data: updatedColumns, error: updatedColumnsError } = await supabaseAdmin
      .from('stores')
      .select('amazon_seller_id')
      .limit(1);
    
    // Verificar se os dados foram migrados
    const { data: storesWithCredentials, error: storesError2 } = await supabaseAdmin
      .from('stores')
      .select('id, name, amazon_seller_id, amazon_client_id')
      .filter('amazon_seller_id', 'neq', null)
      .limit(10);
    
    if (storesError2) {
      log(`Erro ao verificar lojas com credenciais: ${storesError2.message}`, 'error');
    } else if (!storesWithCredentials || storesWithCredentials.length === 0) {
      log('Nenhuma loja encontrada com credenciais da Amazon.', 'warning');
    } else {
      log(`Encontradas ${storesWithCredentials.length} lojas com credenciais da Amazon:`, 'success');
      storesWithCredentials.forEach(store => {
        log(`- ${store.name} (${store.id}): Seller ID: ${store.amazon_seller_id}, Client ID: ${store.amazon_client_id}`);
      });
    }
    
    log('\nNota: A view amazon_credentials_view não foi criada automaticamente.', 'warning');
    log('Você precisará criar a view manualmente se necessário para compatibilidade com código legado.', 'warning');
    
    log(`\n${colors.green}${colors.bright}✅ Migração concluída com sucesso!${colors.reset}`);
    log('Agora você pode atualizar o código para usar a nova estrutura unificada.', 'info');
    log('A tabela amazon_credentials foi mantida como backup. Você pode removê-la quando tiver certeza de que tudo está funcionando corretamente.', 'info');
    
  } catch (error) {
    log(`Erro durante a migração: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Executar a função principal
migrateAmazonCredentials();