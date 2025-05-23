const express = require('express');
const { body, param } = require('express-validator');
const StoreController = require('../controllers/store.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { storeContext, checkStorePermission } = require('../middleware/store-context.middleware');

const router = express.Router();

// Todas as rotas neste arquivo requerem autenticação
router.use(authenticate);

/**
 * @route POST /api/stores
 * @desc Cria uma nova loja
 * @access Privado
 */
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Nome da loja é obrigatório')
      .isLength({ max: 100 })
      .withMessage('Nome da loja deve ter no máximo 100 caracteres'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Descrição deve ter no máximo 500 caracteres'),
    body('logo_url')
      .optional()
      .isURL()
      .withMessage('Logo URL deve ser uma URL válida')
  ],
  StoreController.createStore
);

/**
 * @route GET /api/stores/user
 * @desc Lista todas as lojas que o usuário tem acesso
 * @access Privado
 */
router.get('/user', StoreController.getUserStores);

/**
 * @route GET /api/users/:userId/stores
 * @desc Lista todas as lojas que um usuário específico tem acesso
 * @access Privado (Requer autenticação, permissões mais granulares TODO no controller)
 */
router.get(
  '/users/:userId/stores', // Nota: Rota de nível superior para informações de usuário
  [
    param('userId')
      .isUUID()
      .withMessage('ID do usuário inválido'),
  ],
  // authenticate já é aplicado globalmente neste router
  // storeContext e checkStorePermission não são aplicados aqui diretamente,
  // pois o contexto não é uma loja específica, mas sim um usuário.
  // A lógica de permissão para quem pode chamar isso por quem está no controller (TODO)
  StoreController.getStoresForSpecificUser
);

/**
 * @route GET /api/stores/:storeId
 * @desc Obtém detalhes de uma loja específica
 * @access Privado (requer acesso à loja)
 */
router.get(
  '/:storeId',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido')
  ],
  storeContext,
  checkStorePermission(['admin', 'user', 'owner']),
  StoreController.getStoreById
);

/**
 * @route GET /api/stores/:storeId/admin
 * @desc Obtém detalhes de uma loja específica usando supabaseAdmin (ignora políticas RLS)
 * @access Privado (apenas para o usuário elizandromartim@gmail.com)
 */
router.get(
  '/:storeId/admin',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido')
  ],
  StoreController.getStoreByIdAdmin
);

/**
 * @route PUT /api/stores/:storeId
 * @desc Atualiza uma loja existente
 * @access Privado (apenas owner)
 */
router.put(
  '/:storeId',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Nome da loja não pode ser vazio')
      .isLength({ max: 100 })
      .withMessage('Nome da loja deve ter no máximo 100 caracteres'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Descrição deve ter no máximo 500 caracteres'),
    body('logo_url')
      .optional()
      .isURL()
      .withMessage('Logo URL deve ser uma URL válida'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active deve ser um booleano')
  ],
  storeContext,
  checkStorePermission(['owner']),
  StoreController.updateStore
);

/**
 * @route GET /api/stores/:storeId/users
 * @desc Lista usuários com acesso a uma loja
 * @access Privado (admin ou owner)
 */
router.get(
  '/:storeId/users',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido')
  ],
  storeContext,
  checkStorePermission(['admin', 'owner']),
  StoreController.getStoreUsers
);

/**
 * @route GET /api/stores/:storeId/users/pending-count
 * @desc Conta usuários com status 'pending' em uma loja
 * @access Privado (admin ou owner)
 */
router.get(
  '/:storeId/users/pending-count',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido')
  ],
  storeContext,
  checkStorePermission(['admin', 'owner']),
  StoreController.getPendingUsersCount
);

/**
 * @route POST /api/stores/:storeId/users
 * @desc Adiciona um usuário a uma loja
 * @access Privado (admin ou owner)
 */
router.post(
  '/:storeId/users',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido'),
    body('email')
      .isEmail()
      .withMessage('Email inválido'),
    body('role')
      .isIn(['staff', 'manager', 'admin', 'owner'])
      .withMessage('Role inválida')
  ],
  storeContext,
  checkStorePermission(['admin', 'owner']),
  StoreController.addUserToStore
);

/**
 * @route PUT /api/stores/:storeId/users/:userId
 * @desc Atualiza a role de um usuário em uma loja
 * @access Privado (owner)
 */
router.put(
  '/:storeId/users/:userId',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido'),
    param('userId')
      .isUUID()
      .withMessage('ID do usuário inválido'),
    body('role')
      .isIn(['staff', 'manager', 'admin', 'owner'])
      .withMessage('Role inválida')
  ],
  storeContext,
  checkStorePermission(['owner']),
  StoreController.updateUserRole
);

/**
 * @route PUT /api/stores/:storeId/users/:userId/status
 * @desc Atualiza o status de um usuário em uma loja
 * @access Privado (owner, admin)
 */
router.put(
  '/:storeId/users/:userId/status',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido'),
    param('userId')
      .isUUID()
      .withMessage('ID do usuário inválido'),
    body('status')
      .isIn(['active', 'pending', 'suspended'])
      .withMessage('Status inválido')
  ],
  storeContext,
  checkStorePermission(['owner', 'admin']),
  StoreController.updateUserStatus
);

/**
 * @route PUT /api/stores/:storeId/users/:userId/metadata
 * @desc Atualiza os metadados de um usuário (nome, telefone, etc)
 * @access Privado (owner, admin)
 */
router.put(
  '/:storeId/users/:userId/metadata',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido'),
    param('userId')
      .isUUID()
      .withMessage('ID do usuário inválido')
  ],
  storeContext,
  checkStorePermission(['owner', 'admin']),
  StoreController.updateUserMetadata
);

/**
 * @route DELETE /api/stores/:storeId/users/:userId
 * @desc Remove um usuário de uma loja
 * @access Privado (admin ou owner)
 */
router.delete(
  '/:storeId/users/:userId',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido'),
    param('userId')
      .isUUID()
      .withMessage('ID do usuário inválido')
  ],
  storeContext,
  checkStorePermission(['admin', 'owner']),
  StoreController.removeUserFromStore
);

/**
 * @route DELETE /api/stores/:storeId
 * @desc Exclui uma loja
 * @access Privado (apenas owner)
 */
router.delete(
  '/:storeId',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido')
  ],
  storeContext,
  checkStorePermission(['owner']),
  StoreController.deleteStore
);

/**
 * @route GET /api/stores/:storeId/user/:userId/check
 * @desc Verificação de diagnóstico para um usuário específico
 * @access Privado (owner, admin)
 */
router.get(
  '/:storeId/user/:userId/check',
  StoreController.checkUserAccess
);

/**
 * @route GET /api/stores/:storeId/candidate-users
 * @desc Lista usuários candidatos que ainda não pertencem à loja especificada.
 * @access Privado (admin ou owner)
 */
router.get(
  '/:storeId/candidate-users',
  [
    param('storeId')
      .isUUID()
      .withMessage('ID da loja inválido')
  ],
  storeContext,
  checkStorePermission(['admin', 'owner']),
  StoreController.getCandidateUsers
);

/**
 * @route GET /api/stores/system/all
 * @desc Lista todas as lojas cadastradas no sistema.
 * @access Privado (TODO: Restringir a admin da plataforma)
 */
router.get(
  '/system/all', 
  // authenticate já é aplicado globalmente neste router
  // TODO: Adicionar middleware de permissão específico para admin da plataforma
  StoreController.getAllStoresSystem
);

module.exports = router;
