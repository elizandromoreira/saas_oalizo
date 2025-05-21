/**
 * Script para adicionar colunas de credenciais da Amazon à tabela stores
 * 
 * Este script executa o SQL para adicionar as colunas has_amazon_credentials e
 * has_amazon_credentials_attempted à tabela stores, caso elas não existam.
 */

const fs = require('fs');
const path = require('path');
const { supabase, supabaseAdmin } = require('../config/supabase');

async function addAmazonCredentialsColumns() {
  try {
    console.log('Iniciando adição de colunas de credenciais da Amazon à tabela stores...');
    
    // Verificar se as colunas já existem
    console.log('Verificando se as colunas existem...');
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, has_amazon_credentials, has_amazon_credentials_attempted')
      .limit(1);
      
    if (storeError) {
      console.error('Erro ao verificar colunas:', storeError);
      
      // Se o erro for relacionado a colunas inexistentes, vamos adicioná-las
      if (storeError.message && storeError.message.includes('column') && storeError.message.includes('does not exist')) {
        console.log('As colunas não existem. Adicionando...');
        
        // Adicionar coluna has_amazon_credentials
        console.log('Adicionando coluna has_amazon_credentials...');
        const { error: addCredentialsError } = await supabaseAdmin.rpc('alter_table_add_column', {
          table_name: 'stores',
          column_name: 'has_amazon_credentials',
          column_type: 'boolean',
          column_default: 'false'
        });
        
        if (addCredentialsError) {
          console.error('Erro ao adicionar coluna has_amazon_credentials:', addCredentialsError);
          console.log('Tentando método alternativo...');
          
          // Método alternativo: usar a API REST do Supabase para executar SQL diretamente
          try {
            await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.SUPABASE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_KEY}`
              },
              body: JSON.stringify({
                sql: 'ALTER TABLE stores ADD COLUMN IF NOT EXISTS has_amazon_credentials BOOLEAN DEFAULT FALSE;'
              })
            });
            console.log('Coluna has_amazon_credentials adicionada com sucesso (método alternativo)');
          } catch (fetchError) {
            console.error('Erro ao executar SQL via fetch:', fetchError);
          }
        } else {
          console.log('Coluna has_amazon_credentials adicionada com sucesso');
        }
        
        // Adicionar coluna has_amazon_credentials_attempted
        console.log('Adicionando coluna has_amazon_credentials_attempted...');
        const { error: addAttemptedError } = await supabaseAdmin.rpc('alter_table_add_column', {
          table_name: 'stores',
          column_name: 'has_amazon_credentials_attempted',
          column_type: 'boolean',
          column_default: 'false'
        });
        
        if (addAttemptedError) {
          console.error('Erro ao adicionar coluna has_amazon_credentials_attempted:', addAttemptedError);
          console.log('Tentando método alternativo...');
          
          // Método alternativo: usar a API REST do Supabase para executar SQL diretamente
          try {
            await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.SUPABASE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_KEY}`
              },
              body: JSON.stringify({
                sql: 'ALTER TABLE stores ADD COLUMN IF NOT EXISTS has_amazon_credentials_attempted BOOLEAN DEFAULT FALSE;'
              })
            });
            console.log('Coluna has_amazon_credentials_attempted adicionada com sucesso (método alternativo)');
          } catch (fetchError) {
            console.error('Erro ao executar SQL via fetch:', fetchError);
          }
        } else {
          console.log('Coluna has_amazon_credentials_attempted adicionada com sucesso');
        }
      } else {
        throw storeError;
      }
    } else {
      // Verificar se as colunas existem nos dados retornados
      if (storeData && storeData.length > 0) {
        const hasCredentialsColumn = 'has_amazon_credentials' in storeData[0];
        const hasAttemptedColumn = 'has_amazon_credentials_attempted' in storeData[0];
        
        console.log(`Coluna has_amazon_credentials existe: ${hasCredentialsColumn}`);
        console.log(`Coluna has_amazon_credentials_attempted existe: ${hasAttemptedColumn}`);
        
        if (!hasCredentialsColumn || !hasAttemptedColumn) {
          console.log('Algumas colunas não existem. Adicionando...');
          
          if (!hasCredentialsColumn) {
            console.log('Adicionando coluna has_amazon_credentials...');
            await supabaseAdmin.rpc('execute_sql', {
              sql: 'ALTER TABLE stores ADD COLUMN IF NOT EXISTS has_amazon_credentials BOOLEAN DEFAULT FALSE;'
            });
          }
          
          if (!hasAttemptedColumn) {
            console.log('Adicionando coluna has_amazon_credentials_attempted...');
            await supabaseAdmin.rpc('execute_sql', {
              sql: 'ALTER TABLE stores ADD COLUMN IF NOT EXISTS has_amazon_credentials_attempted BOOLEAN DEFAULT FALSE;'
            });
          }
        } else {
          console.log('Ambas as colunas já existem');
        }
      }
    }
    
    console.log('Verificando se as colunas foram adicionadas...');
    
    // Verificar se as colunas foram adicionadas
    const { data, error: checkError } = await supabase
      .from('stores')
      .select('id, has_amazon_credentials, has_amazon_credentials_attempted')
      .limit(1);
    
    if (checkError) {
      console.error('Erro ao verificar colunas:', checkError);
      throw checkError;
    }
    
    console.log('Verificação de colunas:', data);
    
    // Verificar lojas com credenciais da Amazon
    const { data: storesWithCredentials, error: storesError } = await supabase
      .from('stores')
      .select('id, name, has_amazon_credentials, has_amazon_credentials_attempted')
      .eq('has_amazon_credentials', true);
    
    if (storesError) {
      console.error('Erro ao verificar lojas com credenciais:', storesError);
    } else {
      console.log(`Encontradas ${storesWithCredentials.length} lojas com credenciais da Amazon:`);
      console.log(storesWithCredentials);
    }
    
    // Verificar credenciais da Amazon existentes
    const { data: amazonCredentials, error: credentialsError } = await supabase
      .from('amazon_credentials')
      .select('*');
    
    if (credentialsError) {
      console.error('Erro ao verificar credenciais da Amazon:', credentialsError);
    } else {
      console.log(`Encontradas ${amazonCredentials.length} credenciais da Amazon:`);
      console.log(amazonCredentials);
    }
    
    console.log('Script concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar colunas:', error);
    process.exit(1);
  }
}

// Executar a função principal
addAmazonCredentialsColumns();