import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { storeService, authService, setStoreHeader } from '../services/api';
import { AuthContext } from './AuthContext';

// Create context
export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading } = useContext(AuthContext);
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load stores when user is authenticated
  useEffect(() => {
    const loadStores = async () => {
      if (!isAuthenticated || authLoading) {
        setLoading(false);
        return;
      }

      try {
        // Try to use stores from localStorage first
        const storedStores = JSON.parse(localStorage.getItem('stores') || '[]');
        
        if (storedStores.length > 0) {
          setStores(storedStores);
          
          // Load current store from localStorage
          const currentStoreId = localStorage.getItem('currentStoreId');
          if (currentStoreId) {
            const store = storedStores.find(s => s.id === currentStoreId);
            if (store) {
              setCurrentStore(store);
              setStoreHeader(store.id);
            }
          }
        }
        
        // Fetch updated stores from API
        const { data } = await storeService.getUserStores();
        
        if (data.success && data.stores) {
          setStores(data.stores);
          localStorage.setItem('stores', JSON.stringify(data.stores));
          
          // If no store is selected or it no longer exists, select the first one
          const currentStoreId = localStorage.getItem('currentStoreId');
          const storeExists = data.stores.some(s => s.id === currentStoreId);
          
          if (!currentStoreId || !storeExists) {
            if (data.stores.length > 0) {
              // Prefer store marked as primary
              const primaryStore = data.stores.find(s => s.is_primary) || data.stores[0];
              
              setCurrentStore(primaryStore);
              localStorage.setItem('currentStoreId', primaryStore.id);
              setStoreHeader(primaryStore.id);
            } else {
              setCurrentStore(null);
              localStorage.removeItem('currentStoreId');
              setStoreHeader(null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading stores:', error);
        toast.error('Error loading your stores. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, [isAuthenticated, authLoading]);

  // Function to switch stores
  const switchStore = useCallback(async (storeId) => {
    try {
      const store = stores.find(s => s.id === storeId);
      
      if (!store) {
        throw new Error('Store not found');
      }
      
      setCurrentStore(store);
      localStorage.setItem('currentStoreId', storeId);
      setStoreHeader(storeId);
      
      // Update primary store in backend
      await authService.setPrimaryStore(storeId);
      
      // Update store list
      const updatedStores = stores.map(s => ({
        ...s,
        is_primary: s.id === storeId
      }));
      
      setStores(updatedStores);
      localStorage.setItem('stores', JSON.stringify(updatedStores));
      
      toast.success(`Switched to store: ${store.name}`);
      
      // Redirect to dashboard (optional)
      navigate('/dashboard');
      
      return true;
    } catch (error) {
      console.error('Error switching store:', error);
      toast.error('Error switching store. Please try again.');
      return false;
    }
  }, [stores, navigate]);

  // Function to create a new store
  const createStore = useCallback(async (storeData) => {
    try {
      setLoading(true);
      const { data } = await storeService.createStore(storeData);
      
      if (data.success) {
        // Add new store to the list
        const newStore = {
          ...data.store,
          role: 'owner',
          is_primary: true
        };
        
        const updatedStores = stores.map(s => ({
          ...s,
          is_primary: false
        }));
        
        updatedStores.push(newStore);
        setStores(updatedStores);
        localStorage.setItem('stores', JSON.stringify(updatedStores));
        
        // Set as current store
        setCurrentStore(newStore);
        localStorage.setItem('currentStoreId', newStore.id);
        setStoreHeader(newStore.id);
        
        toast.success('Store created successfully!');
        navigate(`/stores/${newStore.id}`);
        return { success: true, store: newStore };
      } else {
        throw new Error(data.message || 'Error creating store');
      }
    } catch (error) {
      console.error('Error creating store:', error);
      toast.error(error.response?.data?.message || 'Error creating store');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [stores, navigate]);

  // Function to update a store
  const updateStore = useCallback(async (storeId, storeData) => {
    try {
      setLoading(true);
      const { data } = await storeService.updateStore(storeId, storeData);
      
      if (data.success) {
        // Update store in the list
        const updatedStores = stores.map(s => 
          s.id === storeId ? { ...s, ...data.store } : s
        );
        
        setStores(updatedStores);
        localStorage.setItem('stores', JSON.stringify(updatedStores));
        
        // Update current store if it's the same
        if (currentStore && currentStore.id === storeId) {
          setCurrentStore({ ...currentStore, ...data.store });
        }
        
        toast.success('Store updated successfully!');
        return { success: true, store: data.store };
      } else {
        throw new Error(data.message || 'Error updating store');
      }
    } catch (error) {
      console.error('Error updating store:', error);
      toast.error(error.response?.data?.message || 'Error updating store');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [stores, currentStore]);

  // Check if user has access to a specific store
  const hasStoreAccess = useCallback((storeId) => {
    return stores.some(store => store.id === storeId);
  }, [stores]);

  // Check if user has permission for an action in the current store
  const hasPermission = useCallback((requiredRoles) => {
    if (!currentStore) return false;
    
    const userRole = currentStore.role;
    return requiredRoles.includes(userRole);
  }, [currentStore]);

  // Function to refresh stores list
  const refreshStores = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch updated stores from API
      const { data } = await storeService.getUserStores();
      
      if (data.success && data.stores) {
        setStores(data.stores);
        localStorage.setItem('stores', JSON.stringify(data.stores));
        
        // Update current store if it exists in the new list
        if (currentStore) {
          const updatedCurrentStore = data.stores.find(s => s.id === currentStore.id);
          if (updatedCurrentStore) {
            setCurrentStore(updatedCurrentStore);
          }
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing stores:', error);
      toast.error('Error refreshing stores. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentStore]);

  return (
    <StoreContext.Provider
      value={{
        stores,
        currentStore,
        loading,
        switchStore,
        createStore,
        updateStore,
        hasStoreAccess,
        hasPermission,
        refreshStores
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContext;
