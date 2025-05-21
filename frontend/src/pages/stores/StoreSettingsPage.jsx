import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { StoreContext } from '../../context/StoreContext';
import { storeService } from '../../services/api';
import amazonCredentialsService from '../../services/amazonCredentialsService';
import { 
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';

const StoreSettingsPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { hasStoreAccess, hasPermission, updateStore, refreshStores } = useContext(StoreContext);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('store');
  
  // Store form state
  const [storeFormData, setStoreFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    is_active: true
  });
  
  // Amazon credentials form state
  const [amazonFormData, setAmazonFormData] = useState({
    seller_id: '',
    client_id: '',
    client_secret: '',
    refresh_token: '',
    marketplace_id: ''
  });
  
  // Additional states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [testResultModalOpen, setTestResultModalOpen] = useState(false);
  const [testResult, setTestResult] = useState({ success: false, message: '' });
  
  // Load store details and Amazon credentials
  useEffect(() => {
    const loadStore = async () => {
      try {
        // Check store access
        if (!hasStoreAccess(storeId)) {
          toast.error('You do not have access to this store');
          navigate('/dashboard');
          return;
        }
        
        // Check if user has permission to edit store settings
        if (!hasPermission(['owner', 'admin'])) {
          toast.error('You do not have permission to edit store settings');
          navigate('/dashboard');
          return;
        }
        
        setLoading(true);
        const { data } = await storeService.getStoreById(storeId);
        
        if (data.success && data.store) {
          setStoreFormData({
            name: data.store.name || '',
            description: data.store.description || '',
            logo_url: data.store.logo_url || '',
            is_active: data.store.is_active !== false
          });
        }
        
        // Load Amazon credentials
        const amazonResponse = await amazonCredentialsService.getCredentials(storeId);
        
        if (amazonResponse.data.success && amazonResponse.data.credentials) {
          setAmazonFormData({
            seller_id: amazonResponse.data.credentials.seller_id || '',
            client_id: amazonResponse.data.credentials.client_id || '',
            client_secret: amazonResponse.data.credentials.has_client_secret ? '••••••••' : '',
            refresh_token: amazonResponse.data.credentials.has_refresh_token ? '••••••••' : '',
            marketplace_id: amazonResponse.data.credentials.marketplace_id || ''
          });
          setHasCredentials(true);
        }
      } catch (error) {
        console.error('Error loading store details:', error);
        toast.error('Error loading store details');
      } finally {
        setLoading(false);
      }
    };
    
    if (storeId) {
      loadStore();
    }
  }, [storeId, hasStoreAccess, hasPermission, navigate]);
  
  // Handle store field changes
  const handleStoreChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStoreFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle Amazon field changes
  const handleAmazonChange = (e) => {
    const { name, value } = e.target;
    setAmazonFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit store form
  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!storeFormData.name.trim()) {
      toast.error('Store name is required');
      return;
    }
    
    try {
      setSaving(true);
      
      const response = await updateStore(storeId, storeFormData);
      
      if (response.success) {
        toast.success('Store settings updated successfully!');
      } else {
        toast.error(response.error?.message || 'Error updating store settings');
      }
    } catch (error) {
      console.error('Error updating store settings:', error);
      toast.error(error.response?.data?.message || 'Error updating store settings');
    } finally {
      setSaving(false);
    }
  };
  
  // Submit Amazon credentials form
  const handleAmazonSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['seller_id', 'client_id', 'marketplace_id'];
    const secretFields = ['client_secret', 'refresh_token'];
    
    // Check normal fields
    const missingFields = requiredFields.filter(field => !amazonFormData[field]);
    
    // Check secret fields only for new credentials
    if (!hasCredentials) {
      secretFields.forEach(field => {
        if (!amazonFormData[field]) {
          missingFields.push(field);
        }
      });
    } else {
      // For updates, check if secret fields were changed from masked value
      secretFields.forEach(field => {
        if (amazonFormData[field] !== '••••••••' && !amazonFormData[field]) {
          missingFields.push(field);
        }
      });
    }
    
    if (missingFields.length > 0) {
      toast.error(`Required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare data for submission
      const dataToSend = { ...amazonFormData };
      
      // Don't send secret fields that weren't changed
      if (hasCredentials) {
        if (dataToSend.client_secret === '••••••••') {
          delete dataToSend.client_secret;
        }
        if (dataToSend.refresh_token === '••••••••') {
          delete dataToSend.refresh_token;
        }
      }
      
      // Send data to backend
      const response = await amazonCredentialsService.saveCredentials(storeId, dataToSend);
      
      if (response.data.success) {
        setHasCredentials(true);
        
        // Check if token was validated
        if (response.data.tokenValid) {
          toast.success('Credentials saved and validated successfully!');
        } else {
          toast.error('Credentials saved, but could not validate with Amazon. Please verify your data.');
        }
        
        // Mask sensitive fields after saving
        setAmazonFormData(prev => ({
          ...prev,
          client_secret: '••••••••',
          refresh_token: '••••••••'
        }));
        
        // Refresh stores list to update the Amazon credentials status
        await refreshStores();
      } else {
        toast.error(response.data.message || 'Error saving credentials');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error(error.response?.data?.message || 'Error saving Amazon credentials');
    } finally {
      setSaving(false);
    }
  };
  
  // Test Amazon connection
  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const response = await amazonCredentialsService.testConnection(storeId);
      
      // Set test result for modal
      setTestResult({
        success: response.data.success,
        message: response.data.success 
          ? 'Connection with Amazon established successfully!' 
          : (response.data.message || 'Failed to test connection')
      });
      
      // Show modal with result
      setTestResultModalOpen(true);
      
      // Also show toast for immediate feedback
      if (response.data.success) {
        toast.success('Connection with Amazon established successfully!');
        
        // Refresh stores list to update the Amazon credentials status
        await refreshStores();
      } else {
        toast.error(response.data.message || 'Failed to test connection');
        
        // Refresh stores list to update the Amazon credentials status
        await refreshStores();
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      
      // Set error result for modal
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Error testing connection with Amazon'
      });
      
      // Show modal with error
      setTestResultModalOpen(true);
      
      toast.error(error.response?.data?.message || 'Error testing connection with Amazon');
    } finally {
      setTesting(false);
    }
  };
  
  // Delete Amazon credentials
  const handleDeleteCredentials = async () => {
    if (!window.confirm('Are you sure you want to delete the Amazon credentials? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await amazonCredentialsService.deleteCredentials(storeId);
      
      if (response.data.success) {
        toast.success('Credentials removed successfully!');
        
        // Clear form
        setAmazonFormData({
          seller_id: '',
          client_id: '',
          client_secret: '',
          refresh_token: '',
          marketplace_id: ''
        });
        setHasCredentials(false);
        
        // Refresh stores list to update the Amazon credentials status
        await refreshStores();
      } else {
        toast.error(response.data.message || 'Error removing credentials');
      }
    } catch (error) {
      console.error('Error removing credentials:', error);
      toast.error(error.response?.data?.message || 'Error removing Amazon credentials');
    } finally {
      setLoading(false);
    }
  };
  
  // Conditional rendering during loading
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Store Settings</h1>
        <button
          onClick={() => navigate('/stores')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded flex items-center"
        >
          Back to Stores
        </button>
      </div>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6 w-full"></div>
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6 w-full"></div>
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6 w-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Store Settings</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('store')}
            className={`${
              activeTab === 'store'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            Store Configuration
          </button>
          <button
            onClick={() => setActiveTab('amazon')}
            className={`${
              activeTab === 'amazon'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <ShoppingBagIcon className="h-5 w-5 mr-2" />
            Amazon Credentials
          </button>
        </nav>
      </div>
      
      {/* Store Configuration Tab */}
      {activeTab === 'store' && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleStoreSubmit}>
            <div className="space-y-6">
              {/* Store Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={storeFormData.name}
                  onChange={handleStoreChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter store name"
                  required
                />
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={storeFormData.description}
                  onChange={handleStoreChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter store description (optional)"
                ></textarea>
              </div>
              
              {/* Logo URL */}
              <div>
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  id="logo_url"
                  name="logo_url"
                  value={storeFormData.logo_url}
                  onChange={handleStoreChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter logo URL (optional)"
                />
                {storeFormData.logo_url && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Preview:</p>
                    <img 
                      src={storeFormData.logo_url} 
                      alt="Store logo preview" 
                      className="h-16 w-16 object-contain border border-gray-200 rounded"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/64?text=Invalid+URL';
                      }}
                    />
                  </div>
                )}
              </div>
              
              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={storeFormData.is_active}
                  onChange={handleStoreChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Store is active
                </label>
              </div>
            </div>
            
            <div className="mt-8">
              <button
                type="submit"
                disabled={saving}
                className={`bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded flex items-center ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-1" />
              About Store Settings
            </h3>
            <p className="text-blue-700 mb-2">
              These settings control how your store appears in the Amazon Store Manager:
            </p>
            <ul className="list-disc list-inside text-blue-700 ml-4">
              <li className="mb-1">The store name is displayed in the store selector and throughout the application</li>
              <li className="mb-1">The description helps you and your team identify the purpose of this store</li>
              <li className="mb-1">The logo URL can be used to add visual identification to your store</li>
              <li>Inactive stores will still be accessible but will be marked as inactive</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Amazon Credentials Tab */}
      {activeTab === 'amazon' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Amazon Credentials</h2>
            {hasCredentials && (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || saving || loading}
                className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center ${
                  (testing || saving || loading) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {testing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>
            )}
          </div>
          
          <form onSubmit={handleAmazonSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Seller ID */}
              <div>
                <label htmlFor="seller_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Seller ID *
                </label>
                <input
                  type="text"
                  id="seller_id"
                  name="seller_id"
                  value={amazonFormData.seller_id}
                  onChange={handleAmazonChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Your Amazon Seller ID"
                />
              </div>
              
              {/* Client ID */}
              <div>
                <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID *
                </label>
                <input
                  type="text"
                  id="client_id"
                  name="client_id"
                  value={amazonFormData.client_id}
                  onChange={handleAmazonChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="SP-API application Client ID"
                />
              </div>
              
              {/* Client Secret */}
              <div>
                <label htmlFor="client_secret" className="block text-sm font-medium text-gray-700 mb-1">
                  Client Secret *
                </label>
                <div className="relative">
                  <input
                    type={showSecrets ? "text" : "password"}
                    id="client_secret"
                    name="client_secret"
                    value={amazonFormData.client_secret}
                    onChange={handleAmazonChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="SP-API application Client Secret"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 text-gray-500"
                    onClick={() => setShowSecrets(!showSecrets)}
                  >
                    {showSecrets ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              {/* Refresh Token */}
              <div>
                <label htmlFor="refresh_token" className="block text-sm font-medium text-gray-700 mb-1">
                  Refresh Token *
                </label>
                <div className="relative">
                  <input
                    type={showSecrets ? "text" : "password"}
                    id="refresh_token"
                    name="refresh_token"
                    value={amazonFormData.refresh_token}
                    onChange={handleAmazonChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Amazon Refresh Token"
                  />
                </div>
              </div>
              
              {/* Marketplace ID */}
              <div>
                <label htmlFor="marketplace_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Marketplace ID *
                </label>
                <input
                  type="text"
                  id="marketplace_id"
                  name="marketplace_id"
                  value={amazonFormData.marketplace_id}
                  onChange={handleAmazonChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Marketplace ID (e.g., A2Q3Y263D00KWC for Brazil)"
                />
              </div>
            </div>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex-grow flex gap-4">
                <button
                  type="submit"
                  disabled={saving || loading}
                  className={`bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded flex items-center ${
                    (saving || loading) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Credentials'
                  )}
                </button>
                
                {hasCredentials && (
                  <button
                    type="button"
                    onClick={handleDeleteCredentials}
                    disabled={saving || loading}
                    className={`bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded ${
                      (saving || loading) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Delete Credentials
                  </button>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => navigate('/stores')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                Back to Stores
              </button>
            </div>
          </form>
          
          <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-1" />
              How to obtain your Amazon credentials
            </h3>
            <p className="text-blue-700 mb-2">
              To connect your account to the Amazon Selling Partner API (SP-API), you will need:
            </p>
            <ol className="list-decimal list-inside text-blue-700 ml-4">
              <li className="mb-1">Create an application in <a href="https://sellercentral.amazon.com/apps/manage" target="_blank" rel="noopener noreferrer" className="underline">Amazon Seller Central</a></li>
              <li className="mb-1">Obtain the Client ID and Client Secret of the application</li>
              <li className="mb-1">Generate a Refresh Token following the OAuth authorization flow</li>
              <li className="mb-1">Get your Seller ID from your Amazon Seller account profile</li>
              <li>Select the Marketplace ID corresponding to your market</li>
            </ol>
            <p className="text-blue-700 mt-2">
              <a href="https://developer-docs.amazon.com/sp-api/docs/website-authorization-workflow" target="_blank" rel="noopener noreferrer" className="underline">
                See the official documentation for more details
              </a>
            </p>
          </div>
        </div>
      )}
      
      {/* Connection Test Result Modal */}
      <Modal
        isOpen={testResultModalOpen}
        onClose={() => setTestResultModalOpen(false)}
        title="Connection Test Result"
        maxWidth="max-w-md"
      >
        <div className="py-4">
          {testResult.success ? (
            <div className="flex flex-col items-center text-center">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Successful!</h3>
              <p className="text-gray-600">
                Your Amazon credentials are valid and working correctly.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <ExclamationCircleIcon className="h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Failed</h3>
              <p className="text-gray-600 mb-4">
                {testResult.message || "There was an error connecting to Amazon. Please verify your credentials."}
              </p>
              <div className="bg-red-50 p-3 rounded-md text-left w-full">
                <h4 className="text-sm font-medium text-red-800 mb-1">Common issues:</h4>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  <li>Invalid Client ID or Client Secret</li>
                  <li>Expired Refresh Token</li>
                  <li>Incorrect Marketplace ID</li>
                  <li>Amazon API service disruption</li>
                </ul>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setTestResultModalOpen(false)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StoreSettingsPage;
