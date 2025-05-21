import api from './api';

/**
 * Serviço para gerenciar produtos
 */
class ProductService {
  /**
   * Obtém lista de produtos com paginação e filtros
   * @param {string} storeId - ID da loja
   * @param {Object} options - Opções de consulta
   * @returns {Promise<Object>} Produtos e metadados de paginação
   */
  static async getProducts(storeId, options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      amz_asin = '',
      supplier_sku = '',
      supplier_brand = '',
      supplier_availability = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;
    
    console.log('[ProductService] Chamando getProducts para loja:', storeId, 'com opções:', options);

    try {
      const response = await api.get(`/stores/${storeId}/products`, {
        params: {
          page,
          limit,
          search,
          amz_asin,
          supplier_sku,
          supplier_brand,
          supplier_availability,
          sortBy,
          sortOrder
        }
      });
      
      console.log('[ProductService] Resposta de getProducts:', {
        status: response.status,
        responseStructure: Object.keys(response.data),
        dataLength: Array.isArray(response.data.data) ? response.data.data.length : 'data não é array'
      });
      
      return response.data;
    } catch (error) {
      console.error('[ProductService] Erro detalhado em getProducts:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          params: error.config.params,
        } : 'Config não disponível'
      });
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  }

  /**
   * Obtém um produto pelo ID
   * @param {string} storeId - ID da loja
   * @param {string} productId - ID do produto
   * @returns {Promise<Object>} Dados do produto
   */
  static async getProductById(storeId, productId) {
    console.log('[ProductService] Chamando getProductById:', { storeId, productId });
    try {
      const response = await api.get(`/stores/${storeId}/products/${productId}`);
      console.log('[ProductService] Resposta de getProductById:', {
        status: response.status,
        responseStructure: Object.keys(response.data)
      });
      return response.data;
    } catch (error) {
      console.error('[ProductService] Erro detalhado em getProductById:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      console.error(`Erro ao buscar produto com ID ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Cria um novo produto
   * @param {string} storeId - ID da loja
   * @param {Object} productData - Dados do produto
   * @returns {Promise<Object>} Produto criado
   */
  static async createProduct(storeId, productData) {
    try {
      const response = await api.post(`/stores/${storeId}/products`, productData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  }

  /**
   * Atualiza campos editáveis de um produto
   * @param {string} storeId - ID da loja
   * @param {string} productId - ID do produto
   * @param {Object} updates - Campos a serem atualizados
   * @returns {Promise<Object>} Produto atualizado
   */
  static async updateProduct(storeId, productId, updates) {
    console.log('[ProductService] Chamando updateProduct:', { storeId, productId, updates });
    try {
      const response = await api.patch(`/stores/${storeId}/products/${productId}`, updates);
      console.log('[ProductService] Resposta de updateProduct:', {
        status: response.status,
        responseStructure: Object.keys(response.data)
      });
      return response.data;
    } catch (error) {
      console.error('[ProductService] Erro detalhado em updateProduct:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      console.error(`Erro ao atualizar produto com ID ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Deleta um produto pelo ID
   * @param {string} storeId - ID da loja
   * @param {string} productId - ID do produto
   * @returns {Promise<Object>} Resposta da API
   */
  static async deleteProduct(storeId, productId) {
    console.log('[ProductService] Chamando deleteProduct:', { storeId, productId });
    try {
      const response = await api.delete(`/stores/${storeId}/products/${productId}`);
      console.log('[ProductService] Resposta de deleteProduct:', {
        status: response.status,
        responseStructure: Object.keys(response.data)
      });
      return response.data;
    } catch (error) {
      console.error('[ProductService] Erro detalhado em deleteProduct:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      console.error(`Erro ao deletar produto com ID ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Deleta múltiplos produtos pelos IDs
   * @param {string} storeId - ID da loja
   * @param {string[]} ids - Array de IDs dos produtos
   * @returns {Promise<Object>} Resposta da API
   */
  static async bulkDeleteProducts(storeId, ids) {
    console.log('[ProductService] Chamando bulkDeleteProducts:', { storeId, ids });
    try {
      const response = await api.delete(`/stores/${storeId}/products/bulk`, {
        data: { ids }
      });
      console.log('[ProductService] Resposta de bulkDeleteProducts:', {
        status: response.status,
        responseStructure: Object.keys(response.data)
      });
      return response.data;
    } catch (error) {
      console.error('[ProductService] Erro detalhado em bulkDeleteProducts:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method
        } : 'Config não disponível' 
      });
      console.error('Erro ao deletar produtos em massa:', error);
      throw error;
    }
  }
}

export default ProductService; 