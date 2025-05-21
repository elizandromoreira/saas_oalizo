/**
 * Script para criar uma loja que está faltando
 * 
 * Este script verifica se existem credenciais da Amazon sem lojas correspondentes
 * e cria as lojas faltantes.
 */

const { supabase, supabaseAdmin } = require('../config/supabase');

async function createMissingStore() {
  try {
    console.log('Iniciando criação de lojas faltantes...');
    
    // Buscar todas as credenciais da Amazon
    console.log('Buscando credenciais da Amazon...');
    const { data: credentials, error: credentialsError } = await supabase
      .from('amazon_credentials')
      .select('*');
    
    if (credentialsError) {
      console.error('Erro ao buscar credenciais da Amazon:', credentialsError);
      throw credentialsError;
    }
    
    console.log(`Encontradas ${credentials.length} credenciais da Amazon`);
    
    // Para cada credencial, verificar se existe uma loja correspondente
    for (const cred of credentials) {
      const storeUuid = cred.store_uuid;
      
      console.log(`\nVerificando loja para credencial: ${cred.id} (Store UUID: ${storeUuid})`);
      
      if (!storeUuid) {
        console.log('Credencial sem UUID de loja. Pulando...');
        continue;
      }
      
      // Verificar se a loja existe
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, name')
        .eq('id', storeUuid)
        .single();
      
      if (storeError && storeError.code !== 'PGRST116') {
        console.error(`Erro ao verificar loja ${storeUuid}:`, storeError);
        continue;
      }
      
      if (store) {
        console.log(`Loja encontrada: ${store.name} (${store.id}). Atualizando status...`);
        
        // Atualizar o status da loja
        const { error: updateError } = await supabaseAdmin
          .from('stores')
          .update({
            has_amazon_credentials: true,
            has_amazon_credentials_attempted: true
          })
          .eq('id', storeUuid);
        
        if (updateError) {
          console.error(`Erro ao atualizar status da loja ${store.name}:`, updateError);
        } else {
          console.log(`Status da loja ${store.name} atualizado com sucesso`);
        }
      } else {
        console.log(`Loja não encontrada para UUID ${storeUuid}. Criando nova loja...`);
        
        // Criar uma nova loja com o UUID da credencial
        const { data: newStore, error: createError } = await supabaseAdmin
          .from('stores')
          .insert({
            id: storeUuid,
            name: 'Blessing',
            description: 'Loja criada automaticamente para credenciais existentes',
            is_active: true,
            has_amazon_credentials: true,
            has_amazon_credentials_attempted: true
          })
          .select()
          .single();
        
        if (createError) {
          console.error(`Erro ao criar loja para UUID ${storeUuid}:`, createError);
        } else {
          console.log(`Loja criada com sucesso: ${newStore.name} (${newStore.id})`);
          
          // Criar acesso para o usuário
          console.log('Criando acesso para o usuário...');
          
          // Buscar um usuário para associar à loja
          const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
          
          if (usersError) {
            console.error('Erro ao buscar usuários:', usersError);
          } else if (users && users.length > 0) {
            const userId = users[0].id;
            
            const { error: accessError } = await supabaseAdmin
              .from('user_store_access')
              .insert({
                user_id: userId,
                store_id: storeUuid,
                role: 'owner',
                is_primary: true
              });
            
            if (accessError) {
              console.error(`Erro ao criar acesso para usuário ${userId}:`, accessError);
            } else {
              console.log(`Acesso criado com sucesso para usuário ${userId}`);
            }
          } else {
            console.log('Nenhum usuário encontrado para associar à loja');
          }
        }
      }
    }
    
    console.log('\nCriação de lojas faltantes concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao criar lojas faltantes:', error);
    process.exit(1);
  }
}

// Executar a função principal
createMissingStore();