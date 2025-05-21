import { useState, useContext } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  BuildingStorefrontIcon, 
  ShoppingBagIcon, 
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { StoreContext } from '../context/StoreContext';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { currentStore, stores, switchStore } = useContext(StoreContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const location = useLocation();
  const navigate = useNavigate();

  // Close sidebar on mobile when a route is accessed
  const handleNavigation = () => {
    setSidebarOpen(false);
  };

  // Switch between stores
  const handleSwitchStore = (storeId) => {
    switchStore(storeId);
    setStoreModalOpen(false);
  };

  // Function to format safe URLs (slugs)
  const formatSlug = (text) => {
    return text.toLowerCase().replace(/\s+/g, '-');
  };

  // Toggle between light and dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Helper function to check if a link is active
  const isLinkActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-full flex">
      {/* Mobile sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } fixed inset-0 z-40 lg:hidden`}
      >
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75" 
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        ></div>

        {/* Sidebar content */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-900">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Amazon Store Manager</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              <button
                onClick={() => navigate('/dashboard')}
                className={
                  `${
                    isLinkActive('/dashboard')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-primary-600'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`
                }
                
              >
                <HomeIcon className="mr-3 h-6 w-6" />
                Dashboard
              </button>

              <NavLink
                to="/stores"
                className={
                  `${
                    isLinkActive('/stores') && !isLinkActive('/stores/') && location.pathname !== '/stores/new'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-primary-600'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`
                }
                onClick={handleNavigation}
              >
                <BuildingStorefrontIcon className="mr-3 h-6 w-6" />
                Stores
              </NavLink>

              <NavLink
                to={currentStore ? `/stores/${currentStore.id}/products` : '/stores'}
                className={
                  `${
                    location.pathname.includes('/products')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-primary-600'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`
                }
                onClick={handleNavigation}
              >
                <ShoppingBagIcon className="mr-3 h-6 w-6" />
                Products
              </NavLink>

              <NavLink
                to={currentStore ? `/stores/${currentStore.id}/orders` : '/stores'}
                className={
                  `${
                    location.pathname.includes('/orders')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-primary-600'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`
                }
                onClick={handleNavigation}
              >
                <DocumentTextIcon className="mr-3 h-6 w-6" />
                Orders
              </NavLink>
            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex-shrink-0 group block">
              <div className="flex items-center">
                <div>
                  <div className="bg-primary-900 rounded-full h-10 w-10 flex items-center justify-center text-white font-bold">
                    {user?.name?.[0] || user?.email?.[0] || '?'}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || user?.email}</p>
                  <button
                    onClick={logout}
                    className="text-xs font-medium text-gray-500 dark:text-primary-200 group-hover:text-gray-700 dark:group-hover:text-white flex items-center"
                  >
                    <ArrowRightOnRectangleIcon className="mr-1 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white dark:bg-gray-900">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Amazon Store Manager</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                <button
                  onClick={() => navigate('/dashboard')}
                  className={
                    `${
                      isLinkActive('/dashboard')
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-primary-600'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`
                  }
                >
                  <HomeIcon className="mr-3 h-6 w-6" />
                  Dashboard
                </button>

                <NavLink
                  to="/stores"
                  className={
                    `${
                      isLinkActive('/stores') && !isLinkActive('/stores/') && location.pathname !== '/stores/new'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-primary-600'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`
                  }
                >
                  <BuildingStorefrontIcon className="mr-3 h-6 w-6" />
                  Stores
                </NavLink>

                <NavLink
                  to={currentStore ? `/stores/${currentStore.id}/products` : '/stores'}
                  className={
                    `${
                      location.pathname.includes('/products')
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-primary-600'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`
                  }
                >
                  <ShoppingBagIcon className="mr-3 h-6 w-6" />
                  Products
                </NavLink>

                <NavLink
                  to={currentStore ? `/stores/${currentStore.id}/orders` : '/stores'}
                  className={
                    `${
                      location.pathname.includes('/orders')
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-primary-600'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`
                  }
                >
                  <DocumentTextIcon className="mr-3 h-6 w-6" />
                  Orders
                </NavLink>
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-800 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <div className="bg-primary-900 rounded-full h-9 w-9 flex items-center justify-center text-white font-bold">
                      {user?.name?.[0] || user?.email?.[0] || '?'}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user?.name || user?.email}
                    </p>
                    <button 
                      onClick={logout}
                      className="text-xs font-medium text-gray-500 dark:text-primary-200 group-hover:text-gray-700 dark:group-hover:text-white flex items-center"
                    >
                      <ArrowRightOnRectangleIcon className="mr-1 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow">
          <button
            className="lg:hidden px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              {/* Store selector */}
              <div className="relative">
                <button
                  onClick={() => setStoreModalOpen(true)}
                  className="flex items-center max-w-xs text-sm rounded-md px-3 py-2 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                >
                  <BuildingStorefrontIcon className="mr-2 h-5 w-5 text-gray-400" />
                  <span className="font-medium">
                    {currentStore ? currentStore.name : 'Select a store'}
                  </span>
                </button>

                {/* Modal to switch stores */}
                <Modal 
                  isOpen={storeModalOpen} 
                  onClose={() => setStoreModalOpen(false)}
                  title="Selecionar Loja"
                  maxWidth="max-w-md"
                >
                  <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto">
                      {stores.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No stores available</p>
                      ) : (
                        <div className="space-y-2">
                          {stores.map((store) => (
                            <button
                              key={store.id}
                              onClick={() => handleSwitchStore(store.id)}
                              className={`${
                                currentStore?.id === store.id
                                  ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                              } flex justify-between items-center w-full px-4 py-2 text-sm rounded-md border`}
                            >
                              <span className="font-medium">{store.name}</span>
                              {store.is_primary && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Primary
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <button
                        onClick={() => {
                          navigate('/stores/new');
                          setStoreModalOpen(false);
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Criar Nova Loja
                      </button>
                    </div>
                  </div>
                </Modal>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* Theme toggle button */}
              <button
                onClick={toggleDarkMode}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
                aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
              >
                {darkMode ? (
                  <SunIcon className="h-6 w-6 text-yellow-400" />
                ) : (
                  <MoonIcon className="h-6 w-6 text-gray-600" />
                )}
              </button>
              
              {/* Settings button */}
              {currentStore && (
                <div className="relative">
                  <button
                    onClick={() => setSettingsMenuOpen(true)}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Cog6ToothIcon className="h-6 w-6" />
                  </button>
                  
                  {/* Settings modal */}
                  <Modal 
                    isOpen={settingsMenuOpen} 
                    onClose={() => setSettingsMenuOpen(false)}
                    title="Configurações da Loja"
                    maxWidth="max-w-md"
                  >
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          navigate(`/stores/${currentStore.id}/settings`);
                          setSettingsMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Configurações da Loja
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/stores/${currentStore.id}/users`);
                          setSettingsMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Store Users
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/stores/${currentStore.id}/amazon-credentials`);
                          setSettingsMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Amazon Credentials
                      </button>
                    </div>
                  </Modal>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50 dark:bg-gray-900">
          {/* Amazon credentials notification */}
          {currentStore && (
            <>
            {/* Debug info - remover em produção */}
            
            {/* Alerta de credenciais não configuradas */}
            {!currentStore.has_amazon_credentials && !currentStore.has_amazon_credentials_attempted && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 dark:bg-yellow-900 dark:border-yellow-600">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-200">
                    This store does not have Amazon credentials configured. 
                    <button
                      onClick={() => {
                        navigate(`/stores/${currentStore.id}/amazon-credentials`);
                      }}
                      className="font-medium underline text-yellow-700 hover:text-yellow-600 dark:text-yellow-200 dark:hover:text-yellow-300 ml-1"
                    >
                      Configure now
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}
          </>
          )}
          
          <div className="py-6">
            <div className="w-full px-4">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
