const express = require('express');
const { body, param, query } = require('express-validator');
const ProductController = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

// Todas as rotas de produtos requerem autenticação
router.use(authenticate);

// Log para depuração de rotas
router.use((req, res, next) => {
  console.log('[ProductRoutes] Requisição recebida:', {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: Object.keys(req.query).length > 0 ? req.query : 'sem query params',
    body: req.body ? 'corpo presente' : 'sem corpo'
  });
  next();
});

/**
 * @route GET /api/stores/:storeId/products
 * @desc Obtém lista de produtos com paginação e filtros
 * @access Private
 */
router.get(
  '/',
  [
    // Validação do parâmetro storeId
    param('storeId').isUUID().withMessage('ID da loja inválido'),
    
    // Validação opcional dos parâmetros de consulta
    query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordem deve ser "asc" ou "desc"')
  ],
  ProductController.getProducts
);

/**
 * @route GET /api/stores/:storeId/products/:productId
 * @desc Obtém um produto pelo ID
 * @access Private
 */
router.get(
  '/:productId',
  [
    // Validação dos parâmetros
    param('storeId').isUUID().withMessage('ID da loja inválido'),
    param('productId').isUUID().withMessage('ID do produto inválido')
  ],
  ProductController.getProductById
);

/**
 * @route POST /api/stores/:storeId/products
 * @desc Cria um novo produto
 * @access Private
 */
router.post(
  '/',
  [
    // Validação do parâmetro storeId
    param('storeId').isUUID().withMessage('ID da loja inválido'),
    
    // Validação dos campos obrigatórios
    body('amz_asin')
      .optional()
      .isString()
      .isLength({ min: 1, max: 20 })
      .withMessage('ASIN deve ter entre 1 e 20 caracteres'),
    
    body('amz_sku')
      .optional()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('SKU Amazon deve ter entre 1 e 50 caracteres'),
    
    body('amz_title')
      .optional()
      .isString()
      .withMessage('Título Amazon deve ser uma string'),
    
    body('supplier_sku')
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('SKU do fornecedor é obrigatório e deve ter entre 1 e 50 caracteres'),
    
    body('supplier_brand')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Marca do fornecedor deve ter entre 1 e 100 caracteres'),
    
    body('supplier_source')
      .optional()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Fonte do fornecedor deve ter entre 1 e 50 caracteres'),
    
    body('supplier_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Preço do fornecedor deve ser um número positivo'),
    
    body('supplier_price_shipping')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Preço de envio do fornecedor deve ser um número positivo'),
    
    body('amz_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Preço Amazon deve ser um número positivo'),
    
    body('amz_price_shipping')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Preço de envio Amazon deve ser um número positivo'),
    
    body('supplier_quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Quantidade deve ser um número inteiro não negativo')
  ],
  ProductController.createProduct
);

/**
 * @route PATCH /api/stores/:storeId/products/:productId
 * @desc Atualiza campos editáveis de um produto
 * @access Private
 */
router.patch(
  '/:productId',
  [
    // Validação dos parâmetros
    param('storeId').isUUID().withMessage('ID da loja inválido'),
    param('productId').isUUID().withMessage('ID do produto inválido'),
    
    // Validação dos campos editáveis
    body('supplier_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Preço do fornecedor deve ser um número positivo'),
    
    body('supplier_price_shipping')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Preço de envio do fornecedor deve ser um número positivo'),
    
    body('amz_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Preço Amazon deve ser um número positivo'),
    
    body('amz_price_shipping')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Preço de envio Amazon deve ser um número positivo'),
    
    body('supplier_handling_time')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Tempo de manuseio do fornecedor deve ser um número inteiro não negativo'),
    
    body('store_handling_time')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Tempo de manuseio da loja deve ser um número inteiro não negativo'),
    
    body('amz_handling_time')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Tempo de manuseio da Amazon deve ser um número inteiro não negativo'),
    
    body('supplier_quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Quantidade deve ser um número inteiro não negativo')
  ],
  ProductController.updateProduct
);

/**
 * @route DELETE /api/stores/:storeId/products/:productId
 * @desc Deleta um produto pelo ID
 * @access Private
 */
router.delete(
  '/:productId',
  [
    // Validação do parâmetro storeId
    param('storeId').isUUID().withMessage('ID da loja inválido'),
    param('productId').isUUID().withMessage('ID do produto inválido')
  ],
  ProductController.deleteProduct
);

/**
 * ATENÇÃO: Esta rota deve ser definida APÓS a rota '/:productId' para evitar conflitos
 * Express interpreta '/bulk' como um parâmetro dinâmico se esta rota vier antes
 * 
 * @route DELETE /api/stores/:storeId/products/bulk
 * @desc Deleta múltiplos produtos pelos IDs
 * @access Private
 */
router.delete( 
  '/bulk',
  [
    // Validação do parâmetro storeId
    param('storeId').isUUID().withMessage('ID da loja inválido'),
    
    // Validação do corpo da requisição
    body('ids')
      .isArray()
      .withMessage('IDs devem ser fornecidos em um array')
      .notEmpty()
      .withMessage('O array de IDs não pode estar vazio'),
    body('ids.*')
      .isUUID()
      .withMessage('Todos os IDs devem ser UUIDs válidos')
  ],
  ProductController.bulkDeleteProducts
);

module.exports = router; 