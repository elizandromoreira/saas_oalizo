import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ArrowPathIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const { storeId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    revenue: 12456.58,
    salesCount: 80,
    buyboxOwnership: 2.45,
    profit: 4521.25,
    activeListings: 120,
    outOfStockListings: 120,
    inBuybox: 120,
    competitionBelowMin: 120,
    chartData: [],
    tableData: []
  });

  // Função para buscar dados do dashboard (simulada)
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulando dados do dashboard
      const mockChartData = Array.from({ length: 20 }, (_, i) => ({
        date: `Apr${i+1}`,
        value: 2000 + Math.random() * 2000
      }));
      
      const mockTableData = Array.from({ length: 4 }, (_, i) => ({
        date: '06/05/2023',
        revenue: 0,
        salesCount: 0,
        buyboxOwnership: 3.59,
        profitMargin: 0,
        profit: 0
      }));
      
      setDashboardData({
        ...dashboardData,
        chartData: mockChartData,
        tableData: mockTableData
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar dados ao montar o componente
  useEffect(() => {
    fetchDashboardData();
  }, [storeId]);

  return (
    <div className="w-full py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            aria-label="Refresh dashboard"
          >
            <ArrowPathIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* KPI Cards - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Revenue</p>
              <h5 className="text-gray-900 dark:text-white text-xl font-bold">${dashboardData.revenue.toLocaleString()}</h5>
            </div>
          </div>
        </div>

        {/* Sales Count Card */}
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Number of Sales</p>
              <h5 className="text-gray-900 dark:text-white text-xl font-bold">{dashboardData.salesCount}</h5>
            </div>
          </div>
        </div>

        {/* Buybox Ownership Card */}
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <svg className="h-6 w-6 text-green-600 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-5 flex items-center">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Buybox Ownership</p>
                <h5 className="text-gray-900 dark:text-white text-xl font-bold">{dashboardData.buyboxOwnership}%</h5>
              </div>
              <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 ml-2" />
            </div>
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5 flex items-center">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Profit</p>
                <h5 className="text-gray-900 dark:text-white text-xl font-bold">${dashboardData.profit.toLocaleString()}</h5>
              </div>
              <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 ml-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Chart */}
        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Statistic</h3>
              <div className="relative">
                <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option>1/04/2024 to 31/04/2024</option>
                  <option>1/03/2024 to 31/03/2024</option>
                  <option>1/02/2024 to 29/02/2024</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Income</p>
            </div>
            
            {/* Chart */}
            <div className="h-64 relative">
              {/* Simplified chart representation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 rounded-lg overflow-hidden">
                  <svg viewBox="0 0 400 150" className="w-full h-full">
                    <path 
                      d="M0,150 L20,130 L40,110 L60,120 L80,100 L100,110 L120,90 L140,80 L160,70 L180,60 L200,50 L220,40 L240,50 L260,40 L280,30 L300,40 L320,30 L340,40 L360,30 L380,40 L400,30" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="3"
                    />
                    <circle cx="200" cy="50" r="4" fill="#3b82f6" />
                    <rect x="190" y="20" width="60" height="20" rx="4" fill="#111827" />
                    <text x="220" y="35" fontSize="10" fill="white" textAnchor="middle">$480</text>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Table */}
            <div className="mt-8 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Revenue</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Number of Sales</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Buybox Ownership</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Profit Margin</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Profit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {dashboardData.tableData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${row.revenue}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row.salesCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row.buyboxOwnership}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row.profitMargin}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${row.profit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Right Column - Stats */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Active Listings */}
            <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">120</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ACTIVE LISTINGS</p>
                </div>
                <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">View Listing</a>
              </div>
            </div>
            
            {/* Out of Stock Listings */}
            <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">120</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">OUT OF STOCK LISTINGS</p>
                </div>
                <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">View Listing</a>
              </div>
            </div>
            
            {/* In the Buybox */}
            <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">120</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">IN THE BUYBOX</p>
                </div>
                <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">View Listing</a>
              </div>
            </div>
            
            {/* Competition Below Min Pricing */}
            <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">120</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">COMPETITION BELOW MIN PRICING</p>
                </div>
                <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">View Listing</a>
              </div>
            </div>
            
            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-center">
                <div className="w-48 h-48 relative">
                  {/* Simplified pie chart */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="#3b82f6" />
                    <circle cx="50" cy="50" r="30" fill="#ef4444" />
                    <circle cx="50" cy="50" r="20" fill="#8b5cf6" />
                    <circle cx="50" cy="50" r="10" fill="#10b981" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Ultra</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-700 rounded-full mr-2"></span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Boscovs</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Costco</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">iHerb</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Vitacost</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">BestBuy</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-600 rounded-full mr-2"></span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">HomeDepot</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Walmart</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-purple-400 rounded-full mr-2"></span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Zoro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;