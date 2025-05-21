import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { StoreContext } from '../../context/StoreContext';
import { storeService } from '../../services/api';

const StoresPage = () => {
  const { stores, loading: storesLoading, switchStore } = useContext(StoreContext);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Once the stores are loaded from the context, we can stop loading
    if (!storesLoading) {
      setLoading(false);
    }
  }, [storesLoading]);

  const handleCreateStore = () => {
    navigate('/stores/new');
  };

  const handleEditStore = (storeId) => {
    navigate(`/stores/${storeId}/settings`);
  };

  const handleDeleteStore = async (storeId) => {
    if (window.confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      try {
        setDeleting(storeId);
        const response = await storeService.deleteStore(storeId);
        
        if (response.data.success) {
          toast.success('Store deleted successfully!');
          // Reload the page to refresh the stores list
          window.location.reload();
        } else {
          toast.error(response.data.message || 'Error deleting store');
        }
      } catch (error) {
        console.error('Error deleting store:', error);
        toast.error(error.response?.data?.message || 'Error deleting store');
      } finally {
        setDeleting(null);
      }
    }
  };

  const handleSelectStore = (storeId) => {
    switchStore(storeId);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Stores</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded mb-4"></div>
          <div className="h-16 bg-gray-200 rounded mb-4"></div>
          <div className="h-16 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Stores</h1>
        <button
          onClick={handleCreateStore}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Store
        </button>
      </div>

      {stores.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">You don't have any stores yet.</p>
          <button
            onClick={handleCreateStore}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create My First Store
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amazon Credentials
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Your Access
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{store.name}</div>
                        <div className="text-sm text-gray-500">{store.description || 'No description'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      store.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {store.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {store.is_primary && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Primary
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {store.has_amazon_credentials ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircleIcon className="h-5 w-5 mr-1" />
                        Validated
                      </span>
                    ) : store.has_amazon_credentials === false && store.has_amazon_credentials_attempted ? (
                      <span className="flex items-center text-yellow-600">
                        <ExclamationCircleIcon className="h-5 w-5 mr-1" />
                        Configured (not validated)
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <XCircleIcon className="h-5 w-5 mr-1" />
                        Not configured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {store.role === 'owner' ? 'Owner' : store.role === 'admin' ? 'Administrator' : store.role === 'manager' ? 'Manager' : 'Staff'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleSelectStore(store.id)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                      title="Select Store"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    {['owner', 'admin'].includes(store.role) && (
                      <>
                        <button
                          onClick={() => handleEditStore(store.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Edit Store"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        {store.role === 'owner' && (
                          <button
                            onClick={() => handleDeleteStore(store.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Store"
                            disabled={deleting === store.id}
                          >
                            {deleting === store.id ? (
                              <svg className="animate-spin h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StoresPage;
