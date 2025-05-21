const axios = require('axios');
const { supabase, supabaseAdmin } = require('../config/supabase');

/**
 * Serviço para operações relacionadas à Amazon SP-API
 */
class AmazonService {
  /**
   * Busca as credenciais da Amazon no banco de dados
   * @param {string} storeId - UUID da loja
   * @returns {Promise<Object>} - Credenciais da Amazon
   */
  static async getAmazonCredentials(storeId) {
    try {
      console.log(`Buscando credenciais para loja ${storeId}`);
      
      // Buscar credenciais no banco de dados
      const { data, error } = await supabaseAdmin
        .from('stores')
        .select('amazon_seller_id, amazon_client_id, amazon_client_secret, amazon_refresh_token, amazon_marketplace_id')
        .eq('id', storeId)
        .single();
      
      if (error) {
        console.error('Erro ao buscar credenciais:', error);
        return null;
      }

      // Se não houver credenciais da Amazon, retornar null
      if (!data || !data.amazon_seller_id) {
        console.log(`Nenhuma credencial da Amazon encontrada para a loja: ${storeId}`);
        return null;
      }
      
      console.log(`Credenciais obtidas com sucesso para loja: ${storeId}`);
      // Oculta o client_secret no log
      const logSafeCreds = {
        seller_id: data.amazon_seller_id,
        client_id: data.amazon_client_id,
        client_secret: "**** OCULTO ****",
        refresh_token: "**** OCULTO ****",
        marketplace_id: data.amazon_marketplace_id
      };
      console.log(JSON.stringify(logSafeCreds, null, 2));
      
      // Converter para o formato esperado pelas funções existentes
      return {
        seller_id: data.amazon_seller_id,
        client_id: data.amazon_client_id,
        client_secret: data.amazon_client_secret,
        refresh_token: data.amazon_refresh_token,
        marketplace_id: data.amazon_marketplace_id
      };
    } catch (error) {
      console.error(`Erro ao buscar credenciais:`, error);
      throw new Error(`Falha ao buscar credenciais: ${error.message}`);
    }
  }
  
  /**
   * Obtém um novo access_token da Amazon
   * @param {Object} credentials - Credenciais da Amazon
   * @returns {Promise<Object>} - Resposta com token e informações
   */
  static async getAccessToken(credentials) {
    try {
      console.log('Iniciando obtenção de access token da Amazon...');
      
      const url = "https://api.amazon.com/auth/o2/token";
      const payload = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        refresh_token: credentials.refresh_token
      });
      
      console.log('Enviando requisição para:', url);
      
      const response = await axios.post(url, payload.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      if (response.status === 200) {
        console.log('Access Token obtido com sucesso!');
        
        // Log detalhado do token de resposta da Amazon
        console.log('Detalhes do token de resposta da Amazon:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Verificar se o token é válido
        if (response.data.access_token) {
          console.log('Token válido! Primeiros caracteres do access_token:', 
            response.data.access_token.substring(0, 10) + '...');
          console.log('Expira em:', response.data.expires_in, 'segundos');
        } else {
          console.warn('Resposta não contém access_token!');
        }
        
        return {
          success: true,
          tokenInfo: response.data,
          message: 'Conexão com a Amazon estabelecida com sucesso'
        };
      } else {
        console.log('Erro ao obter Access Token:', response.status, response.data);
        return {
          success: false,
          error: `Erro na resposta da Amazon: ${response.status}`,
          message: 'Falha ao estabelecer conexão com a Amazon'
        };
      }
    } catch (error) {
      console.error('Erro ao obter Access Token:', error.message);
      
      // Log detalhado para debugging
      if (error.response) {
        console.error('Detalhes da resposta de erro:');
        console.error(`Status: ${error.response.status}`);
        console.error('Headers:', error.response.headers);
        console.error('Data:', error.response.data);
        
        return {
          success: false,
          error: error.response.data,
          message: `Falha ao estabelecer conexão com a Amazon: ${error.response.data.error_description || error.message}`
        };
      }
      
      return {
        success: false,
        error: error.message,
        message: `Falha ao estabelecer conexão com a Amazon: ${error.message}`
      };
    }
  }
  
  /**
   * Testa a conexão com a Amazon usando as credenciais armazenadas
   * @param {string} storeId - UUID da loja
   * @returns {Promise<Object>} - Resultado do teste
   */
  static async testConnection(storeId) {
    try {
      console.log(`Testando conexão com a Amazon para loja ${storeId}...`);
      
      // Obter credenciais
      const credentials = await this.getAmazonCredentials(storeId);
      
      if (!credentials) {
        return {
          success: false,
          message: 'Credenciais da Amazon não encontradas para esta loja'
        };
      }
      
      // Testar obtenção de token
      const tokenResult = await this.getAccessToken(credentials);
      
      return tokenResult;
    } catch (error) {
      console.error('Erro ao testar conexão com a Amazon:', error);
      return {
        success: false,
        error: error.message,
        message: `Erro ao testar conexão com a Amazon: ${error.message}`
      };
    }
  }
}

module.exports = AmazonService;