/**
 * Script para verificar o status da loja
 * 
 * Este script verifica se a loja existe e se tem as colunas de credenciais da Amazon.
 */

const { supabase, supabaseAdmin } = require('../config/supabase');

async function checkStoreStatus() {
  try {
    console.log('Verificando status da loja...');
    
    // Buscar todas as lojas usando supabaseAdmin (ignora RLS)
    console.log('Buscando todas as lojas...');
    const { data: stores, error: storesError } = await supabaseAdmin
      .from('stores')
      .select('*');
    
    if (storesError) {
      console.error('Erro ao buscar lojas:', storesError);
      throw storesError;
    }
    
    console.log(`Encontradas ${stores.length} lojas:`);
    stores.forEach(store => {
      console.log(`- ID: ${store.id}`);
      console.log(`  Nome: ${store.name}`);
      console.log(`  Descrição: ${store.description}`);
      console.log(`  Ativo: ${store.is_active}`);
      console.log(`  Tem credenciais da Amazon: ${store.has_amazon_credentials}`);
      console.log(`  Tentou configurar credenciais: ${store.has_amazon_credentials_attempted}`);
      console.log(`  Criado em: ${store.created_at}`);
      console.log(`  Atualizado em: ${store.updated_at}`);
      console.log('---');
    });
    
    // Buscar todos os acessos de usuários às lojas
    console.log('\nBuscando acessos de usuários às lojas...');
    const { data: accesses, error: accessesError } = await supabaseAdmin
      .from('user_store_access')
      .select('*');
    
    if (accessesError) {
      console.error('Erro ao buscar acessos:', accessesError);
      throw accessesError;
    }
    
    console.log(`Encontrados ${accesses.length} acessos:`);
    accesses.forEach(access => {
      console.log(`- ID: ${access.id}`);
      console.log(`  Usuário: ${access.user_id}`);
      console.log(`  Loja: ${access.store_id}`);
      console.log(`  Função: ${access.role}`);
      console.log(`  Primário: ${access.is_primary}`);
      console.log(`  Criado em: ${access.created_at}`);
      console.log('---');
    });
    
    // Buscar todas as credenciais da Amazon
    console.log('\nBuscando credenciais da Amazon...');
    const { data: credentials, error: credentialsError } = await supabaseAdmin
      .from('amazon_credentials')
      .select('*');
    
    if (credentialsError) {
      console.error('Erro ao buscar credenciais:', credentialsError);
      throw credentialsError;
    }
    
    console.log(`Encontradas ${credentials.length} credenciais:`);
    credentials.forEach(cred => {
      console.log(`- ID: ${cred.id}`);
      console.log(`  Store ID: ${cred.store_id}`);
      console.log(`  Store UUID: ${cred.store_uuid}`);
      console.log(`  Seller ID: ${cred.seller_id}`);
      console.log(`  Client ID: ${cred.client_id}`);
      console.log(`  Marketplace ID: ${cred.marketplace_id}`);
      console.log(`  Atualizado em: ${cred.updated_at}`);
      console.log('---');
    });
    
    console.log('\nVerificação de status concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao verificar status da loja:', error);
    process.exit(1);
  }
}

// Executar a função principal
checkStoreStatus();