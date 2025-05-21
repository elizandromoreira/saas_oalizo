const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { authenticate } = require('./middleware/auth.middleware');
const { addMissingColumnsToStoresTable } = require('./controllers/store-columns-fix');
require('dotenv').config();

// Importação das rotas
const authRoutes = require('./routes/auth.routes');
const storeRoutes = require('./routes/store.routes');
const amazonCredentialsRoutes = require('./routes/amazon-credentials.routes');
const productRoutes = require('./routes/product.routes');
// const orderRoutes = require('./routes/order.routes');

// Inicializar o aplicativo Express
const app = express();

// Configurações de porta
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet()); // Segurança
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// Rota de status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Rotas públicas
app.use('/api/auth', authRoutes);

// Middleware de autenticação para rotas protegidas
app.use('/api/stores', authenticate);

// Rotas protegidas
app.use('/api/stores', storeRoutes);
app.use('/api/stores', amazonCredentialsRoutes);
app.use('/api/stores/:storeId/products', productRoutes);
// app.use('/api/orders', orderRoutes);

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno no servidor' 
      : err.message
  });
});

// Iniciar o servidor
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV}`);
  
  // Add missing columns to stores table if they don't exist
  try {
    await addMissingColumnsToStoresTable();
  } catch (error) {
    console.error('Error adding missing columns to stores table:', error);
  }
});

module.exports = app;
