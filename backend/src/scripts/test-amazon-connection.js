/**
 * Script para testar a conexão com a Amazon e verificar o status das credenciais
 * 
 * Este script verifica se as credenciais da Amazon estão configuradas corretamente
 * e atualiza o status da loja de acordo.
 */

const { supabase } = require('../config/supabase');

async function testAmazonConnection() {
  try {
    console.log('Iniciando teste de conexão com a Amazon...');
    
    // Buscar todas as lojas
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, has_amazon_credentials, has_amazon_credentials_attempted');
    
    if (storesError) {
      console.error('Erro ao buscar lojas:', storesError);
      throw storesError;
    }
    
    console.log(`Encontradas ${stores.length} lojas:`);
    stores.forEach(store => {
      console.log(`- ${store.name} (${store.id}): has_amazon_credentials=${store.has_amazon_credentials}, has_amazon_credentials_attempted=${store.has_amazon_credentials_attempted}`);
    });
    
    // Buscar todas as credenciais da Amazon
    const { data: credentials, error: credentialsError } = await supabase
      .from('amazon_credentials')
      .select('*');
    
    if (credentialsError) {
      console.error('Erro ao buscar credenciais da Amazon:', credentialsError);
      throw credentialsError;
    }
    
    console.log(`\nEncontradas ${credentials.length} credenciais da Amazon:`);
    credentials.forEach(cred => {
      console.log(`- Store ID: ${cred.store_id}, Store UUID: ${cred.store_uuid}`);
    });
    
    // Para cada credencial, verificar se a loja correspondente está marcada como tendo credenciais
    console.log('\nVerificando status das lojas com credenciais...');
    
    for (const cred of credentials) {
      // Encontrar a loja correspondente
      const storeUuid = cred.store_uuid;
      const numericId = cred.store_id;
      
      // Buscar a loja pelo UUID
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, name, has_amazon_credentials, has_amazon_credentials_attempted')
        .eq('id', storeUuid)
        .single();
      
      if (storeError) {
        console.error(`Erro ao buscar loja com UUID ${storeUuid}:`, storeError);
        continue;
      }
      
      if (!store) {
        console.log(`Loja com UUID ${storeUuid} não encontrada`);
        continue;
      }
      
      console.log(`Loja: ${store.name} (${store.id})`);
      console.log(`- Status atual: has_amazon_credentials=${store.has_amazon_credentials}, has_amazon_credentials_attempted=${store.has_amazon_credentials_attempted}`);
      
      // Se a loja não estiver marcada como tendo credenciais, atualizá-la
      if (!store.has_amazon_credentials || !store.has_amazon_credentials_attempted) {
        console.log(`- Atualizando status da loja para has_amazon_credentials=true, has_amazon_credentials_attempted=true`);
        
        const { error: updateError } = await supabase
          .from('stores')
          .update({
            has_amazon_credentials: true,
            has_amazon_credentials_attempted: true
          })
          .eq('id', storeUuid);
        
        if (updateError) {
          console.error(`Erro ao atualizar status da loja ${store.name}:`, updateError);
        } else {
          console.log(`- Status da loja atualizado com sucesso!`);
        }
      } else {
        console.log(`- Status da loja já está correto`);
      }
    }
    
    console.log('\nTeste de conexão concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao testar conexão com a Amazon:', error);
    process.exit(1);
  }
}

// Executar a função principal
testAmazonConnection();