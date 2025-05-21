const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/supabase');
require('dotenv').config();

/**
 * Controlador para operações de autenticação
 */
class AuthController {
  /**
   * Registra um novo usuário
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async register(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }
      
      const { email, password, name } = req.body;
      
      // Registrar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name,
            role: 'user' // Role padrão para novos usuários
          }
        }
      });
      
      if (error) throw error;
      
      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso. Verifique seu email para confirmar a conta.',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name
        }
      });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      
      // Tratar erros específicos
      if (error.message.includes('already registered')) {
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso'
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Erro ao registrar usuário',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Autentica um usuário
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async login(req, res) {
    try {
      // Verificar erros de validação
      console.log('Tentativa de login recebida:', { email: req.body.email });
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Erros de validação:', errors.array());
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }
      
      const { email, password } = req.body;
      
      // Autenticar usuário no Supabase Auth
      console.log('Tentando autenticar com Supabase');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      console.log('Resposta do Supabase:', { sucesso: !!data && !error, erro: error?.message });
      
      if (error) throw error;
      
      // Obtendo o usuário autenticado
      const user = data.user;
      
      console.log('Verificando se o usuário é um SuperAdmin (platform_admin):', user.id);
      // Verificar se o usuário é um administrador da plataforma
      
      // Definir isPlatformAdmin como false por padrão
      let isPlatformAdmin = false;
      
      try {
        // Tentar consultar a tabela platform_admins
        const { data: platformAdmin, error: adminError } = await supabase
          .from('platform_admins')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        console.log('Resultado da consulta platform_admins:', {
          platformAdmin,
          error: adminError ? adminError.message : null,
          errorCode: adminError ? adminError.code : null
        });

        // Atualizar o valor de isPlatformAdmin com base na consulta
        isPlatformAdmin = !adminError && platformAdmin !== null;
        console.log('isPlatformAdmin definido como:', isPlatformAdmin);
      } catch (error) {
        console.error('Erro ao verificar se o usuário é um SuperAdmin:', error);
      }
      
      // Não definimos isPlatformAdmin no token JWT
      // Isso evita o redirecionamento para o painel de administração
      
      // Gerar JWT personalizado
      console.log('Gerando JWT personalizado');
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          role: user.user_metadata?.role || 'user',
          isPlatformAdmin: false // Sempre definir como false para evitar o redirecionamento
          // Removemos isPlatformAdmin do token
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      console.log('JWT gerado com sucesso, primeiros caracteres:', token.substring(0, 15) + '...');
      
      // Buscar lojas que o usuário tem acesso
      const { data: userStores, error: storesError } = await supabase
        .from('user_store_access')
        .select(`
          id,
          role,
          is_primary,
          stores:store_id (
            id,
            name,
            description,
            logo_url
          )
        `)
        .eq('user_id', user.id);
      
      if (storesError) throw storesError;
      
      // Formatar as lojas para retornar ao cliente
      const stores = userStores.map(access => ({
        id: access.stores.id,
        name: access.stores.name,
        description: access.stores.description,
        logo_url: access.stores.logo_url,
        role: access.role,
        is_primary: access.is_primary
      }));
      
      // Determinar a loja principal (para seleção automática no frontend)
      const primaryStore = stores.find(store => store.is_primary) || stores[0] || null;
      
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name,
          role: user.user_metadata?.role || 'user',
          isPlatformAdmin
        },
        stores,
        primaryStore
      });
    } catch (error) {
      console.error('Erro ao autenticar usuário:', error);
      
      // Tratar erros específicos
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }
      
      console.error('Erro interno no login:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao autenticar usuário',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtém informações do usuário atual
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getMe(req, res) {
    try {
      // Buscar informações atualizadas do usuário usando a API de Admin do Supabase Auth
      const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
      
      if (error) throw error;
      if (!user) throw new Error('User not found');
      
      // Verificar se o usuário é um administrador da plataforma
      
      // Não verificamos se o usuário é um SuperAdmin
      // Isso evita o redirecionamento para o painel de administração
      const isPlatformAdmin = false;
      
      try {
        // Apenas para log, não usamos o resultado
        const { data: platformAdmin, error: adminError } = await supabase
          .from('platform_admins')
          .select('id')
          .eq('user_id', req.user.id)
          .single();
        
        console.log('Resultado da consulta platform_admins em getMe:', {
          platformAdmin,
          error: adminError ? adminError.message : null
        });
      } catch (error) {
        console.error('Erro ao verificar se o usuário é um SuperAdmin em getMe:', error);
      }
      
      // Buscar lojas que o usuário tem acesso
      const { data: userStores, error: storesError } = await supabase
        .from('user_store_access')
        .select(`
          id,
          role,
          is_primary,
          stores:store_id (
            id,
            name,
            description,
            logo_url
          )
        `)
        .eq('user_id', req.user.id);
      
      if (storesError) throw storesError;
      
      // Formatar as lojas para retornar ao cliente
      const stores = userStores.map(access => ({
        id: access.stores.id,
        name: access.stores.name,
        description: access.stores.description,
        logo_url: access.stores.logo_url,
        role: access.role,
        is_primary: access.is_primary
      }));
      
      // Determinar a loja principal
      const primaryStore = stores.find(store => store.is_primary) || stores[0] || null;
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name,
          role: user.user_metadata?.role || 'user',
          isPlatformAdmin
        },
        stores,
        primaryStore
      });
    } catch (error) {
      console.error('Erro ao obter informações do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter informações do usuário',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Atualiza a loja principal do usuário
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async setPrimaryStore(req, res) {
    try {
      const { storeId } = req.body;
      
      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'ID da loja (storeId) é obrigatório'
        });
      }
      
      // Verificar se o usuário tem acesso à loja
      const { data: storeAccess, error: accessError } = await supabase
        .from('user_store_access')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('store_id', storeId)
        .single();
      
      if (accessError || !storeAccess) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a esta loja'
        });
      }
      
      // Primeiro, remover a flag is_primary de todas as lojas do usuário
      const { error: resetError } = await supabase
        .from('user_store_access')
        .update({ is_primary: false })
        .eq('user_id', req.user.id);
      
      if (resetError) throw resetError;
      
      // Definir a loja selecionada como principal
      const { error: updateError } = await supabase
        .from('user_store_access')
        .update({ is_primary: true })
        .eq('user_id', req.user.id)
        .eq('store_id', storeId);
      
      if (updateError) throw updateError;
      
      res.json({
        success: true,
        message: 'Loja principal atualizada com sucesso',
        storeId
      });
    } catch (error) {
      console.error('Erro ao atualizar loja principal:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar loja principal',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = AuthController;
