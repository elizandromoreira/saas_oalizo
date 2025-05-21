const { validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/supabase');
require('dotenv').config();

/**
 * Controlador para operações de lojas
 */
class StoreController {
  /**
   * Cria uma nova loja
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async createStore(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }
      
      const { name, description, logo_url } = req.body;
      const userId = req.user.id;
      
      // Transação para criar loja e associar o usuário como owner
      // Usando supabaseAdmin para contornar as políticas de RLS
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .insert({
          name,
          description,
          logo_url,
          is_active: true
        })
        .select()
        .single();
      
      if (storeError) throw storeError;
      
      // Associar o usuário atual como owner da loja
      // Usando supabaseAdmin para contornar as políticas de RLS
      const { error: accessError } = await supabaseAdmin
        .from('user_store_access')
        .insert({
          user_id: userId,
          store_id: store.id,
          role: 'owner',
          is_primary: true
        });
      
      if (accessError) {
        // Remover a loja criada se não conseguir associar o usuário
        await supabaseAdmin
          .from('stores')
          .delete()
          .eq('id', store.id);
        
        throw accessError;
      }
      
      res.status(201).json({
        success: true,
        message: 'Loja criada com sucesso',
        store
      });
    } catch (error) {
      console.error('Erro ao criar loja:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar loja',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Lista todas as lojas que o usuário tem acesso
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getUserStores(req, res) {
    try {
      const userId = req.user.id;
      
      // Buscar lojas que o usuário tem acesso
      const { data, error } = await supabase
        .from('user_store_access')
        .select(`
          id,
          role,
          is_primary,
          stores:store_id (
            id,
            name,
            description,
            logo_url,
            is_active,
            has_amazon_credentials,
            has_amazon_credentials_attempted,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      console.log('Dados das lojas recuperados:', data);
      
      // Formatar os dados para retornar apenas as lojas com informações de acesso
      const stores = data.map(access => ({
        id: access.stores.id,
        name: access.stores.name,
        description: access.stores.description,
        logo_url: access.stores.logo_url,
        is_active: access.stores.is_active,
        // Usar os valores reais da tabela ou valores padrão se não existirem
        has_amazon_credentials: access.stores.has_amazon_credentials || false,
        has_amazon_credentials_attempted: access.stores.has_amazon_credentials_attempted || false,
        created_at: access.stores.created_at,
        updated_at: access.stores.updated_at,
        role: access.role,
        is_primary: access.is_primary,
        access_id: access.id
      }));
      
      res.json({
        success: true,
        stores
      });
    } catch (error) {
      console.error('Erro ao listar lojas do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar lojas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtém detalhes de uma loja específica
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getStoreById(req, res) {
    try {
      const { storeId } = req.params;
      
      // Buscar detalhes da loja
      const { data: store, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();
      
      if (error) throw error;
      
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Loja não encontrada'
        });
      }
      
      // Buscar informações de acesso do usuário à loja
      const { data: access, error: accessError } = await supabase
        .from('user_store_access')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('store_id', storeId)
        .single();
      
      if (accessError) throw accessError;
      
      // Combinar informações da loja e acesso
      const storeWithAccess = {
        ...store,
        role: access.role,
        is_primary: access.is_primary
      };
      
      res.json({
        success: true,
        store: storeWithAccess
      });
    } catch (error) {
      console.error(`Erro ao buscar loja com ID ${req.params.storeId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar detalhes da loja',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtém detalhes de uma loja específica usando supabaseAdmin (ignora políticas RLS)
   * Este endpoint é usado apenas para o usuário especial elizandromartim@gmail.com
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getStoreByIdAdmin(req, res) {
    try {
      const { storeId } = req.params;
      
      // Verificar se o usuário é elizandromartim@gmail.com
      if (req.user.id !== 'c0a70134-30da-40de-a4aa-5f4e1cd84ff2') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a este endpoint'
        });
      }
      
      console.log(`Buscando informações da loja ${storeId} usando supabaseAdmin...`);
      
      // Usar o cliente supabaseAdmin para ignorar políticas RLS
      const { data, error } = await supabaseAdmin
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();
      
      if (error) {
        console.error('Erro ao buscar informações da loja:', error);
        return res.status(404).json({
          success: false,
          message: 'Loja não encontrada'
        });
      }
      
      console.log('Loja encontrada:', data);
      
      res.json({
        success: true,
        store: data
      });
    } catch (error) {
      console.error('Erro ao obter informações da loja:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter informações da loja'
      });
    }
  }

  /**
   * Atualiza uma loja existente
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async updateStore(req, res) {
    try {
      const { storeId } = req.params;
      const { name, description, logo_url, is_active } = req.body;
      
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }
      
      // Verificar se o usuário tem permissão para atualizar a loja (deve ser owner)
      const { data: access, error: accessError } = await supabase
        .from('user_store_access')
        .select('role')
        .eq('user_id', req.user.id)
        .eq('store_id', storeId)
        .single();
      
      if (accessError || !access) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a esta loja'
        });
      }
      
      if (access.role !== 'owner') {
        return res.status(403).json({
          success: false,
          message: 'Apenas o proprietário pode atualizar a loja'
        });
      }
      
      // Atualizar a loja
      // Usando supabaseAdmin para contornar as políticas de RLS
      const { data: updatedStore, error } = await supabaseAdmin
        .from('stores')
        .update({
          name,
          description,
          logo_url,
          is_active
        })
        .eq('id', storeId)
        .select()
        .single();
      
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'Loja atualizada com sucesso',
        store: updatedStore
      });
    } catch (error) {
      console.error(`Erro ao atualizar loja com ID ${req.params.storeId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar loja',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Lista usuários com acesso a uma loja
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getStoreUsers(req, res) {
    try {
      const { storeId } = req.params;
      
      console.log(`Buscando usuários para loja ${storeId}`);
      
      // Buscar usuários com acesso à loja
      const { data: accessData, error: accessError } = await supabaseAdmin
        .from('user_store_access')
        .select('id, user_id, role, is_primary, status, created_at')
        .eq('store_id', storeId);
      
      if (accessError) {
        console.error(`Erro ao buscar acessos para a loja ${storeId}:`, accessError);
        throw accessError;
      }
      
      console.log(`Encontrados ${accessData?.length || 0} acessos para a loja`);
      
      if (!accessData || accessData.length === 0) {
        return res.json({
          success: true,
          users: []
        });
      }
      
      // Buscar detalhes dos usuários diretamente
      const userIds = accessData.map(access => access.user_id);
      console.log(`Buscando detalhes para ${userIds.length} usuários`);
      
      try {
        // Buscar dados usando a API admin do Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (authError) {
          console.error('Erro ao listar usuários:', authError);
          throw authError;
        }
        
        console.log(`Total de usuários encontrados na API Auth: ${authData?.users?.length}`);
        
        // Filtrar os usuários encontrados pelo IDs que temos
        const filteredUsers = authData.users.filter(user => userIds.includes(user.id));
        console.log(`Encontrados ${filteredUsers.length} usuários via admin API`);
        
        // Combinar os dados de acesso com os usuários
        const users = accessData.map(access => {
          const user = filteredUsers.find(u => u.id === access.user_id) || {};
          return {
            id: access.user_id,
            email: user.email || 'email@indisponivel.com',
            name: user.user_metadata?.name,
            phone: user.user_metadata?.phone,
            role: access.role,
            is_primary: access.is_primary,
            status: access.status || 'active', // Usar o status ou definir como 'active' por padrão
            access_id: access.id,
            created_at: access.created_at
          };
        });
        
        console.log(`Retornando ${users.length} usuários`);
        return res.json({
          success: true,
          users
        });
      } catch (userFetchError) {
        console.error('Falha ao buscar detalhes dos usuários:', userFetchError);
        
        // Fallback: retornar apenas dados básicos
        const users = accessData.map(access => ({
          id: access.user_id,
          email: 'email@indisponivel.com',
          role: access.role,
          is_primary: access.is_primary,
          status: access.status || 'active',
          access_id: access.id,
          created_at: access.created_at
        }));
        
        return res.json({
          success: true,
          users,
          warning: "Detalhes completos dos usuários indisponíveis"
        });
      }
    } catch (error) {
      console.error(`Erro ao listar usuários da loja ${req.params.storeId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar usuários da loja',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Adiciona um usuário a uma loja
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async addUserToStore(req, res) {
    try {
      const { storeId } = req.params;
      const { email, role, name, phone, password, createNewUser } = req.body;
      
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }
      
      console.log(`Tentando adicionar usuário ${email} à loja ${storeId} com papel ${role}`);
      
      // Usar API de listagem de usuários
      console.log('Tentando buscar usuário via API listUsers');
      const { data: authSearch, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 100
      });
      
      if (authError) {
        console.error('Erro ao listar usuários:', authError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar usuário'
        });
      }
      
      // Filtrar usuários pelo email
      let user = authSearch?.users?.find(u => u.email === email);
      
      // Se o usuário não for encontrado e createNewUser estiver habilitado, criar novo usuário
      if (!user && createNewUser) {
        if (!password) {
          return res.status(400).json({
            success: false,
            message: 'Senha obrigatória para criar novo usuário'
          });
        }
        
        console.log(`Usuário não encontrado. Criando novo usuário: ${email}`);
        
        // Criar usuário com metadata
        const metadata = {
          ...(name && { name }),
          ...(phone && { phone })
        };
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: metadata
        });
        
        if (createError) {
          console.error('Erro ao criar novo usuário:', createError);
          return res.status(500).json({
            success: false,
            message: 'Erro ao criar novo usuário',
            error: createError.message
          });
        }
        
        console.log(`Novo usuário criado com sucesso: ${newUser.user.email}`);
        user = newUser.user;
      } else if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado. Marque a opção "Criar novo usuário" para registrar este email.'
        });
      } else {
        console.log(`Usuário encontrado via listUsers: ${user.email}`);
      }
      
      // Atualizar os metadados do usuário se necessário e se o usuário existir
      if (user && (name || phone)) {
        const updatedMetadata = {
          ...user.user_metadata,
          ...(name && { name }),
          ...(phone && { phone })
        };
        
        // Atualizar os metadados do usuário
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { user_metadata: updatedMetadata }
        );
        
        if (updateError) {
          console.error('Erro ao atualizar metadados do usuário:', updateError);
        } else {
          console.log('Metadados do usuário atualizados com sucesso');
          user.user_metadata = updatedMetadata;
        }
      }
      
      // Prosseguir com o usuário encontrado
      return await processUserAdd(user.id, user.email, user.user_metadata);
      
      // Função auxiliar para processar a adição do usuário
      async function processUserAdd(userId, userEmail, userMetadata = {}) {
        // Verificar se o usuário já tem acesso à loja
        const { data: existingAccess, error: accessCheckError } = await supabase
          .from('user_store_access')
          .select('id')
          .eq('user_id', userId)
          .eq('store_id', storeId);
        
        if (accessCheckError) {
          console.error('Erro ao verificar acesso existente:', accessCheckError);
          throw accessCheckError;
        }
        
        if (existingAccess && existingAccess.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Este usuário já tem acesso a esta loja'
          });
        }
        
        // Adicionar o usuário à loja
        // Usando supabaseAdmin para contornar as políticas de RLS
        const { data: access, error: accessError } = await supabaseAdmin
          .from('user_store_access')
          .insert({
            user_id: userId,
            store_id: storeId,
            role,
            is_primary: false,
            status: 'active' // Status ativo para usuários adicionados diretamente
          })
          .select()
          .single();
        
        if (accessError) {
          console.error('Erro ao adicionar usuário à loja:', accessError);
          throw accessError;
        }
        
        res.status(201).json({
          success: true,
          message: 'Usuário adicionado à loja com sucesso',
          access: {
            ...access,
            user: {
              id: userId,
              email: userEmail,
              name: userMetadata?.name,
              phone: userMetadata?.phone
            }
          }
        });
      }
    } catch (error) {
      console.error(`Erro ao adicionar usuário à loja ${req.params.storeId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao adicionar usuário à loja',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Atualiza a role de um usuário em uma loja
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async updateUserRole(req, res) {
    try {
      const { storeId, userId } = req.params;
      const { role } = req.body;
      
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }
      
      // Verificar se o usuário que está sendo atualizado não é o próprio solicitante
      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível alterar sua própria role'
        });
      }
      
      // Atualizar a role do usuário
      // Usando supabaseAdmin para contornar as políticas de RLS
      const { data, error } = await supabaseAdmin
        .from('user_store_access')
        .update({ role })
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .select()
        .single();
      
      if (error) throw error;
      
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Acesso não encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Role atualizada com sucesso',
        access: data
      });
    } catch (error) {
      console.error(`Erro ao atualizar role do usuário:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar role do usuário',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Atualiza o status de um usuário em uma loja
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async updateUserStatus(req, res) {
    try {
      const { storeId, userId } = req.params;
      const { status } = req.body;
      
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }
      
      // Verificar se o status é válido
      const validStatuses = ['active', 'pending', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido. Use: active, pending ou suspended'
        });
      }
      
      // Verificar se o usuário que está sendo atualizado não é o próprio solicitante
      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível alterar seu próprio status'
        });
      }
      
      // Verificar se o usuário atual tem permissão para atualizar status (deve ser owner ou admin)
      const { data: userAccess, error: accessError } = await supabase
        .from('user_store_access')
        .select('role')
        .eq('user_id', req.user.id)
        .eq('store_id', storeId)
        .single();
      
      if (accessError || !userAccess) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a esta loja'
        });
      }
      
      if (!['owner', 'admin'].includes(userAccess.role)) {
        return res.status(403).json({
          success: false,
          message: 'Apenas proprietários e administradores podem atualizar o status dos usuários'
        });
      }
      
      // Atualizar o status do usuário
      // Usando supabaseAdmin para contornar as políticas de RLS
      const { data, error } = await supabaseAdmin
        .from('user_store_access')
        .update({ status })
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .select()
        .single();
      
      if (error) throw error;
      
      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Acesso não encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Status do usuário atualizado com sucesso',
        access: data
      });
    } catch (error) {
      console.error(`Erro ao atualizar status do usuário:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status do usuário',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Atualiza os metadados do usuário (nome, telefone, etc)
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async updateUserMetadata(req, res) {
    try {
      const { storeId, userId } = req.params;
      const { name, phone } = req.body;
      
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }
      
      // Verificar se o usuário tem permissão (deve ser owner ou admin)
      const { data: userAccess, error: accessError } = await supabase
        .from('user_store_access')
        .select('role')
        .eq('user_id', req.user.id)
        .eq('store_id', storeId)
        .single();
      
      if (accessError || !userAccess) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a esta loja'
        });
      }
      
      if (!['owner', 'admin'].includes(userAccess.role)) {
        return res.status(403).json({
          success: false,
          message: 'Apenas proprietários e administradores podem atualizar metadados dos usuários'
        });
      }
      
      // Obter metadados atuais do usuário
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !userData) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      // Combinar os metadados existentes com os novos
      const currentMetadata = userData.user.user_metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        ...(name && { name }),
        ...(phone && { phone })
      };
      
      // Atualizar os metadados do usuário
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { user_metadata: updatedMetadata }
      );
      
      if (updateError) {
        console.error('Erro ao atualizar metadados do usuário:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar metadados do usuário',
          error: updateError.message
        });
      }
      
      res.json({
        success: true,
        message: 'Metadados do usuário atualizados com sucesso',
        user: {
          id: updatedUser.user.id,
          email: updatedUser.user.email,
          name: updatedUser.user.user_metadata?.name,
          phone: updatedUser.user.user_metadata?.phone
        }
      });
    } catch (error) {
      console.error(`Erro ao atualizar metadados do usuário:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar metadados do usuário',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Remove um usuário de uma loja
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async removeUserFromStore(req, res) {
    try {
      const { storeId, userId } = req.params;
      
      // Verificar se o usuário que está sendo removido não é o próprio solicitante
      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível remover a si mesmo da loja'
        });
      }
      
      // Verificar se o usuário que está sendo removido não é o único owner
      const { data: owners, error: ownersError } = await supabase
        .from('user_store_access')
        .select('user_id')
        .eq('store_id', storeId)
        .eq('role', 'owner');
      
      if (ownersError) throw ownersError;
      
      if (owners.length === 1 && owners[0].user_id === userId) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível remover o único proprietário da loja'
        });
      }
      
      // Remover o usuário da loja
      // Usando supabaseAdmin para contornar as políticas de RLS
      const { error } = await supabaseAdmin
        .from('user_store_access')
        .delete()
        .eq('user_id', userId)
        .eq('store_id', storeId);
      
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'Usuário removido da loja com sucesso'
      });
    } catch (error) {
      console.error(`Erro ao remover usuário da loja:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover usuário da loja',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Exclui uma loja
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async deleteStore(req, res) {
    try {
      const { storeId } = req.params;
      
      // Verificar se o usuário é o proprietário da loja
      // Isso já é verificado pelo middleware checkStorePermission(['owner'])
      
      // Primeiro, remover todos os acessos de usuários à loja
      const { error: accessError } = await supabaseAdmin
        .from('user_store_access')
        .delete()
        .eq('store_id', storeId);
      
      if (accessError) throw accessError;
      
      // Skip removing Amazon credentials since the table doesn't exist yet
      // We'll add this back when the table is created
      
      // Finalmente, remover a loja
      const { error: storeError } = await supabaseAdmin
        .from('stores')
        .delete()
        .eq('id', storeId);
      
      if (storeError) throw storeError;
      
      res.json({
        success: true,
        message: 'Loja excluída com sucesso'
      });
    } catch (error) {
      console.error(`Erro ao excluir loja:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir loja',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Método temporário para verificar se um usuário específico existe e tem acesso à loja
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async checkUserAccess(req, res) {
    try {
      const { storeId, userId } = req.params;
      
      console.log(`DIAGNÓSTICO: Verificando acesso do usuário ${userId} à loja ${storeId}`);
      
      // 1. Verificar se o usuário existe no Auth
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError) {
        return res.json({
          success: false,
          message: `Erro ao verificar usuário: ${userError.message}`,
          exists: false
        });
      }
      
      if (!userData || !userData.user) {
        return res.json({
          success: false,
          message: 'Usuário não encontrado na tabela auth.users',
          exists: false
        });
      }
      
      // 2. Verificar se o usuário tem acesso à loja
      const { data: accessData, error: accessError } = await supabaseAdmin
        .from('user_store_access')
        .select('*')
        .eq('user_id', userId)
        .eq('store_id', storeId);
      
      if (accessError) {
        return res.json({
          success: false,
          message: `Erro ao verificar acesso: ${accessError.message}`,
          user: userData.user,
          hasAccess: false
        });
      }
      
      const hasAccess = accessData && accessData.length > 0;
      
      // 3. Tentar buscar lista completa de usuários para verificar se está sendo retornado pela API
      const { data: authList, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 100
      });
      
      let isInList = false;
      if (!authListError && authList) {
        isInList = authList.users.some(u => u.id === userId);
      }
      
      return res.json({
        success: true,
        user: {
          id: userData.user.id,
          email: userData.user.email,
          metadata: userData.user.user_metadata
        },
        hasAccess,
        accessData: hasAccess ? accessData : null,
        isInUsersList: isInList
      });
    } catch (error) {
      console.error('Erro ao verificar acesso do usuário:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar acesso do usuário',
        error: error.message
      });
    }
  }
}

module.exports = StoreController;
