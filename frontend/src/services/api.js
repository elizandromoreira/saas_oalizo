import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  // baseURL: 'http://localhost:5001/api', // Alternativa para testar conexão direta
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    console.log('[API Interceptor] Enviando requisição:', {
      url: config.url,
      method: config.method,
      params: config.params,
      headers: config.headers,
      data: config.data ? '[DATA PRESENT]' : '[NO DATA]'
    });
    
    const token = localStorage.getItem('token');
    if (token) {
      console.log('[API Interceptor] Token encontrado, adicionando ao header');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('[API Interceptor] ALERTA: Nenhum token encontrado no localStorage');
    }
    
    // Verificar se o header X-Store-ID está presente
    if (config.headers.common && config.headers.common['X-Store-ID']) {
      console.log('[API Interceptor] Header X-Store-ID presente:', config.headers.common['X-Store-ID']);
      
      // Verificar se a URL já contém store_id
      if (config.url.includes('/stores/') && !config.url.includes('/stores/user')) {
        console.log('[API Interceptor] ATENÇÃO: URL já contém ID da loja, possível duplicação');
      }
    } else {
      console.log('[API Interceptor] Header X-Store-ID não está presente');
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('[API Interceptor] Erro na requisição:', {
      url: error.config?.url,
      status: error.response?.status,
      mensagem: error.response?.data?.message || error.message
    });
    
    // Handle authentication errors (401)
    if (error.response && error.response.status === 401) {
      console.log('Erro 401 detectado, removendo tokens do localStorage');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('stores');
      localStorage.removeItem('currentStoreId');
      
      // Redirect to login if not a login or register request
      const isAuthRoute = error.config.url.includes('/auth/login') || 
                          error.config.url.includes('/auth/register');
      
      if (!isAuthRoute) {
        window.location.href = '/auth/login';
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
    }
    
    return Promise.reject(error);
  }
);

// Function to set store_id in request headers
const setStoreHeader = (storeId) => {
  if (storeId) {
    console.log('[API] Configurando header X-Store-ID:', storeId);
    api.defaults.headers.common['X-Store-ID'] = storeId;
  } else {
    console.log('[API] Removendo header X-Store-ID');
    delete api.defaults.headers.common['X-Store-ID'];
  }
};

// Authentication services
const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  setPrimaryStore: (storeId) => api.post('/auth/primary-store', { storeId }),
};

// Store services
const storeService = {
  getUserStores: () => api.get('/stores/user'),
  getStoreById: (storeId) => {
    // Verificar se o usuário é elizandromartim@gmail.com
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.email === 'elizandromartim@gmail.com') {
      console.log('Usuário especial detectado, usando rota admin para acessar loja');
      return api.get(`/stores/${storeId}/admin`);
    }
    return api.get(`/stores/${storeId}`);
  },
  createStore: (storeData) => api.post('/stores', storeData),
  updateStore: (storeId, storeData) => api.put(`/stores/${storeId}`, storeData),
  deleteStore: (storeId) => api.delete(`/stores/${storeId}`),
  getStoreUsers: (storeId) => api.get(`/stores/${storeId}/users`),
  addUserToStore: (storeId, userData) => api.post(`/stores/${storeId}/users`, userData),
  updateUserRole: (storeId, userId, role) => api.put(`/stores/${storeId}/users/${userId}`, { role }),
  removeUserFromStore: (storeId, userId) => api.delete(`/stores/${storeId}/users/${userId}`),
};

// Export functions and services
export {
  api as default,
  setStoreHeader,
  authService,
  storeService,
};
