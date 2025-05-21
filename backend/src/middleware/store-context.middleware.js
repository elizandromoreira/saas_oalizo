const { supabase } = require('../config/supabase');

/**
 * Middleware de contexto de loja
 * Verifica se o usuário tem acesso à loja especificada e adiciona o contexto da loja à requisição
 */
const storeContext = async (req, res, next) => {
  try { // MAIN TRY-CATCH FOR THE ENTIRE MIDDLEWARE
    const storeId = req.headers['x-store-id'] || req.query.store_id || req.params.storeId || (req.body && req.body.store_id);

    if (!storeId) {
      console.error('Store ID não encontrado na requisição');
      return res.status(400).json({ success: false, message: 'ID da loja (store_id) é obrigatório' });
    }

    let accessRecord = null;
    let storeDataForNewAccess = null; // Usado se precisarmos conceder acesso a uma nova loja

    // Lógica para usuário especial (elizandromartim@gmail.com)
    if (req.user.id === 'c0a70134-30da-40de-a4aa-5f4e1cd84ff2') {
      console.log('Usuário elizandromartim@gmail.com: acesso especial à loja', storeId);
      const { data: storeInfo, error: storeError } = await supabase.from('stores').select('name, is_active').eq('id', storeId).single();
      if (storeError || !storeInfo) {
        console.error('Erro ao buscar loja para usuário especial ou loja não encontrada:', storeError);
        return res.status(404).json({ success: false, message: 'Loja não encontrada para acesso especial' });
      }
      if (!storeInfo.is_active) {
        return res.status(403).json({ success: false, message: 'Esta loja está desativada (acesso especial)' });
      }
      req.storeContext = { storeId, storeName: storeInfo.name, role: 'owner', isSpecialAccess: true };
      return next();
    }

    // Lógica para Platform Admin
    if (req.user.isPlatformAdmin) {
      console.log('PlatformAdmin detectado, contornando verificação de acesso para usuário:', req.user.id, 'na loja:', storeId);
      const { data: storeInfo, error: storeError } = await supabase.from('stores').select('name, is_active').eq('id', storeId).single();
      if (storeError || !storeInfo) {
        console.error('Erro ao buscar loja para PlatformAdmin ou loja não encontrada:', storeError);
        return res.status(404).json({ success: false, message: 'Loja não encontrada para PlatformAdmin' });
      }
      if (!storeInfo.is_active) {
        return res.status(403).json({ success: false, message: 'Esta loja está desativada (PlatformAdmin)' });
      }
      req.storeContext = { storeId, storeName: storeInfo.name, role: 'owner', isPlatformAdmin: true };
      return next();
    }

    // Lógica normal de verificação de acesso
    let isNewStoreContext = false;
    try {
      const { data: newStoreCheck, error: newStoreCheckError } = await supabase.from('stores').select('id, name, is_active, created_at').eq('id', storeId).single();
      if (!newStoreCheckError && newStoreCheck) {
        storeDataForNewAccess = newStoreCheck; // Salva dados da loja para possível novo acesso
        const storeCreatedAt = new Date(newStoreCheck.created_at);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (storeCreatedAt > fiveMinutesAgo) {
          isNewStoreContext = true;
          console.log(`Loja ${storeId} foi criada recentemente.`);
        }
      }
    } catch (storeCheckError) {
      console.error('Erro ao verificar se a loja é nova:', storeCheckError);
      // Continuar mesmo se esta verificação falhar, a lógica principal de acesso abaixo cuidará disso
    }

    const { data: existingAccess, error: dbError } = await supabase
      .from('user_store_access')
      .select('role, status, stores(id, name, is_active)') // Garante que stores é um objeto aninhado
      .eq('user_id', req.user.id)
      .eq('store_id', storeId)
      .single(); // Espera um único registro ou nenhum

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116: No rows found, o que é um cenário esperado
      console.error('Erro ao buscar registro de acesso à loja:', dbError);
      throw dbError; // Deixa o catch principal lidar com isso
    }
    accessRecord = existingAccess; // Será null se não encontrado

    // Conceder acesso se for uma loja nova criada pelo usuário atual e ele ainda não tem acesso
    if (isNewStoreContext && !accessRecord && storeDataForNewAccess && storeDataForNewAccess.is_active) {
      console.log(`Concedendo acesso automático (owner, active) para usuário ${req.user.id} à nova loja ${storeId}`);
      const { data: grantedAccess, error: grantError } = await supabase
        .from('user_store_access')
        .insert({ user_id: req.user.id, store_id: storeId, role: 'owner', is_primary: true, status: 'active' })
        .select('role, status, stores(id, name, is_active)') // Selecionar os mesmos campos para consistência
        .single();
      
      if (grantError) {
        console.error('Erro ao conceder acesso à nova loja automaticamente:', grantError);
        // Não lançar erro aqui, a validação abaixo pegará se o accessRecord continuar nulo
      } else {
        accessRecord = grantedAccess;
        console.log('Novo acesso concedido e definido como active para loja recém-criada.');
      }
    }

    // Validação final do accessRecord
    if (!accessRecord || !accessRecord.stores) {
      console.log(`Usuário ${req.user.id} não tem registro de acesso válido ou informações da loja para ${storeId}.`);
      return res.status(403).json({ success: false, message: 'Acesso negado. Você não tem permissão para acessar esta loja.' });
    }

    if (accessRecord.stores.is_active === false) {
      console.log(`Loja ${storeId} está desativada. Acesso negado para ${req.user.id}.`);
      return res.status(403).json({ success: false, message: 'Esta loja está atualmente desativada.' });
    }

    if (accessRecord.status !== 'active') {
      let userMessage = 'Acesso negado. Sua conta não está ativa para esta loja.';
      if (accessRecord.status === 'pending') {
        userMessage = 'Seu acesso a esta loja está pendente de aprovação.';
      }
      else if (accessRecord.status === 'suspended') {
        userMessage = 'Seu acesso a esta loja foi suspenso.';
      }
      console.log(`Status de acesso do usuário ${req.user.id} para loja ${storeId} é '${accessRecord.status}'. Acesso negado.`);
      return res.status(403).json({ success: false, message: userMessage });
    }

    // Se tudo estiver OK, configurar o contexto da loja
    req.storeContext = {
      storeId: accessRecord.stores.id, // Usar o ID da loja do registro de acesso
      storeName: accessRecord.stores.name,
      role: accessRecord.role
    };
    console.log(`Acesso à loja ${req.storeContext.storeId} concedido para usuário ${req.user.id} com role ${req.storeContext.role} e status 'active'.`);
    next();

  } catch (error) {
    console.error('Erro inesperado no middleware storeContext:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor ao processar sua solicitação de acesso à loja.' });
  }
};

/**
 * Middleware para verificar permissões dentro do contexto da loja
 * @param {Array} allowedRoles - Roles permitidas para a rota
 */
const checkStorePermission = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.storeContext) {
      console.error('Erro de configuração: storeContext não encontrado na requisição. O middleware storeContext deve ser executado antes de checkStorePermission.');
      return res.status(500).json({
        success: false,
        message: 'Erro de configuração interna do servidor.'
      });
    }
    
    const { role, storeName } = req.storeContext;
    if (!allowedRoles.includes(role)) {
      console.log(`Permissão negada para usuário com role '${role}' na loja '${storeName}'. Rota requer uma das seguintes roles: ${allowedRoles.join(', ')}.`);
      return res.status(403).json({
        success: false,
        message: `Você não tem permissão (${role}) para realizar esta operação nesta loja.`
      });
    }
    next();
  };
};

module.exports = {
  storeContext,
  checkStorePermission
};
