import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalStores: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    recentStores: []
  });

  // In a real implementation, this would fetch data from the API
  useEffect(() => {
    // Simulated data for demonstration
    setStats({
      totalStores: 12,
      totalUsers: 45,
      activeSubscriptions: 10,
      recentStores: [
        { id: '1', name: 'Tech Gadgets Store', owner: 'John Doe', createdAt: '2023-01-15' },
        { id: '2', name: 'Fashion Outlet', owner: 'Jane Smith', createdAt: '2023-02-20' },
        { id: '3', name: 'Home Decor', owner: 'Robert Johnson', createdAt: '2023-03-05' }
      ]
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Platform Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Stores</p>
              <p className="text-2xl font-bold">{stats.totalStores}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Active Subscriptions</p>
              <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Stores */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recently Created Stores</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentStores.map((store) => (
                  <tr key={store.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{store.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{store.owner}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{store.createdAt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/admin/stores/${store.id}`} className="text-primary-600 hover:text-primary-900 mr-4">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <Link to="/admin/stores" className="text-primary-600 hover:text-primary-900 text-sm font-medium">
              View All Stores →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
