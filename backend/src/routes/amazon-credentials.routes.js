const express = require('express');
const { body, param } = require('express-validator');
const AmazonCredentialsController = require('../controllers/amazon-credentials.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { storeContext, checkStorePermission } = require('../middleware/store-context.middleware');

const router = express.Router();

// Todas as rotas neste arquivo requerem autenticação
router.use(authenticate);

/**
 * @route GET /api/stores/:storeId/amazon-credentials
 * @desc Obtém as credenciais da Amazon para uma loja
 * @access Privado (requer acesso à loja)
 */
router.get(
  '/:storeId/amazon-credentials',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido')
  ],
  storeContext,
  AmazonCredentialsController.getCredentials
);

/**
 * @route POST /api/stores/:storeId/amazon-credentials
 * @desc Salva ou atualiza as credenciais da Amazon para uma loja
 * @access Privado (requer role admin ou owner)
 */
router.post(
  '/:storeId/amazon-credentials',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido'),
    body('seller_id')
      .trim()
      .notEmpty()
      .withMessage('Seller ID é obrigatório'),
    body('client_id')
      .trim()
      .notEmpty()
      .withMessage('Client ID é obrigatório'),
    body('marketplace_id')
      .trim()
      .notEmpty()
      .withMessage('Marketplace ID é obrigatório')
  ],
  storeContext,
  checkStorePermission(['admin', 'owner']),
  AmazonCredentialsController.saveCredentials
);

/**
 * @route DELETE /api/stores/:storeId/amazon-credentials
 * @desc Remove as credenciais da Amazon para uma loja
 * @access Privado (requer role admin ou owner)
 */
router.delete(
  '/:storeId/amazon-credentials',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido')
  ],
  storeContext,
  checkStorePermission(['admin', 'owner']),
  AmazonCredentialsController.deleteCredentials
);

/**
 * @route POST /api/stores/:storeId/amazon-credentials/test
 * @desc Testa a conexão com a Amazon usando as credenciais armazenadas
 * @access Privado (requer acesso à loja)
 */
router.post(
  '/:storeId/amazon-credentials/test',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido')
  ],
  storeContext,
  AmazonCredentialsController.testConnection
);

module.exports = router;
