const { validationResult } = require('express-validator');
const ProductModel = require('../models/product.model');
const { supabase } = require('../config/supabase');

/**
 * Controlador para operações relacionadas aos produtos
 */
class ProductController {
  /**
   * Obtém lista de produtos com paginação e filtros
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getProducts(req, res) {
    try {
      console.log('[ProductController] getProducts - Parâmetros recebidos:', {
        storeId: req.params.storeId,
        userId: req.user?.id,
        query: req.query,
        headers: req.headers
      });

      // Verificar se o ID da loja foi fornecido
      const { storeId } = req.params;
      if (!storeId) {
        console.log('[ProductController] getProducts - ID da loja não fornecido');
        return res.status(400).json({
          success: false,
          message: 'ID da loja é obrigatório'
        });
      }

      // Verificar se o usuário tem acesso à loja
      const { data: accessData, error: accessError } = await supabase
        .from('user_store_access')
        .select('role')
        .eq('user_id', req.user.id)
        .eq('store_id', storeId)
        .single();

      if (accessError || !accessData) {
        console.log('[ProductController] getProducts - Verificação de acesso:', {
          accessData: accessData,
          accessError: accessError,
          hasAccess: !accessError && accessData
        });

        console.log('[ProductController] getProductById - Verificação de acesso:', {
          accessData: accessData,
          accessError: accessError,
          hasAccess: !accessError && accessData
        });

        return res.status(403).json({
          success: false,
          message: 'Você não tem acesso a esta loja'
        });
      }

      // Extrair parâmetros de consulta
      const { 
        page = 1, 
        limit = 50, 
        amz_asin, 
        supplier_sku, 
        supplier_brand, 
        supplier_availability,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;
      
      // Construir objeto de filtros
      const filters = {};
      if (amz_asin) filters.amz_asin = amz_asin.trim();
      if (supplier_sku) filters.supplier_sku = supplier_sku.trim();
      if (supplier_brand) filters.supplier_brand = supplier_brand.trim();
      if (supplier_availability) filters.supplier_availability = supplier_availability.trim();
      
      console.log('[ProductController] getProducts - Construindo consulta com filtros:', filters);

      // Buscar produtos
      const result = await ProductModel.getProducts({
        storeId,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        filters,
        search: search ? search.trim() : '',
        sortBy,
        sortOrder
      });
      
      console.log('[ProductController] getProducts - Produtos encontrados:', {
        count: result.data.length,
        pagination: result.pagination
      });
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao buscar produtos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtém um produto pelo ID
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getProductById(req, res) {
    try {
      console.log('[ProductController] getProductById - Parâmetros recebidos:', {
        storeId: req.params.storeId,
        productId: req.params.productId,
        userId: req.user?.id
      });

      const { storeId, productId } = req.params;
      
      // Verificar se o usuário tem acesso à loja
      const { data: accessData, error: accessError } = await supabase
        .from('user_store_access')
        .select('role')
        .eq('user_id', req.user.id)
        .eq('store_id', storeId)
        .single();

      if (accessError || !accessData) {
        return res.status(403).json({
          success: false,
          message: 'Você não tem acesso a esta loja'
        });
      }
      
      const product = await ProductModel.getProductById(productId, storeId);
      
      if (!product) {
        console.log('[ProductController] getProductById - Produto não encontrado:', { productId, storeId });
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado'
        });
      }
      
      console.log('[ProductController] getProductById - Produto encontrado');
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error(`Erro ao buscar produto com ID ${req.params.productId}:`, error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao buscar produto',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cria um novo produto
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async createProduct(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { storeId } = req.params;
      
      // Verificar se o usuário tem acesso à loja com permissão adequada
      const { data: accessData, error: accessError } = await supabase
        .from('user_store_access')
        .select('role')
        .eq('user_id', req.user.id)
        .eq('store_id', storeId)
        .single();

      if (accessError || !accessData || !['owner', 'admin', 'manager'].includes(accessData.role)) {
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para criar produtos nesta loja'
        });
      }

      // Preparar dados do produto
      const productData = {
        ...req.body,
        store_id: storeId
      };

      // Criar o produto
      const newProduct = await ProductModel.createProduct(productData);

      res.status(201).json({
        success: true,
        message: 'Produto criado com sucesso',
        data: newProduct
      });
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar produto',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Atualiza campos editáveis de um produto
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async updateProduct(req, res) {
    try {
      console.log('[ProductController] updateProduct - Parâmetros recebidos:', {
        storeId: req.params.storeId,
        productId: req.params.productId,
        updates: req.body,
        userId: req.user?.id
      });

      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('[ProductController] updateProduct - Erros de validação:', errors.array());
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { storeId, productId } = req.params;
      const updates = req.body;
      
      // Verificar se o usuário tem acesso à loja com permissão adequada
      const { data: accessData, error: accessError } = await supabase
        .from('user_store_access')
        .select('role')
        .eq('user_id', req.user.id)
        .eq('store_id', storeId)
        .single();

      if (accessError || !accessData || !['owner', 'admin', 'manager'].includes(accessData.role)) {
        console.log('[ProductController] updateProduct - Verificação de acesso:', {
          accessData: accessData,
          accessError: accessError,
          hasAccess: !accessError && accessData && ['owner', 'admin', 'manager'].includes(accessData.role)
        });

        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para atualizar produtos nesta loja'
        });
      }
      
      // Verificar se o produto existe
      const existingProduct = await ProductModel.getProductById(productId, storeId);
      if (!existingProduct) {
        console.log('[ProductController] updateProduct - Produto não encontrado:', { productId, storeId });
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado'
        });
      }
      
      // Atualizar o produto
      const updatedProduct = await ProductModel.updateProduct(productId, storeId, updates);
      
      console.log('[ProductController] updateProduct - Produto atualizado com sucesso');
      
      res.json({
        success: true,
        message: 'Produto atualizado com sucesso',
        data: updatedProduct
      });
    } catch (error) {
      console.error(`Erro ao atualizar produto com ID ${req.params.productId}:`, error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao atualizar produto',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Deleta um produto pelo ID
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async deleteProduct(req, res) {
    try {
      console.log('[ProductController] deleteProduct - Parâmetros recebidos:', {
        storeId: req.params.storeId,
        productId: req.params.productId,
        userId: req.user?.id
      });

      const { storeId, productId } = req.params;
      
      // Verificar se o usuário tem acesso à loja com permissão adequada
      const { data: accessData, error: accessError } = await supabase
        .from('user_store_access')
        .select('role')
        .eq('user_id', req.user.id)
        .eq('store_id', storeId)
        .single();

      if (accessError || !accessData || !['owner', 'admin'].includes(accessData.role)) {
        console.log('[ProductController] deleteProduct - Verificação de acesso:', {
          accessData: accessData,
          accessError: accessError,
          hasAccess: !accessError && accessData && ['owner', 'admin'].includes(accessData.role)
        });
        
        console.log('[ProductController] bulkDeleteProducts - Verificação de acesso:', {
          accessData: accessData,
          accessError: accessError,
          hasAccess: !accessError && accessData && ['owner', 'admin'].includes(accessData.role)
        });

        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para deletar produtos nesta loja'
        });
      }
      
      // Verificar se o produto existe
      const existingProduct = await ProductModel.getProductById(productId, storeId);
      if (!existingProduct) {
        console.log('[ProductController] deleteProduct - Produto não encontrado:', { productId, storeId });
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado'
        });
      }
      
      // Deletar o produto
      await ProductModel.deleteProduct(productId, storeId);
      
      console.log('[ProductController] deleteProduct - Produto deletado com sucesso');
      
      res.json({
        success: true,
        message: 'Produto deletado com sucesso'
      });
    } catch (error) {
      console.error(`Erro ao deletar produto com ID ${req.params.productId}:`, error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao deletar produto',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Deleta múltiplos produtos pelos IDs
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async bulkDeleteProducts(req, res) {
    try {
      console.log('[ProductController] bulkDeleteProducts - Parâmetros recebidos:', {
        storeId: req.params.storeId,
        ids: req.body.ids,
        userId: req.user?.id
      });

      const { storeId } = req.params;
      const { ids } = req.body;
      
      // Verificar se o usuário tem acesso à loja com permissão adequada
      const { data: accessData, error: accessError } = await supabase
        .from('user_store_access')
        .select('role')
        .eq('user_id', req.user.id)
        .eq('store_id', storeId)
        .single();

      if (accessError || !accessData || !['owner', 'admin'].includes(accessData.role)) {
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para deletar produtos nesta loja'
        });
      }
      
      // Validar o array de IDs
      if (!Array.isArray(ids) || ids.length === 0) {
        console.log('[ProductController] bulkDeleteProducts - Array de IDs inválido:', ids);
        return res.status(400).json({ 
          success: false,
          message: 'É necessário fornecer um array de IDs válido'
        });
      }
      
      // Deletar os produtos
      await ProductModel.bulkDeleteProducts(ids, storeId);
      
      console.log('[ProductController] bulkDeleteProducts - Produtos deletados com sucesso:', { count: ids.length });
      
      res.json({
        success: true,
        message: `${ids.length} produto(s) deletado(s) com sucesso`
      });
    } catch (error) {
      console.error('Erro ao deletar produtos em massa:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao deletar produtos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = ProductController; 