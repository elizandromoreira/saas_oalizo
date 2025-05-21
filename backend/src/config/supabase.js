const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_KEY são obrigatórias');
  process.exit(1);
}

// Criação do cliente Supabase com a chave anônima (para operações regulares)
const supabase = createClient(supabaseUrl, supabaseKey);

// Criação do cliente Supabase com a chave de serviço (para operações administrativas)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
  supabase,
  supabaseAdmin
};
