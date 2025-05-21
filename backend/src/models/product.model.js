const { supabase, supabaseAdmin } = require('../config/supabase');

/**
 * Modelo para operações relacionadas aos produtos
 */
class ProductModel {
  /**
   * Obtém produtos com paginação e filtros
   * @param {Object} options - Opções de consulta
   * @param {string} options.storeId - ID da loja
   * @param {number} options.page - Número da página
   * @param {number} options.limit - Limite de itens por página
   * @param {Object} options.filters - Filtros a serem aplicados
   * @param {string} options.search - Termo de pesquisa geral
   * @param {string} options.sortBy - Campo para ordenação
   * @param {string} options.sortOrder - Ordem (asc/desc)
   * @returns {Promise<Object>} Produtos e metadados de paginação
   */
  static async getProducts({ storeId, page = 1, limit = 10, filters = {}, search = '', sortBy = 'created_at', sortOrder = 'desc' }) {
    try {
      console.log('[ProductModel] getProducts - Iniciando busca com parâmetros:', {
        storeId,
        page,
        limit,
        filters,
        search,
        sortBy,
        sortOrder
      });
    
      // Calcular offset para paginação
      const offset = (page - 1) * limit;
      
      // Construir a query base
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('store_id', storeId);
      
      // Aplicar pesquisa geral se existir
      if (search) {
        query = query.or(`amz_asin.ilike.%${search}%,amz_sku.ilike.%${search}%,supplier_sku.ilike.%${search}%,supplier_brand.ilike.%${search}%,supplier_source.ilike.%${search}%`);
      }
      console.log('[ProductModel] getProducts - Aplicando busca geral:', search);
      
      // Aplicar filtros se existirem
      if (filters.amz_asin) {
        query = query.ilike('amz_asin', `%${filters.amz_asin}%`);
      }
      
      if (filters.supplier_sku) {
        query = query.ilike('supplier_sku', `%${filters.supplier_sku}%`);
      }
      
      if (filters.supplier_brand) {
        query = query.ilike('supplier_brand', `%${filters.supplier_brand}%`);
      }
      
      if (filters.supplier_availability) {
        query = query.eq('supplier_availability', filters.supplier_availability);
      }
      
      console.log('[ProductModel] getProducts - Aplicando paginação:', {
        offset,
        limit,
        sortBy,
        sortOrder
      });
      
      // Aplicar ordenação e paginação
      const { data, error, count } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('[ProductModel] getProducts - Erro na consulta Supabase:', error);
        throw error;
      }
      
      // Calcular total de páginas
      const totalPages = Math.ceil(count / limit);

      console.log('[ProductModel] getProducts - Resultados encontrados:', {
        count,
        totalPages,
        dataLength: data?.length,
        firstItem: data?.length > 0 ? `id: ${data[0].id}` : 'nenhum',
        lastItem: data?.length > 0 ? `id: ${data[data.length - 1].id}` : 'nenhum'
      });
      
      return {
        data,
        pagination: {
          total: count,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  }

  /**
   * Obtém um produto pelo ID
   * @param {string} id - ID do produto
   * @param {string} storeId - ID da loja
   * @returns {Promise<Object>} Dados do produto
   */
  static async getProductById(id, storeId) {
    try {
      console.log('[ProductModel] getProductById - Buscando produto:', {
        id,
        storeId
      });
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('store_id', storeId)
        .single();
      
      if (error) {
        console.error('[ProductModel] getProductById - Erro na consulta Supabase:', error);
        throw error;
      }
      
      console.log('[ProductModel] getProductById - Resultado:', {
        encontrado: !!data
      });
      return data;
    } catch (error) {
      console.error(`Erro ao buscar produto com ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cria um novo produto
   * @param {Object} productData - Dados do produto
   * @returns {Promise<Object>} Produto criado
   */
  static async createProduct(productData) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select();
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  }

  /**
   * Atualiza campos editáveis de um produto
   * @param {string} id - ID do produto
   * @param {string} storeId - ID da loja
   * @param {Object} updates - Campos a serem atualizados
   * @returns {Promise<Object>} Produto atualizado
   */
  static async updateProduct(id, storeId, updates) {
    try {
      console.log('[ProductModel] updateProduct - Atualizando produto:', {
        id,
        storeId,
        camposAtualizados: Object.keys(updates)
      });
      // Verificar se apenas campos editáveis estão sendo atualizados
      const editableFields = [
        'supplier_price',
        'supplier_price_shipping',
        'amz_price',
        'amz_price_shipping',
        'supplier_handling_time',
        'store_handling_time',
        'amz_handling_time',
        'supplier_quantity'
      ];
      
      // Filtrar apenas os campos editáveis
      const validUpdates = Object.keys(updates)
        .filter(key => editableFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});
      
      console.log('[ProductModel] updateProduct - Campos válidos para atualização:', Object.keys(validUpdates));
      
      // Atualizar o produto
      const { data, error } = await supabase
        .from('products')
        .update(validUpdates)
        .eq('id', id)
        .eq('store_id', storeId)
        .select();
      
      if (error) {
        console.error('[ProductModel] updateProduct - Erro na atualização Supabase:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.warn('[ProductModel] updateProduct - Nenhum registro retornado após atualização');
      } else {
        console.log('[ProductModel] updateProduct - Produto atualizado com sucesso:', {
          id: data[0].id
        });
      }
      
      return data[0];
    } catch (error) {
      console.error(`Erro ao atualizar produto com ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deleta um produto pelo ID
   * @param {string} id - ID do produto
   * @param {string} storeId - ID da loja
   * @returns {Promise<boolean>} Sucesso da operação
   */
  static async deleteProduct(id, storeId) {
    try {
      console.log('[ProductModel] deleteProduct - Deletando produto:', {
        id,
        storeId
      });
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('store_id', storeId);
      
      if (error) {
        console.error('[ProductModel] deleteProduct - Erro na deleção Supabase:', error);
        throw error;
      }
      
      console.log('[ProductModel] deleteProduct - Produto deletado com sucesso');
      
      return true;
    } catch (error) {
      console.error(`Erro ao deletar produto com ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deleta múltiplos produtos pelos IDs
   * @param {string[]} ids - Array de IDs dos produtos
   * @param {string} storeId - ID da loja
   * @returns {Promise<boolean>} Sucesso da operação
   */
  static async bulkDeleteProducts(ids, storeId) {
    try {
      console.log('[ProductModel] bulkDeleteProducts - Deletando produtos em massa:', {
        quantidadeIds: ids.length,
        storeId
      });
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', ids)
        .eq('store_id', storeId);
      
      if (error) {
        console.error('[ProductModel] bulkDeleteProducts - Erro na deleção em massa Supabase:', error);
        throw error;
      }
      
      console.log('[ProductModel] bulkDeleteProducts - Produtos deletados com sucesso');
      
      return true;
    } catch (error) {
      console.error(`Erro ao deletar produtos em massa:`, error);
      throw error;
    }
  }
}

module.exports = ProductModel; 