import api, { setStoreHeader } from './api';

/**
 * Serviço para gerenciar credenciais da Amazon
 */
const amazonCredentialsService = {
  /**
   * Obtém as credenciais da Amazon para uma loja
   * @param {string} storeId - ID da loja
   * @returns {Promise} - Promessa com os dados da resposta
   */
  getCredentials: (storeId) => {
    // Ensure store ID is set in header
    setStoreHeader(storeId);
    return api.get(`/stores/${storeId}/amazon-credentials`);
  },
  
  /**
   * Salva ou atualiza as credenciais da Amazon para uma loja
   * @param {string} storeId - ID da loja
   * @param {Object} credentials - Dados das credenciais
   * @returns {Promise} - Promessa com os dados da resposta
   */
  saveCredentials: (storeId, credentials) => {
    // Ensure store ID is set in header
    setStoreHeader(storeId);
    console.log('Saving credentials for store:', storeId);
    console.log('Headers set:', api.defaults.headers.common['X-Store-ID']);
    return api.post(`/stores/${storeId}/amazon-credentials`, credentials);
  },
  
  /**
   * Remove as credenciais da Amazon para uma loja
   * @param {string} storeId - ID da loja
   * @returns {Promise} - Promessa com os dados da resposta
   */
  deleteCredentials: (storeId) => {
    // Ensure store ID is set in header
    setStoreHeader(storeId);
    return api.delete(`/stores/${storeId}/amazon-credentials`);
  },
  
  /**
   * Testa a conexão com a Amazon usando as credenciais armazenadas
   * @param {string} storeId - ID da loja
   * @returns {Promise} - Promessa com os dados da resposta
   */
  testConnection: (storeId) => {
    // Ensure store ID is set in header
    setStoreHeader(storeId);
    return api.post(`/stores/${storeId}/amazon-credentials/test`);
  }
};

export default amazonCredentialsService;
