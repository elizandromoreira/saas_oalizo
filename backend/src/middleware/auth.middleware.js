const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/supabase');
require('dotenv').config();

/**
 * Middleware de autenticação
 * Verifica se o token JWT é válido e adiciona o usuário à requisição
 */
const authenticate = async (req, res, next) => {
  try {
    // Verificar se o token está presente no header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Autenticação falhou: Token não fornecido ou formato inválido');
      return res.status(401).json({
        success: false,
        message: 'Não autorizado: Token de autenticação não fornecido'
      });
    }

    // Extrair o token
    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      console.error('[AuthMiddleware] FATAL ERROR: JWT_SECRET is not defined in environment variables. Please check your .env file.');
      return res.status(500).json({
        success: false,
        message: 'Erro de configuração interna do servidor: Segredo JWT não configurado.'
      });
    }

    try {
      // Verificar o token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[AuthMiddleware] Token Decoded Object:', JSON.stringify(decoded, null, 2)); // Log para ver o objeto decodificado
      
      // Adicionar informações do usuário à requisição
      const isPlatformAdmin = decoded.app_metadata?.platform_role === 'admin'; 

      // A verificação original era por decoded.sub. O token atual tem decoded.id.
      if (!decoded.id) { 
        console.error('[AuthMiddleware] Error: decoded.id is undefined. User identifier is missing from token. Full decoded token logged above.');
        return res.status(401).json({
          success: false,
          message: 'Não autorizado: Informação do usuário (id) ausente no token.' // Mensagem atualizada
        });
      }

      req.user = {
        id: decoded.id, 
        email: decoded.email,
        app_metadata: decoded.app_metadata, 
        user_metadata: decoded.user_metadata, 
        isPlatformAdmin: isPlatformAdmin 
        // 'role' global foi removido; a role da plataforma é 'isPlatformAdmin',
        // e a role da loja é gerenciada pelo storeContext
      };
      
      // Log para depuração
      // console.log('[AuthMiddleware] User Decoded:', JSON.stringify(req.user, null, 2));

      next();
    } catch (error) {
      console.error('Erro ao verificar token:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Não autorizado: Token inválido ou expirado'
      });
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
};

module.exports = {
  authenticate
};
