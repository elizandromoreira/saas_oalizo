import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { StoreContext } from '../../context/StoreContext';
import { storeService } from '../../services/api';
import { 
  InformationCircleIcon,
  UserIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';

const StoreUsersPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { hasStoreAccess, hasPermission, currentStore } = useContext(StoreContext);
  
  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    role: 'staff'
  });
  const [processing, setProcessing] = useState(false);
  
  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Check store access
        if (!hasStoreAccess(storeId)) {
          toast.error('You do not have access to this store');
          navigate('/dashboard');
          return;
        }
        
        // Check if user has permission to view users
        if (!hasPermission(['owner', 'admin'])) {
          toast.error('You do not have permission to manage store users');
          navigate('/dashboard');
          return;
        }
        
        setLoading(true);
        const { data } = await storeService.getStoreUsers(storeId);
        
        if (data.success) {
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error loading store users:', error);
        toast.error('Error loading store users');
      } finally {
        setLoading(false);
      }
    };
    
    if (storeId) {
      loadUsers();
    }
  }, [storeId, hasStoreAccess, hasPermission, navigate]);
  
  // Handle field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Open add user modal
  const handleAddUser = () => {
    setFormData({
      email: '',
      role: 'staff'
    });
    setAddUserModalOpen(true);
  };
  
  // Open edit user modal
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      role: user.role
    });
    setEditUserModalOpen(true);
  };
  
  // Submit add user form
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }
    
    try {
      setProcessing(true);
      
      const { data } = await storeService.addUserToStore(storeId, formData);
      
      if (data.success) {
        toast.success('User added to store successfully!');
        
        // Add new user to the list
        const newUser = {
          id: data.access.user.id,
          email: data.access.user.email,
          name: data.access.user.name,
          role: data.access.role,
          is_primary: data.access.is_primary,
          access_id: data.access.id,
          created_at: data.access.created_at
        };
        
        setUsers(prev => [...prev, newUser]);
        setAddUserModalOpen(false);
      } else {
        toast.error(data.message || 'Error adding user to store');
      }
    } catch (error) {
      console.error('Error adding user to store:', error);
      toast.error(error.response?.data?.message || 'Error adding user to store');
    } finally {
      setProcessing(false);
    }
  };
  
  // Submit edit user form
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    try {
      setProcessing(true);
      
      const { data } = await storeService.updateUserRole(storeId, selectedUser.id, { role: formData.role });
      
      if (data.success) {
        toast.success('User role updated successfully!');
        
        // Update user in the list
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id ? { ...user, role: formData.role } : user
        ));
        
        setEditUserModalOpen(false);
      } else {
        toast.error(data.message || 'Error updating user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(error.response?.data?.message || 'Error updating user role');
    } finally {
      setProcessing(false);
    }
  };
  
  // Remove user from store
  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user from the store?')) {
      return;
    }
    
    try {
      setProcessing(true);
      
      const { data } = await storeService.removeUserFromStore(storeId, userId);
      
      if (data.success) {
        toast.success('User removed from store successfully!');
        
        // Remove user from the list
        setUsers(prev => prev.filter(user => user.id !== userId));
      } else {
        toast.error(data.message || 'Error removing user from store');
      }
    } catch (error) {
      console.error('Error removing user from store:', error);
      toast.error(error.response?.data?.message || 'Error removing user from store');
    } finally {
      setProcessing(false);
    }
  };
  
  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Conditional rendering during loading
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Store Users</h1>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Store Users</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/stores')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded flex items-center"
          >
            Back to Stores
          </button>
          {hasPermission(['owner', 'admin']) && (
            <button
              onClick={handleAddUser}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add User
            </button>
          )}
        </div>
      </div>
      
      {users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <UserIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500">
            {hasPermission(['owner', 'admin']) 
              ? 'Click the "Add User" button to invite users to this store.' 
              : 'There are no users in this store yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                          {user.name ? user.name[0] : user.email[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_primary && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Primary
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {hasPermission(['owner']) && user.id !== currentStore?.user_id && (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={processing}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
          <InformationCircleIcon className="h-5 w-5 mr-1" />
          About User Roles
        </h3>
        <p className="text-blue-700 mb-2">
          Users can have different roles in a store, each with different permissions:
        </p>
        <ul className="list-disc list-inside text-blue-700 ml-4">
          <li className="mb-1"><strong>Owner:</strong> Full access to all store settings and can manage users</li>
          <li className="mb-1"><strong>Admin:</strong> Can manage products, orders, and invite users</li>
          <li className="mb-1"><strong>Manager:</strong> Can manage products and orders</li>
          <li><strong>Staff:</strong> Can view products and orders</li>
        </ul>
      </div>
      
      {/* Add User Modal */}
      <Modal
        isOpen={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        title="Add User to Store"
      >
        <form onSubmit={handleAddUserSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter user's email address"
                required
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                {hasPermission(['owner']) && (
                  <option value="owner">Owner</option>
                )}
              </select>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-md">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> The user must already have an account in the system. If they don't, ask them to register first.
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setAddUserModalOpen(false)}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className={`bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded flex items-center ${
                processing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {processing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                'Add User'
              )}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Edit User Modal */}
      <Modal
        isOpen={editUserModalOpen}
        onClose={() => setEditUserModalOpen(false)}
        title="Edit User Role"
      >
        {selectedUser && (
          <form onSubmit={handleEditUserSubmit}>
            <div className="mb-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 font-medium text-lg">
                    {selectedUser.name ? selectedUser.name[0] : selectedUser.email[0]}
                  </span>
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">
                    {selectedUser.name || 'No name'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedUser.email}
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="edit-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  {hasPermission(['owner']) && (
                    <option value="owner">Owner</option>
                  )}
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditUserModalOpen(false)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className={`bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded flex items-center ${
                  processing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default StoreUsersPage;
