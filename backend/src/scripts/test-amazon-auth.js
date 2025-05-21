/**
 * Script para testar a autenticação com a Amazon SP-API
 * 
 * Este script testa a funcionalidade de autenticação com a Amazon:
 * 1. Busca as credenciais de uma loja específica
 * 2. Tenta obter um token de acesso da Amazon
 * 3. Exibe o resultado do teste
 * 
 * Uso: node src/scripts/test-amazon-auth.js [storeId]
 */

const { supabase, supabaseAdmin } = require('../config/supabase');
const AmazonService = require('../services/amazon.service');

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
 * Função principal
 */
async function main() {
  try {
    log(`${colors.bright}Iniciando teste de autenticação com a Amazon SP-API${colors.reset}`);
    
    // Obter o ID da loja dos argumentos da linha de comando ou usar um padrão
    const storeId = process.argv[2];
    
    if (!storeId) {
      log('Nenhum ID de loja fornecido. Buscando a primeira loja disponível...', 'info');
      
      // Buscar a primeira loja disponível
      const { data: stores, error: storesError } = await supabaseAdmin
        .from('stores')
        .select('id, name, amazon_seller_id')
        .limit(1);
      
      if (storesError || !stores || stores.length === 0) {
        log('Nenhuma loja encontrada. Por favor, forneça um ID de loja como argumento.', 'error');
        process.exit(1);
      }
      
      const firstStore = stores[0];
      log(`Usando a primeira loja encontrada: ${firstStore.name} (${firstStore.id})`, 'info');
      
      // Verificar se a loja tem credenciais da Amazon
      if (!firstStore.amazon_seller_id) {
        log(`A loja ${firstStore.name} não tem credenciais da Amazon configuradas.`, 'warning');
        log(`Por favor, configure as credenciais da Amazon para esta loja ou forneça um ID de loja com credenciais.`, 'warning');
      }
      
      // Testar a conexão com a Amazon
      await testAmazonConnection(firstStore.id);
    } else {
      log(`Usando o ID de loja fornecido: ${storeId}`, 'info');
      
      // Verificar se a loja existe
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, name, amazon_seller_id')
        .eq('id', storeId)
        .single();
      
      if (storeError || !store) {
        log(`Loja com ID ${storeId} não encontrada.`, 'error');
        process.exit(1);
      }
      
      log(`Loja encontrada: ${store.name} (${store.id})`, 'info');
      
      // Verificar se a loja tem credenciais da Amazon
      if (!store.amazon_seller_id) {
        log(`A loja ${store.name} não tem credenciais da Amazon configuradas.`, 'warning');
        log(`Por favor, configure as credenciais da Amazon para esta loja.`, 'warning');
      }
      
      // Testar a conexão com a Amazon
      await testAmazonConnection(store.id);
    }
  } catch (error) {
    log(`Erro durante a execução do teste: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Função para testar a conexão com a Amazon
 */
async function testAmazonConnection(storeId) {
  log(`\n${colors.bright}Testando conexão com a Amazon para loja ${storeId}${colors.reset}`);
  
  try {
    // Usar o serviço para testar a conexão
    const testResult = await AmazonService.testConnection(storeId);
    
    if (testResult.success) {
      log(`Conexão com a Amazon estabelecida com sucesso!`, 'success');
      log(`Token Info: ${JSON.stringify(testResult.tokenInfo, null, 2)}`, 'success');
    } else {
      log(`Falha ao estabelecer conexão com a Amazon: ${testResult.message}`, 'error');
      if (testResult.error) {
        log(`Detalhes do erro: ${JSON.stringify(testResult.error, null, 2)}`, 'error');
      }
    }
  } catch (error) {
    log(`Erro ao testar conexão: ${error.message}`, 'error');
    console.error(error);
  }
}

// Executar a função principal
main().catch(error => {
  log(`Erro fatal: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});