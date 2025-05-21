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

    try {
      // Verificar o token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Adicionar informações do usuário à requisição
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        isPlatformAdmin: decoded.isPlatformAdmin || false
      };
      
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
