import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ProductService from '../../services/product.service';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ProductDetailPage = () => {
  const { storeId, productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Buscar detalhes do produto
  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsLoading(true);
      try {
        const response = await ProductService.getProductById(storeId, productId);
        setProduct(response.data);
        setEditedProduct(response.data);
      } catch (err) {
        console.error('Erro ao buscar detalhes do produto:', err);
        toast.error('Erro ao carregar detalhes do produto');
        setError('Não foi possível carregar os detalhes do produto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [storeId, productId]);

  // Função para atualizar o produto
  const handleUpdateProduct = async () => {
    setIsLoading(true);
    try {
      const response = await ProductService.updateProduct(storeId, productId, editedProduct);
      setProduct(response.data);
      setIsEditing(false);
      toast.success('Produto atualizado com sucesso');
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      toast.error('Erro ao atualizar produto');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para deletar o produto
  const handleDeleteProduct = async () => {
    setIsDeleting(true);
    try {
      await ProductService.deleteProduct(storeId, productId);
      toast.success('Produto deletado com sucesso');
      navigate(`/stores/${storeId}/products`);
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      toast.error('Erro ao deletar produto');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Função para lidar com mudanças nos campos editáveis
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Converter para número se for um campo numérico
    const processedValue = type === 'number' ? 
      (value === '' ? '' : Number(value)) : 
      value;
    
    setEditedProduct({
      ...editedProduct,
      [name]: processedValue
    });
  };

  if (isLoading && !product) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          onClick={() => navigate(`/stores/${storeId}/products`)}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
        >
          Voltar para a lista de produtos
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to={`/stores/${storeId}/products`}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {product?.amz_title || `Produto ${product?.amz_asin || product?.supplier_sku}`}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleUpdateProduct}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {isLoading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedProduct(product);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <PencilIcon className="w-4 h-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center space-x-2"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Deletar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Detalhes do produto */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Detalhes do Produto</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Informações detalhadas sobre o produto.</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            {/* Identificadores Amazon */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">ASIN</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="text"
                    name="amz_asin"
                    value={editedProduct.amz_asin || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ASIN"
                    disabled
                  />
                ) : (
                  product?.amz_asin || 'N/A'
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">SKU Amazon</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="text"
                    name="amz_sku"
                    value={editedProduct.amz_sku || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="SKU Amazon"
                    disabled
                  />
                ) : (
                  product?.amz_sku || 'N/A'
                )}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Título</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="text"
                    name="amz_title"
                    value={editedProduct.amz_title || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Título"
                    disabled
                  />
                ) : (
                  product?.amz_title || 'N/A'
                )}
              </dd>
            </div>

            {/* Identificadores Fornecedor */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">SKU Fornecedor</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="text"
                    name="supplier_sku"
                    value={editedProduct.supplier_sku || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="SKU Fornecedor"
                    disabled
                  />
                ) : (
                  product?.supplier_sku || 'N/A'
                )}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Marca</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="text"
                    name="supplier_brand"
                    value={editedProduct.supplier_brand || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Marca"
                    disabled
                  />
                ) : (
                  product?.supplier_brand || 'N/A'
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Fonte</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="text"
                    name="supplier_source"
                    value={editedProduct.supplier_source || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Fonte"
                    disabled
                  />
                ) : (
                  product?.supplier_source || 'N/A'
                )}
              </dd>
            </div>

            {/* Preços e Custos */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Preço Fornecedor</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="number"
                    name="supplier_price"
                    value={editedProduct.supplier_price || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Preço Fornecedor"
                    min="0"
                    step="0.01"
                  />
                ) : (
                  `$${product?.supplier_price?.toFixed(2) || '0.00'}`
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Frete Fornecedor</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="number"
                    name="supplier_price_shipping"
                    value={editedProduct.supplier_price_shipping || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Frete Fornecedor"
                    min="0"
                    step="0.01"
                  />
                ) : (
                  `$${product?.supplier_price_shipping?.toFixed(2) || '0.00'}`
                )}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Preço Amazon</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="number"
                    name="amz_price"
                    value={editedProduct.amz_price || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Preço Amazon"
                    min="0"
                    step="0.01"
                  />
                ) : (
                  `$${product?.amz_price?.toFixed(2) || '0.00'}`
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Frete Amazon</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="number"
                    name="amz_price_shipping"
                    value={editedProduct.amz_price_shipping || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Frete Amazon"
                    min="0"
                    step="0.01"
                  />
                ) : (
                  `$${product?.amz_price_shipping?.toFixed(2) || '0.00'}`
                )}
              </dd>
            </div>

            {/* Disponibilidade e Estoque */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Disponibilidade</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="text"
                    name="supplier_availability"
                    value={editedProduct.supplier_availability || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Disponibilidade"
                    disabled
                  />
                ) : (
                  product?.supplier_availability || 'N/A'
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Quantidade</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="number"
                    name="supplier_quantity"
                    value={editedProduct.supplier_quantity || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Quantidade"
                    min="0"
                    step="1"
                  />
                ) : (
                  product?.supplier_quantity || '0'
                )}
              </dd>
            </div>

            {/* Tempos de Manuseio */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tempo Manuseio Fornecedor</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="number"
                    name="supplier_handling_time"
                    value={editedProduct.supplier_handling_time || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tempo Manuseio Fornecedor"
                    min="0"
                    step="1"
                  />
                ) : (
                  `${product?.supplier_handling_time || '0'} dias`
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tempo Manuseio Loja</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="number"
                    name="store_handling_time"
                    value={editedProduct.store_handling_time || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tempo Manuseio Loja"
                    min="0"
                    step="1"
                  />
                ) : (
                  `${product?.store_handling_time || '0'} dias`
                )}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tempo Manuseio Amazon</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="number"
                    name="amz_handling_time"
                    value={editedProduct.amz_handling_time || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tempo Manuseio Amazon"
                    min="0"
                    step="1"
                  />
                ) : (
                  `${product?.amz_handling_time || '0'} dias`
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Modal de confirmação de deleção */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Deletar produto
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isDeleting ? 'Deletando...' : 'Deletar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage; 