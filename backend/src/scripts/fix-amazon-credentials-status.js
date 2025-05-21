/**
 * Script para corrigir o status das credenciais da Amazon nas lojas
 * 
 * Este script verifica se existem credenciais da Amazon para cada loja
 * e atualiza o status da loja de acordo.
 */

const { supabase } = require('../config/supabase');

async function fixAmazonCredentialsStatus() {
  try {
    console.log('Iniciando correção do status das credenciais da Amazon...');
    
    // Verificar se as colunas existem na tabela stores
    try {
      console.log('Verificando se as colunas existem na tabela stores...');
      
      // Tentar adicionar as colunas se não existirem
      await supabase.rpc('execute_sql', {
        sql: `
          ALTER TABLE stores 
          ADD COLUMN IF NOT EXISTS has_amazon_credentials BOOLEAN DEFAULT FALSE;
          
          ALTER TABLE stores 
          ADD COLUMN IF NOT EXISTS has_amazon_credentials_attempted BOOLEAN DEFAULT FALSE;
        `
      });
      
      console.log('Colunas verificadas/adicionadas com sucesso');
    } catch (error) {
      console.error('Erro ao verificar/adicionar colunas:', error);
      console.log('Continuando com o script...');
    }
    
    // Buscar todas as lojas
    console.log('Buscando todas as lojas...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name');
    
    if (storesError) {
      console.error('Erro ao buscar lojas:', storesError);
      throw storesError;
    }
    
    console.log(`Encontradas ${stores.length} lojas`);
    
    // Para cada loja, verificar se existem credenciais da Amazon
    for (const store of stores) {
      console.log(`\nProcessando loja: ${store.name} (${store.id})`);
      
      // Converter UUID para ID numérico (mesma lógica do controlador)
      const numericId = parseInt(store.id.replace(/-/g, '').substring(0, 8), 16) % 1000000;
      console.log(`ID numérico calculado: ${numericId}`);
      
      // Verificar se existem credenciais para esta loja
      const { data: credentials, error: credentialsError } = await supabase
        .from('amazon_credentials')
        .select('id')
        .eq('store_id', numericId);
      
      if (credentialsError) {
        console.error(`Erro ao verificar credenciais para loja ${store.name}:`, credentialsError);
        continue;
      }
      
      const hasCredentials = credentials && credentials.length > 0;
      console.log(`Credenciais encontradas: ${hasCredentials ? 'Sim' : 'Não'}`);
      
      // Atualizar o status da loja
      console.log(`Atualizando status da loja para has_amazon_credentials=${hasCredentials}, has_amazon_credentials_attempted=true`);
      
      const { error: updateError } = await supabase
        .from('stores')
        .update({
          has_amazon_credentials: hasCredentials,
          has_amazon_credentials_attempted: true
        })
        .eq('id', store.id);
      
      if (updateError) {
        console.error(`Erro ao atualizar status da loja ${store.name}:`, updateError);
      } else {
        console.log(`Status da loja ${store.name} atualizado com sucesso`);
      }
    }
    
    console.log('\nCorreção do status das credenciais da Amazon concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao corrigir status das credenciais:', error);
    process.exit(1);
  }
}

// Executar a função principal
fixAmazonCredentialsStatus();