import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import jwtDecode from 'jwt-decode';
import { authService } from '../services/api';

// Create context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage on initialization
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('user'));

        if (token && storedUser) {
          // Check if token is expired
          try {
            const decoded = jwtDecode(token);
            const isExpired = decoded.exp * 1000 < Date.now();

            if (isExpired) {
              throw new Error('Token expired');
            }

            // Fetch updated user information
            const { data } = await authService.getMe();
            setUser(data.user);
            setIsAuthenticated(true);
          } catch (error) {
            console.error('Error decoding token or fetching user:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('stores');
            localStorage.removeItem('currentStoreId');
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      console.log('Iniciando processo de login para:', credentials.email);
      setLoading(true);
      const { data } = await authService.login(credentials);
      console.log('Resposta do login recebida:', { 
        sucesso: data.success, 
        temToken: !!data.token,
        temUsuario: !!data.user
      });
      
      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Store data in localStorage
        console.log('Salvando dados no localStorage');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('stores', JSON.stringify(data.stores || []));
        
        if (data.primaryStore) {
          localStorage.setItem('currentStoreId', data.primaryStore.id);
        }
        
        toast.success('Login successful!');
        
        // Always redirect to dashboard regardless of admin status
        let redirectPath = '/dashboard';
        
        // Only redirect to stores if multiple stores and no primary
        if (data.stores && data.stores.length > 0) {
          // If multiple stores and no primary store, go to store selector
          if (data.stores.length > 1 && !data.primaryStore) {
            redirectPath = '/stores';
          }
        }
        
        return { 
          success: true, 
          stores: data.stores,
          redirectPath 
        };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.log('Detalhes do erro:', {
        mensagem: error.message,
        resposta: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || 'Authentication failed');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      const { data } = await authService.register(userData);
      
      if (data.success) {
        toast.success('Registration successful! You can now log in.');
        return { success: true };
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('stores');
    localStorage.removeItem('currentStoreId');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/auth/login');
    toast.success('Logout successful!');
  }, [navigate]);

  // Check if user is authenticated
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode(token);
      const isExpired = decoded.exp * 1000 < Date.now();
      
      if (isExpired) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('stores');
        localStorage.removeItem('currentStoreId');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }, []);

  // Update user information
  const updateUser = useCallback((userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
    localStorage.setItem('user', JSON.stringify({ ...user, ...userData }));
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        checkAuth,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
