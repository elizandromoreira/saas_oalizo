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
    console.log('Requisição recebida em authenticate middleware:', req.method, req.originalUrl);
    console.log('Headers de autenticação:', req.headers.authorization ? 'Presente' : 'Ausente');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Token não fornecido ou formato inválido:', authHeader);
      return res.status(401).json({
        success: false,
        message: 'Não autorizado: Token de autenticação não fornecido'
      });
    }

    // Extrair o token
    const token = authHeader.split(' ')[1];
    console.log('Token extraído:', token.substring(0, 15) + '...');

    try {
      // Verificar o token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token JWT verificado com sucesso para usuário:', decoded.id);
      console.log('Detalhes do token decodificado:', {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        isPlatformAdmin: decoded.isPlatformAdmin
      });
      
      // Adicionar informações do usuário à requisição
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        isPlatformAdmin: decoded.isPlatformAdmin || false
      };
      
      console.log('Autenticação bem-sucedida, prosseguindo com a requisição');
      next();
    } catch (error) {
      console.error('Erro ao verificar token:', error);
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
