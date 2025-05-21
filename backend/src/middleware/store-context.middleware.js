const { supabase } = require('../config/supabase');

/**
 * Middleware de contexto de loja
 * Verifica se o usuário tem acesso à loja especificada e adiciona o contexto da loja à requisição
 */
const storeContext = async (req, res, next) => {
  try {
    // Obter store_id do header, query param, URL param ou body
    const storeId = req.headers['x-store-id'] || 
                   req.query.store_id || 
                   req.params.storeId || 
                   (req.body && req.body.store_id);
    
    if (!storeId) {
      console.error('Store ID não encontrado na requisição');
      
      return res.status(400).json({
        success: false,
        message: 'ID da loja (store_id) é obrigatório'
      });
    }
    
    // Declare accessRecord outside the try block so it's available throughout the function
    let accessRecord = null;
    
    // SOLUÇÃO ESPECÍFICA: Permitir que o usuário elizandromartim@gmail.com acesse todas as lojas
    // Verificar se o usuário é elizandromartim@gmail.com pelo ID
    if (req.user.id === 'c0a70134-30da-40de-a4aa-5f4e1cd84ff2') {
      console.log('Usuário elizandromartim@gmail.com: acesso especial à loja');
      
      try {
        // Tentar buscar a loja com uma consulta mais simples
        const { data: allStores, error: allStoresError } = await supabase
          .from('stores')
          .select('id, name, is_active');
        
        if (allStoresError) {
          console.error('Erro ao buscar todas as lojas:', allStoresError);
        } else {
          // Verificar se a loja específica existe
          const storeInfo = allStores.find(store => store.id === storeId);
          
          if (storeInfo) {
            if (!storeInfo.is_active) {
              return res.status(403).json({
                success: false,
                message: 'Esta loja está desativada'
              });
            }
            
            // Adicionar contexto da loja à requisição para o usuário especial
            req.storeContext = {
              storeId,
              storeName: storeInfo.name,
              role: 'owner', // Acesso equivalente a owner
              isSpecialAccess: true
            };
            
            // Continuar para o próximo middleware ou controlador
            return next();
          } else {
            console.error(`Loja com ID ${storeId} não encontrada`);
          }
        }
        
        // Se chegou aqui, tentar a consulta original
        const { data: storeInfo, error: storeError } = await supabase
          .from('stores')
          .select('name, is_active')
          .eq('id', storeId)
          .single();
        
        if (storeError) {
          console.error('Erro ao buscar informações da loja para usuário especial');
          return res.status(404).json({
            success: false,
            message: 'Loja não encontrada'
          });
        }
        
        if (!storeInfo.is_active) {
          return res.status(403).json({
            success: false,
            message: 'Esta loja está desativada'
          });
        }
        
        // Adicionar contexto da loja à requisição para o usuário especial
        req.storeContext = {
          storeId,
          storeName: storeInfo.name,
          role: 'owner', // Acesso equivalente a owner
          isSpecialAccess: true
        };
        
        // Continuar para o próximo middleware ou controlador
        return next();
      } catch (error) {
        console.error('Erro ao processar acesso especial à loja');
        return res.status(500).json({
          success: false,
          message: 'Erro interno ao verificar acesso à loja'
        });
      }
    }

    // Verificar se o usuário é um SuperAdmin
    if (req.user.isPlatformAdmin) {
      console.log('SuperAdmin detected, bypassing store access check for user:', req.user.id);
      
      // Buscar informações da loja diretamente
      const { data: storeInfo, error: storeError } = await supabase
        .from('stores')
        .select('name, is_active')
        .eq('id', storeId)
        .single();
      
      if (storeError || !storeInfo) {
        console.error('Erro ao buscar informações da loja para SuperAdmin:', storeError);
        return res.status(404).json({
          success: false,
          message: 'Loja não encontrada'
        });
      }
      
      if (!storeInfo.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Esta loja está desativada'
        });
      }
      
      // Adicionar contexto da loja à requisição para SuperAdmin
      req.storeContext = {
        storeId,
        storeName: storeInfo.name,
        role: 'owner', // SuperAdmin tem acesso equivalente a owner
        isSuperAdmin: true
      };
      
      // Continuar para o próximo middleware ou controlador
      return next();
    }
    
    let storeData = null;
    
    try {
      // Check if this user created the store but doesn't have access yet
      // This is a temporary fix for store creation issues
      let isNewStore = false;
      
      try {
        // First, let's check if the store exists and was recently created
        const { data: newStore, error: newStoreError } = await supabase
          .from('stores')
          .select('id, name, is_active, created_at')
          .eq('id', storeId)
          .single();
        
        if (!newStoreError && newStore) {
          storeData = newStore;
          
          // Check if store was created recently (within the last 5 minutes)
          const storeCreatedAt = new Date(newStore.created_at);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          
          if (storeCreatedAt > fiveMinutesAgo) {
            isNewStore = true;
            console.log(`Loja ${storeId} foi criada recentemente`);
          }
        }
      } catch (storeCheckError) {
        console.error('Erro ao verificar existência da loja');
      }
      
      // Verify if the user has access to the store
      const { data, error } = await supabase
        .from('user_store_access')
        .select('role, stores(name, is_active)')
        .eq('user_id', req.user.id)
        .eq('store_id', storeId);
      
      // Logging simplificado
      if (data && data.length > 0) {
        console.log(`Acesso à loja verificado: usuário ${req.user.id} tem role ${data[0].role}`);
      } else if (error) {
        console.error('Erro ao verificar acesso à loja');
      } else {
        console.log(`Usuário ${req.user.id} não tem acesso à loja ${storeId}`);
      }
      
      // If it's a new store and user has no access, automatically grant access
      if (isNewStore && (!data || data.length === 0)) {
        console.log(`Concedendo acesso automático para usuário à nova loja ${storeId}`);
        
        try {
          // Add user as owner of the store
          const { error: insertError } = await supabase
            .from('user_store_access')
            .insert({
              user_id: req.user.id,
              store_id: storeId,
              role: 'owner',
              is_primary: true
            });
          
          if (insertError) {
            console.error('Erro ao conceder acesso à nova loja');
            
            // Continue with the request anyway, using temporary access
            req.storeContext = {
              storeId,
              storeName: storeData?.name || 'Nova Loja',
              role: 'owner',
              isTemporaryAccess: true
            };
            
            return next();
          }
          
          // Set context and continue
          req.storeContext = {
            storeId,
            storeName: storeData?.name || 'Nova Loja',
            role: 'owner',
            isNewAccessGranted: true
          };
          
          return next();
        } catch (grantError) {
          console.error('Exceção ao conceder acesso à nova loja');
          // Continue with temporary access
          req.storeContext = {
            storeId,
            storeName: storeData?.name || 'Nova Loja',
            role: 'owner',
            isTemporaryAccess: true
          };
          
          return next();
        }
      }
      
      // No data or empty data means no access
      if (error || !data || data.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a esta loja'
        });
      }
      
      // Get the first record (there should only be one)
      accessRecord = data[0];
    } catch (middlewareError) {
      console.error('Exceção no middleware de contexto de loja');
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao verificar acesso à loja'
      });
    }
    
    // Check if we have a valid access record
    if (!accessRecord || !accessRecord.stores) {
      console.error('Informação de acesso ou loja ausente');
      
      // If we have store data but no access record, let's create a temporary context
      if (storeData) {
        req.storeContext = {
          storeId,
          storeName: storeData.name,
          role: 'owner', // Assume owner for temporary access
          isTemporaryAccess: true
        };
        return next();
      }
      
      return res.status(403).json({
        success: false,
        message: 'Informações de acesso à loja não encontradas'
      });
    }
    
    // Check if store exists and is active
    if (!accessRecord.stores.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Esta loja está desativada'
      });
    }
    
    // Adicionar contexto da loja à requisição
    req.storeContext = {
      storeId,
      storeName: accessRecord.stores.name,
      role: accessRecord.role
    };
    
    // Continuar para o próximo middleware ou controlador
    next();
  } catch (error) {
    console.error('Erro no middleware de contexto de loja:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
};

/**
 * Middleware para verificar permissões dentro do contexto da loja
 * @param {Array} allowedRoles - Roles permitidas para a rota
 */
const checkStorePermission = (allowedRoles) => {
  return (req, res, next) => {
    // Verificar se o middleware de contexto de loja foi executado antes
    if (!req.storeContext) {
      return res.status(500).json({
        success: false,
        message: 'Erro de configuração: middleware de contexto de loja não executado'
      });
    }
    
    // Verificar se a role do usuário está na lista de roles permitidas
    const isAllowed = allowedRoles.includes(req.storeContext.role);
    
    if (!isAllowed) {
      console.log(`Permissão negada: usuário com role ${req.storeContext.role} tentou acessar rota que requer ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: 'Permissão negada para esta operação'
      });
    }
    
    // Usuário tem permissão, continuar
    next();
  };
};

module.exports = {
  storeContext,
  checkStorePermission
};
