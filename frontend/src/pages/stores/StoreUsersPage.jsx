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
  PencilIcon,
  CheckIcon,
  XMarkIcon
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
    role: 'staff',
    name: '',
    phone: '',
    password: '',
    createNewUser: false
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
      role: 'staff',
      name: '',
      phone: '',
      password: '',
      createNewUser: false
    });
    setAddUserModalOpen(true);
  };
  
  // Open edit user modal
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      role: user.role,
      name: user.name || '',
      phone: user.phone || ''
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
    
    // Validar senha se estiver criando um novo usuário
    if (formData.createNewUser && !formData.password) {
      toast.error('Password is required for new users');
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
          phone: data.access.user.phone,
          role: data.access.role,
          is_primary: data.access.is_primary,
          status: data.access.status || 'active',
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
      
      // Verificar se o usuário está editando a si mesmo
      const isCurrentUser = selectedUser.id === JSON.parse(localStorage.getItem('user') || '{}').id;
      
      // Atualizar a role (apenas se não for o próprio usuário)
      if (!isCurrentUser) {
        const { data: roleData } = await storeService.updateUserRole(storeId, selectedUser.id, formData.role);
        
        if (!roleData.success) {
          throw new Error(roleData.message || 'Error updating user role');
        }
      }
      
      // Atualizar metadados do usuário (nome e telefone)
      const userData = {
        name: formData.name,
        phone: formData.phone
      };
      
      const { data: userDataResponse } = await storeService.updateUserMetadata(storeId, selectedUser.id, userData);
      
      toast.success('Dados do usuário atualizados com sucesso!');
      
      // Atualizar usuário na lista
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? { 
          ...user, 
          role: isCurrentUser ? user.role : formData.role, // Manter a role atual se for o próprio usuário
          name: formData.name,
          phone: formData.phone
        } : user
      ));
      
      setEditUserModalOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Error updating user');
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
  
  // Handle update status
  const handleUpdateStatus = async (userId, newStatus) => {
    if (!window.confirm(`Tem certeza que deseja alterar o status deste usuário para "${newStatus}"?`)) {
      return;
    }
    
    try {
      setProcessing(true);
      
      const { data } = await storeService.updateUserStatus(storeId, userId, newStatus);
      
      if (data.success) {
        toast.success('Status do usuário atualizado com sucesso!');
        
        // Atualizar o usuário na lista
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        ));
      } else {
        toast.error(data.message || 'Erro ao atualizar status do usuário');
      }
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar status do usuário');
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
  
  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
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
                        {user.phone && (
                          <div className="text-xs text-gray-400">
                            {user.phone}
                          </div>
                        )}
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
                    {user.status && (
                      <span className={`px-2 ml-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {hasPermission(['owner', 'admin']) && user.id !== currentStore?.user_id && (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar função"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        
                        {/* Botões de gerenciamento de status */}
                        {user.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(user.id, 'active')}
                            className="text-green-600 hover:text-green-900"
                            title="Aprovar usuário"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        {user.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(user.id, 'suspended')}
                            className="text-red-600 hover:text-red-900"
                            title="Suspender usuário"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        {user.status === 'suspended' && (
                          <button
                            onClick={() => handleUpdateStatus(user.id, 'active')}
                            className="text-green-600 hover:text-green-900"
                            title="Reativar usuário"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={processing}
                          title="Remover usuário"
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
          Sobre Funções e Status de Usuários
        </h3>
        <p className="text-blue-700 mb-2">
          Usuários podem ter diferentes funções e status em uma loja:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Funções:</h4>
            <ul className="list-disc list-inside text-blue-700 ml-4">
              <li className="mb-1"><strong>Owner:</strong> Acesso completo a todas as configurações e gerenciar usuários</li>
              <li className="mb-1"><strong>Admin:</strong> Pode gerenciar produtos, pedidos e convidar usuários</li>
              <li className="mb-1"><strong>Manager:</strong> Pode gerenciar produtos e pedidos</li>
              <li><strong>Staff:</strong> Pode visualizar produtos e pedidos</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Status:</h4>
            <ul className="list-disc list-inside text-blue-700 ml-4">
              <li className="mb-1"><strong>Active:</strong> Usuário aprovado com acesso completo</li>
              <li className="mb-1"><strong>Pending:</strong> Usuário aguardando aprovação</li>
              <li><strong>Suspended:</strong> Acesso do usuário temporariamente suspenso</li>
            </ul>
          </div>
        </div>
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter user's name"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter user's phone number"
              />
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="createNewUser"
                  name="createNewUser"
                  checked={formData.createNewUser}
                  onChange={(e) => setFormData(prev => ({ ...prev, createNewUser: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="createNewUser" className="ml-2 block text-sm font-medium text-gray-700">
                  Create new user
                </label>
              </div>
              
              {formData.createNewUser && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Enter password for new user"
                    required={formData.createNewUser}
                  />
                </div>
              )}
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
        title="Edit User"
      >
        {selectedUser && (
          <form onSubmit={handleEditUserSubmit}>
            <div className="space-y-4">
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
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Nome do usuário"
                />
              </div>
              
              <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="edit-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Telefone do usuário"
                />
              </div>
              
              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Função
                </label>
                <select
                  id="edit-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full border border-gray-300 rounded px-3 py-2 ${
                    selectedUser.id === JSON.parse(localStorage.getItem('user') || '{}').id ? 'bg-gray-100' : ''
                  }`}
                  disabled={selectedUser.id === JSON.parse(localStorage.getItem('user') || '{}').id}
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  {hasPermission(['owner']) && (
                    <option value="owner">Owner</option>
                  )}
                </select>
                {selectedUser.id === JSON.parse(localStorage.getItem('user') || '{}').id && (
                  <p className="text-sm text-yellow-600 mt-1">Não é possível alterar sua própria função.</p>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditUserModalOpen(false)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                Cancelar
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
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
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
