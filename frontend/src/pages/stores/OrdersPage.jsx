import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import toast from 'react-hot-toast';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  EyeIcon,
  FunnelIcon,
  ChevronDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const OrdersPage = () => {
  const { storeId } = useParams();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    orderId: true,
    date: true,
    status: true,
    address: true,
    amazonPrice: true,
    amazonFee: true,
    amazonShipping: true,
    quantity: true,
    bundleQuantity: true,
    supplierPrice: true,
    supplierDiscount: true,
    supplierShipping: true,
    profit: true,
    actions: true
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalPages: 1,
    total: 0
  });

  // Função para buscar pedidos (simulada)
  const fetchOrders = async (page = 1, limit = 50) => {
    setIsLoading(true);
    try {
      // Simulando dados de pedidos
      const mockOrders = Array.from({ length: 7 }, (_, index) => ({
        id: `345345-${546774 + index}-4562456`,
        orderId: `T2-RER5-56GF-${index}`,
        date: '06/05/2023',
        status: index % 3 === 0 ? 'Pending' : (index % 3 === 1 ? 'Shipped' : 'Delivered'),
        address: 'Silver Spring, Maryland 209045-3 4675 US',
        amazonPrice: 0.00,
        amazonFee: 0.00,
        amazonShipping: 0.00,
        quantity: 2,
        bundleQuantity: '--',
        supplierPrice: 0.00,
        supplierDiscount: 0.00,
        supplierShipping: 0.00,
        profit: 0.00
      }));
      
      setOrders(mockOrders);
      setPagination({
        page: 1,
        limit: 50,
        totalPages: 1,
        total: mockOrders.length
      });
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      toast.error('Erro ao carregar pedidos');
      setError('Não foi possível carregar os pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar pedidos ao montar o componente
  useEffect(() => {
    fetchOrders();
  }, [storeId]);

  // Definição das colunas da tabela
  const columns = useMemo(() => [
    {
      Header: 'Purchase Date',
      accessor: 'date',
      show: visibleColumns.date,
    },
    {
      Header: 'Product',
      accessor: 'orderId',
      show: visibleColumns.orderId,
      Cell: ({ value }) => (
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-200 rounded mr-3"></div>
          <div>
            <div className="font-medium">RichSelect Organic Pearl Couscous</div>
            <div className="text-sm text-gray-500">SKU: {value}</div>
          </div>
        </div>
      )
    },
    {
      Header: 'Address',
      accessor: 'address',
      show: visibleColumns.address,
    },
    {
      Header: 'Status',
      accessor: 'status',
      show: visibleColumns.status,
      Cell: ({ value }) => {
        let statusColor;
        let bgColor;
        
        if (value === 'Pending') {
          statusColor = 'text-yellow-700';
          bgColor = 'bg-yellow-100';
        } else if (value === 'Shipped') {
          statusColor = 'text-blue-700';
          bgColor = 'bg-blue-100';
        } else if (value === 'Delivered') {
          statusColor = 'text-green-700';
          bgColor = 'bg-green-100';
        } else {
          statusColor = 'text-gray-700';
          bgColor = 'bg-gray-100';
        }
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} ${bgColor}`}>
            {value}
          </span>
        );
      }
    },
    {
      Header: 'Amazon Price',
      accessor: 'amazonPrice',
      show: visibleColumns.amazonPrice,
      Cell: ({ value }) => <div className="text-right">${value.toFixed(2)}</div>,
    },
    {
      Header: 'Amazon Fee',
      accessor: 'amazonFee',
      show: visibleColumns.amazonFee,
      Cell: ({ value }) => <div className="text-right">${value.toFixed(2)}</div>,
    },
    {
      Header: 'Amazon Shipping',
      accessor: 'amazonShipping',
      show: visibleColumns.amazonShipping,
      Cell: ({ value }) => <div className="text-right">${value.toFixed(2)}</div>,
    },
    {
      Header: 'Quantity',
      accessor: 'quantity',
      show: visibleColumns.quantity,
      Cell: ({ value }) => <div className="text-right">{value}</div>,
    },
    {
      Header: 'Bundle Quantity',
      accessor: 'bundleQuantity',
      show: visibleColumns.bundleQuantity,
      Cell: ({ value }) => <div className="text-right">{value}</div>,
    },
    {
      Header: 'Supplier Price',
      accessor: 'supplierPrice',
      show: visibleColumns.supplierPrice,
      Cell: ({ value }) => <div className="text-right">${value.toFixed(2)}</div>,
    },
    {
      Header: 'Supplier Discount',
      accessor: 'supplierDiscount',
      show: visibleColumns.supplierDiscount,
      Cell: ({ value }) => <div className="text-right">${value.toFixed(2)}</div>,
    },
    {
      Header: 'Supplier Shipping',
      accessor: 'supplierShipping',
      show: visibleColumns.supplierShipping,
      Cell: ({ value }) => <div className="text-right">${value.toFixed(2)}</div>,
    },
    {
      Header: 'Profit',
      accessor: 'profit',
      show: visibleColumns.profit,
      Cell: ({ value }) => <div className="text-right">${value.toFixed(2)}</div>,
    },
    {
      Header: 'Actions',
      accessor: 'actions',
      show: visibleColumns.actions,
      Cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <button
            className="text-blue-600 hover:text-blue-800"
            onClick={() => console.log('View order details', row.original.id)}
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ], [visibleColumns]);

  // Configuração da tabela
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize }
  } = useTable(
    {
      columns,
      data: orders,
      initialState: { pageIndex: 0, pageSize: pagination.limit }
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  return (
    <div className="w-full py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => fetchOrders()}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            aria-label="Refresh orders"
          >
            <ArrowPathIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              <span>Columns</span>
            </button>
            {showColumnSelector && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10 dark:bg-gray-800 dark:border-gray-700">
                <div className="p-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Show/Hide Columns</div>
                  <div className="space-y-2">
                    {Object.entries(visibleColumns).map(([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setVisibleColumns({ ...visibleColumns, [key]: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {columns.find(col => col.accessor === key)?.Header || key}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="mb-6">
        {/* Barra de busca */}
        <div className="bg-white shadow rounded-lg p-4 dark:bg-gray-800 dark:border dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-grow min-w-[200px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <input
              type="text"
              value={orderIdFilter}
              onChange={(e) => setOrderIdFilter(e.target.value)}
              placeholder="Order ID"
              className="block min-w-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Status</option>
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
            </select>
            
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                className="block min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                className="block min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <button
              onClick={() => setSearchTerm('') & setOrderIdFilter('') & setStatusFilter('') & setDateFilter({ start: '', end: '' })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Revenue</p>
              <h5 className="text-gray-900 dark:text-white text-xl font-bold">$12456.58</h5>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Amazon Fee</p>
              <h5 className="text-gray-900 dark:text-white text-xl font-bold">$532.34</h5>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <svg className="h-6 w-6 text-green-600 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Supplier Cost</p>
              <h5 className="text-gray-900 dark:text-white text-xl font-bold">$2672.25</h5>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Profit</p>
              <h5 className="text-gray-900 dark:text-white text-xl font-bold">$4521.25</h5>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md dark:bg-gray-800 dark:border dark:border-gray-700">
        <table {...getTableProps()} className="data-table">
          <thead className="data-table-header">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  column.show !== false && (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.render('Header')}</span>
                        <span>
                          {column.isSorted
                            ? column.isSortedDesc
                              ? '↓'
                              : '↑'
                            : ''}
                        </span>
                      </div>
                    </th>
                  )
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Loading orders...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : page.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No orders found
                </td>
              </tr>
            ) : (
              page.map(row => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()} className="group hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">
                    {row.cells.map(cell => (
                      cell.column.show !== false && (
                        <td {...cell.getCellProps()} className="px-6 py-4 whitespace-nowrap dark:text-gray-300">
                          {cell.render('Cell')}
                        </td>
                      )
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {pageCount > 0 && (
      <div className="flex items-center justify-between mt-4 bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{page.length}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> results
            </p>
          </div>
          <div className="dark:text-gray-300">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Previous
              </button>
              {/* Botões de página */}
              {Array.from({ length: pageCount }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => gotoPage(index)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageIndex === index
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>)}
    </div>
  );
};

export default OrdersPage;