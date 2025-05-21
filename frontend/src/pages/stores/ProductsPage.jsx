import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import toast from 'react-hot-toast';
import ProductService from '../../services/product.service';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { 
  PencilIcon, 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  EyeIcon,
  TrashIcon,
  EyeSlashIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

// Cores personalizadas para o tema
const colors = {
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  secondary: '#64748b',
  secondaryHover: '#475569',
  success: '#10b981',
  danger: '#ef4444'
};

const ProductsPage = () => {
  const { storeId } = useParams();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [amzAsinFilter, setAmzAsinFilter] = useState('');
  const [supplierSkuFilter, setSupplierSkuFilter] = useState('');
  const [supplierBrandFilter, setSupplierBrandFilter] = useState('');
  const [supplierAvailabilityFilter, setSupplierAvailabilityFilter] = useState('');
  const [availabilityOptions, setAvailabilityOptions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, ids: [], isBulk: false, showDeletionOptions: false });
  const [deleteErrorModalConfig, setDeleteErrorModalConfig] = useState({ isOpen: false, message: '' });
  const [products, setProducts] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState({
    amz_asin: true,
    amz_sku: true,
    amz_title: true,
    supplier_sku: true,
    supplier_brand: true,
    supplier_source: true,
    supplier_price: true,
    supplier_price_shipping: true,
    amz_price: true,
    amz_price_shipping: true,
    supplier_quantity: true,
    supplier_availability: true,
    supplier_handling_time: true,
    store_handling_time: true,
    amz_handling_time: true,
    actions: true
  });
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalPages: 1,
    total: 0
  });


  // Função para buscar produtos
  const fetchProducts = async (page = 1, limit = 50) => {
    setIsLoading(true);
    console.log('Buscando produtos para loja:', storeId, 'com parâmetros:', {
      page, limit, searchTerm, amzAsinFilter, supplierSkuFilter, supplierBrandFilter, supplierAvailabilityFilter
    });
    try {
      const response = await ProductService.getProducts(storeId, {
        page,
        limit,
        search: searchTerm,
        amz_asin: amzAsinFilter,
        supplier_sku: supplierSkuFilter,
        supplier_brand: supplierBrandFilter,
        supplier_availability: supplierAvailabilityFilter
      });
      
      console.log('Resposta recebida do backend:', response);
      
      if (!response.data || !response.pagination) {
        console.error('Formato inesperado de resposta:', response);
        throw new Error('Formato de resposta inválido');
      }
      
      setProducts(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        totalPages: response.pagination.totalPages,
        total: response.pagination.total
      });
      console.log('Produtos carregados com sucesso:', response.data.length);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      toast.error('Erro ao carregar produtos');
      setError('Não foi possível carregar os produtos');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar produtos ao montar o componente ou quando os filtros mudarem
  useEffect(() => {
    fetchProducts();
  }, [storeId, searchTerm, amzAsinFilter, supplierSkuFilter, supplierBrandFilter, supplierAvailabilityFilter]);

  // Extrair valores únicos de availability dos produtos
  useEffect(() => {
    if (products.length > 0) {
      const uniqueAvailabilities = [...new Set(products.map(product => product.supplier_availability))].filter(Boolean);
      setAvailabilityOptions(uniqueAvailabilities);
    }
  }, [products]);

  // Aplicar tema ao montar o componente
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Função para atualizar um produto
  const handleUpdateProduct = async (productId, updates) => {
    setIsSaving(true);
    console.log('Atualizando produto:', productId, 'com dados:', updates);
    try {
      const response = await ProductService.updateProduct(storeId, productId, updates);
      console.log('Resposta da atualização:', response);
      
      // Atualizar o produto na lista
      setProducts(products.map(product => 
        product.id === productId ? response.data : product
      ));
      
      toast.success('Produto atualizado com sucesso');
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      toast.error('Erro ao atualizar produto');
    } finally {
      setIsSaving(false);
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Função para deletar um produto
  const handleDeleteProduct = async (productId) => {
    setIsDeleting(true);
    console.log('Tentando deletar produto:', productId, 'da loja:', storeId);
    try {
      await ProductService.deleteProduct(storeId, productId);
      console.log('Produto deletado com sucesso');
      
      // Remover o produto da lista
      setProducts(products.filter(product => product.id !== productId));
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
      
      toast.success('Produto deletado com sucesso');
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      toast.error('Erro ao deletar produto');
    } finally {
      setIsDeleting(false);
      setDeleteModalConfig({ isOpen: false, ids: [], isBulk: false, showDeletionOptions: false });
    }
  };

  // Função para deletar múltiplos produtos
  const handleBulkDelete = async () => {
    setIsDeleting(true);
    console.log('Tentando excluir em massa produtos:', selectedProducts, 'da loja:', storeId);
    try {
      await ProductService.bulkDeleteProducts(storeId, selectedProducts);
      console.log('Produtos excluídos em massa com sucesso');
      
      // Remover os produtos da lista
      setProducts(products.filter(product => !selectedProducts.includes(product.id)));
      setSelectedProducts([]);
      
      toast.success('Produtos deletados com sucesso');
    } catch (err) {
      console.error('Erro ao deletar produtos:', err);
      toast.error('Erro ao deletar produtos');
    } finally {
      setIsDeleting(false);
      setDeleteModalConfig({ isOpen: false, ids: [], isBulk: false, showDeletionOptions: false });
    }
  };

  // Definição das colunas da tabela
  const columns = useMemo(() => [
    {
      Header: 'ASIN',
      accessor: 'amz_asin',
      show: visibleColumns.amz_asin,
    },
    {
      Header: 'Amazon SKU',
      accessor: 'amz_sku',
      show: visibleColumns.amz_sku,
    },
    {
      Header: 'Title',
      accessor: 'amz_title',
      show: visibleColumns.amz_title,
    },
    {
      Header: 'Supplier SKU',
      accessor: 'supplier_sku',
      show: visibleColumns.supplier_sku,
    },
    {
      Header: 'Brand',
      accessor: 'supplier_brand',
      show: visibleColumns.supplier_brand,
    },
    {
      Header: 'Source',
      accessor: 'supplier_source',
      show: visibleColumns.supplier_source,
    },
    {
      Header: 'Supplier Price',
      accessor: 'supplier_price',
      show: visibleColumns.supplier_price,
      Cell: ({ value, row }) => (
        <div className="text-right">
          {editingCell?.id === row.original.id && editingCell?.field === 'supplier_price' ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 px-1 py-0.5 text-sm border rounded"
                min="0"
                step="0.01"
              />
              <button
                onClick={() => handleUpdateProduct(row.original.id, { supplier_price: parseFloat(editValue) })}
                disabled={isSaving}
                className="text-green-600 hover:text-green-800"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditingCell(null); setEditValue(''); }}
                className="text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end space-x-1">
              <span>${value?.toFixed(2)}</span>
              <button
                onClick={() => { setEditingCell({ id: row.original.id, field: 'supplier_price' }); setEditValue(value?.toString() || ''); }}
                className="invisible group-hover:visible text-gray-600 hover:text-gray-800"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      Header: 'Supplier Shipping',
      accessor: 'supplier_price_shipping',
      show: visibleColumns.supplier_price_shipping,
      Cell: ({ value, row }) => (
        <div className="text-right">
          {editingCell?.id === row.original.id && editingCell?.field === 'supplier_price_shipping' ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 px-1 py-0.5 text-sm border rounded"
                min="0"
                step="0.01"
              />
              <button
                onClick={() => handleUpdateProduct(row.original.id, { supplier_price_shipping: parseFloat(editValue) })}
                disabled={isSaving}
                className="text-green-600 hover:text-green-800"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditingCell(null); setEditValue(''); }}
                className="text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end space-x-1">
              <span>${value?.toFixed(2)}</span>
              <button
                onClick={() => { setEditingCell({ id: row.original.id, field: 'supplier_price_shipping' }); setEditValue(value?.toString() || ''); }}
                className="invisible group-hover:visible text-gray-600 hover:text-gray-800"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      Header: 'Amazon Price',
      accessor: 'amz_price',
      show: visibleColumns.amz_price,
      Cell: ({ value, row }) => (
        <div className="text-right">
          {editingCell?.id === row.original.id && editingCell?.field === 'amz_price' ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 px-1 py-0.5 text-sm border rounded"
                min="0"
                step="0.01"
              />
              <button
                onClick={() => handleUpdateProduct(row.original.id, { amz_price: parseFloat(editValue) })}
                disabled={isSaving}
                className="text-green-600 hover:text-green-800"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditingCell(null); setEditValue(''); }}
                className="text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end space-x-1">
              <span>${value?.toFixed(2)}</span>
              <button
                onClick={() => { setEditingCell({ id: row.original.id, field: 'amz_price' }); setEditValue(value?.toString() || ''); }}
                className="invisible group-hover:visible text-gray-600 hover:text-gray-800"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      Header: 'Amazon Shipping',
      accessor: 'amz_price_shipping',
      show: visibleColumns.amz_price_shipping,
      Cell: ({ value, row }) => (
        <div className="text-right">
          {editingCell?.id === row.original.id && editingCell?.field === 'amz_price_shipping' ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 px-1 py-0.5 text-sm border rounded"
                min="0"
                step="0.01"
              />
              <button
                onClick={() => handleUpdateProduct(row.original.id, { amz_price_shipping: parseFloat(editValue) })}
                disabled={isSaving}
                className="text-green-600 hover:text-green-800"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditingCell(null); setEditValue(''); }}
                className="text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end space-x-1">
              <span>${value?.toFixed(2)}</span>
              <button
                onClick={() => { setEditingCell({ id: row.original.id, field: 'amz_price_shipping' }); setEditValue(value?.toString() || ''); }}
                className="invisible group-hover:visible text-gray-600 hover:text-gray-800"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      Header: 'Quantity',
      accessor: 'supplier_quantity',
      show: visibleColumns.supplier_quantity,
      Cell: ({ value, row }) => (
        <div className="text-right">
          {editingCell?.id === row.original.id && editingCell?.field === 'supplier_quantity' ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 px-1 py-0.5 text-sm border rounded"
                min="0"
                step="1"
              />
              <button
                onClick={() => handleUpdateProduct(row.original.id, { supplier_quantity: parseInt(editValue, 10) })}
                disabled={isSaving}
                className="text-green-600 hover:text-green-800"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditingCell(null); setEditValue(''); }}
                className="text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end space-x-1">
              <span>{value}</span>
              <button
                onClick={() => { setEditingCell({ id: row.original.id, field: 'supplier_quantity' }); setEditValue(value?.toString() || ''); }}
                className="invisible group-hover:visible text-gray-600 hover:text-gray-800"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      Header: 'Availability',
      accessor: 'supplier_availability',
      show: visibleColumns.supplier_availability, 
      Cell: ({ value }) => {
        // Determinar a cor com base no status
        let statusColor;
        let bgColor;
        
        if (!value) {
          statusColor = 'text-gray-500';
          bgColor = 'bg-gray-100';
        } else if (value.toLowerCase().includes('stock') || value.toLowerCase().includes('available')) {
          statusColor = 'text-green-700';
          bgColor = 'bg-green-100';
        } else if (value.toLowerCase().includes('out') || value.toLowerCase().includes('unavailable')) {
          statusColor = 'text-red-700';
          bgColor = 'bg-red-100';
        } else {
          statusColor = 'text-yellow-700';
          bgColor = 'bg-yellow-100';
        }
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} ${bgColor}`}>{value || 'Desconhecido'}</span>
        );
      }
    },
    {
      Header: 'Supplier Time',
      accessor: 'supplier_handling_time',
      show: visibleColumns.supplier_handling_time,
      Cell: ({ value, row }) => (
        <div className="text-right">
          {editingCell?.id === row.original.id && editingCell?.field === 'supplier_handling_time' ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 px-1 py-0.5 text-sm border rounded"
                min="0"
                step="1"
              />
              <button
                onClick={() => handleUpdateProduct(row.original.id, { supplier_handling_time: parseInt(editValue, 10) })}
                disabled={isSaving}
                className="text-green-600 hover:text-green-800"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditingCell(null); setEditValue(''); }}
                className="text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end space-x-1">
              <span>{value} days</span>
              <button
                onClick={() => { setEditingCell({ id: row.original.id, field: 'supplier_handling_time' }); setEditValue(value?.toString() || ''); }}
                className="invisible group-hover:visible text-gray-600 hover:text-gray-800"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      Header: 'Store Time',
      accessor: 'store_handling_time',
      show: visibleColumns.store_handling_time,
      Cell: ({ value, row }) => (
        <div className="text-right">
          {editingCell?.id === row.original.id && editingCell?.field === 'store_handling_time' ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 px-1 py-0.5 text-sm border rounded"
                min="0"
                step="1"
              />
              <button
                onClick={() => handleUpdateProduct(row.original.id, { store_handling_time: parseInt(editValue, 10) })}
                disabled={isSaving}
                className="text-green-600 hover:text-green-800"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditingCell(null); setEditValue(''); }}
                className="text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end space-x-1">
              <span>{value} days</span>
              <button
                onClick={() => { setEditingCell({ id: row.original.id, field: 'store_handling_time' }); setEditValue(value?.toString() || ''); }}
                className="invisible group-hover:visible text-gray-600 hover:text-gray-800"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      Header: 'Amazon Time',
      accessor: 'amz_handling_time',
      show: visibleColumns.amz_handling_time,
      Cell: ({ value, row }) => (
        <div className="text-right">
          {editingCell?.id === row.original.id && editingCell?.field === 'amz_handling_time' ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 px-1 py-0.5 text-sm border rounded"
                min="0"
                step="1"
              />
              <button
                onClick={() => handleUpdateProduct(row.original.id, { amz_handling_time: parseInt(editValue, 10) })}
                disabled={isSaving}
                className="text-green-600 hover:text-green-800"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditingCell(null); setEditValue(''); }}
                className="text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end space-x-1">
              <span>{value} days</span>
              <button
                onClick={() => { setEditingCell({ id: row.original.id, field: 'amz_handling_time' }); setEditValue(value?.toString() || ''); }}
                className="invisible group-hover:visible text-gray-600 hover:text-gray-800"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      Header: 'Actions',
      accessor: 'actions',
      show: visibleColumns.actions,
      Cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Link
            to={`/stores/${storeId}/products/${row.original.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            <EyeIcon className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setDeleteModalConfig({ isOpen: true, ids: [row.original.id], isBulk: false })}
            className="text-red-600 hover:text-red-800"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ], [visibleColumns, editingCell, editValue, isSaving, storeId]);

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
      data: products,
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
        <div className="flex items-center space-x-4">
          {/* Botão de tema removido pois já está no layout principal */}
          {/* <button
            onClick={toggleDarkMode} 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {darkMode ? (
              <SunIcon className="h-5 w-5 text-yellow-500" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-700" />
            )}
          </button> */}
          
          <div className="relative">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              <span>Colunas</span>
            </button>
            {showColumnSelector && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10 dark:bg-gray-800 dark:border-gray-700">
                <div className="p-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Mostrar/Ocultar Colunas</div>
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
          <Link
            to={`/stores/${storeId}/products/new`}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Add Product
          </Link>
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
                placeholder="Search products..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <input
              type="text"
              value={amzAsinFilter}
              onChange={(e) => setAmzAsinFilter(e.target.value)}
              placeholder="ASIN"
              className="block min-w-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <input
              type="text"
              value={supplierSkuFilter}
              onChange={(e) => setSupplierSkuFilter(e.target.value)}
              placeholder="Supplier SKU"
              className="block min-w-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <input
              type="text"
              value={supplierBrandFilter}
              onChange={(e) => setSupplierBrandFilter(e.target.value)}
              placeholder="Brand"
              className="block min-w-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <select
              value={supplierAvailabilityFilter}
              onChange={(e) => setSupplierAvailabilityFilter(e.target.value)}
              className="block min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Availability</option>
              {availabilityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            
            <button
              onClick={() => setSearchTerm('') & setAmzAsinFilter('') & setSupplierSkuFilter('') & setSupplierBrandFilter('') & setSupplierAvailabilityFilter('')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            >
              Clear
            </button>

            {selectedProducts.length > 0 && (
              <button
                onClick={() => setDeleteModalConfig({ isOpen: true, ids: selectedProducts, isBulk: true })}
                className="ml-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center space-x-2 transition-colors duration-200"
              >
                <TrashIcon className="w-5 h-5" />
                <span>Delete Selected ({selectedProducts.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md dark:bg-gray-800 dark:border dark:border-gray-700">
        <table {...getTableProps()} className="data-table">
          <thead className="bg-gray-50 dark:bg-gray-700">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(products.map(p => p.id));
                      } else {
                        setSelectedProducts([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
                 />
                </th>
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
            {page.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} className="group hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(row.original.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, row.original.id]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== row.original.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
                    />
                  </td>
                  {row.cells.map(cell => (
                    cell.column.show !== false && (
                      <td {...cell.getCellProps()} className="px-6 py-4 whitespace-nowrap dark:text-gray-300">
                        {cell.render('Cell')}
                      </td>
                    )
                  ))}
                </tr>
              );
            })}
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
              Mostrando <span className="font-medium">{page.length}</span> de{' '}
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

      {/* Modais */}
      {/* Modal de confirmação de deleção */}
      {deleteModalConfig.isOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-opacity-75" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-gray-800">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-gray-800">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                       {deleteModalConfig.isBulk ? 'Delete Selected Products' : 'Delete Product'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {deleteModalConfig.isBulk
                          ? `Tem certeza que deseja excluir os ${deleteModalConfig.ids.length} produtos selecionados?`
                          : 'Tem certeza que deseja excluir este produto?'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => {
                    if (deleteModalConfig.isBulk) {
                      handleBulkDelete();
                    } else {
                      handleDeleteProduct(deleteModalConfig.ids[0]);
                    }
                  }}
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:ring-offset-gray-800 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModalConfig({ isOpen: false, ids: [], isBulk: false })}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage; 
