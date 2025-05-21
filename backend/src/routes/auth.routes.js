const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Registra um novo usuário
 * @access Público
 */
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .withMessage('Forneça um email válido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('A senha deve ter pelo menos 6 caracteres'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('O nome é obrigatório')
  ],
  AuthController.register
);

/**
 * @route POST /api/auth/login
 * @desc Autentica um usuário
 * @access Público
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Forneça um email válido'),
    body('password')
      .notEmpty()
      .withMessage('A senha é obrigatória')
  ],
  AuthController.login
);

/**
 * @route GET /api/auth/me
 * @desc Obtém informações do usuário atual
 * @access Privado
 */
router.get('/me', authenticate, AuthController.getMe);

/**
 * @route POST /api/auth/primary-store
 * @desc Define a loja principal do usuário
 * @access Privado
 */
router.post(
  '/primary-store',
  authenticate,
  [
    body('storeId')
      .notEmpty()
      .withMessage('O ID da loja é obrigatório')
  ],
  AuthController.setPrimaryStore
);

module.exports = router;
