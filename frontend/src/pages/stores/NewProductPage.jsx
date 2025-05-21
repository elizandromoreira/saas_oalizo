import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ProductService from '../../services/product.service';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const NewProductPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState({
    amz_asin: '',
    amz_sku: '',
    amz_title: '',
    supplier_sku: '',
    supplier_brand: '',
    supplier_source: '',
    supplier_price: '',
    supplier_price_shipping: '',
    amz_price: '',
    amz_price_shipping: '',
    supplier_quantity: '',
    supplier_availability: 'Em estoque',
    supplier_handling_time: '',
    store_handling_time: '',
    amz_handling_time: ''
  });

  // Função para lidar com mudanças nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Converter para número se for um campo numérico
    const processedValue = type === 'number' ? 
      (value === '' ? '' : Number(value)) : 
      value;
    
    setProduct({
      ...product,
      [name]: processedValue
    });
  };

  // Função para criar um novo produto
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!product.supplier_sku) {
      toast.error('SKU do fornecedor é obrigatório');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await ProductService.createProduct(storeId, product);
      toast.success('Produto criado com sucesso');
      navigate(`/stores/${storeId}/products/${response.data.id}`);
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      toast.error('Erro ao criar produto');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleCreateProduct} className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Informações do Produto</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Preencha os campos para criar um novo produto.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {/* Identificadores Amazon */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">ASIN</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="amz_asin"
                  value={product.amz_asin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ASIN"
                />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">SKU Amazon</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="amz_sku"
                  value={product.amz_sku}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="SKU Amazon"
                />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Título</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="amz_title"
                  value={product.amz_title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Título do produto"
                />
              </dd>
            </div>

            {/* Identificadores Fornecedor */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                SKU Fornecedor <span className="text-red-500">*</span>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="supplier_sku"
                  value={product.supplier_sku}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="SKU Fornecedor"
                  required
                />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Marca</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="supplier_brand"
                  value={product.supplier_brand}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Marca"
                />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Fonte</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="supplier_source"
                  value={product.supplier_source}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Fonte"
                />
              </dd>
            </div>

            {/* Preços e Custos */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Preço Fornecedor</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="number"
                  name="supplier_price"
                  value={product.supplier_price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Frete Fornecedor</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="number"
                  name="supplier_price_shipping"
                  value={product.supplier_price_shipping}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Preço Amazon</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="number"
                  name="amz_price"
                  value={product.amz_price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Frete Amazon</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="number"
                  name="amz_price_shipping"
                  value={product.amz_price_shipping}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </dd>
            </div>

            {/* Disponibilidade e Estoque */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Disponibilidade</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <select
                  name="supplier_availability"
                  value={product.supplier_availability}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Em estoque">Em estoque</option>
                  <option value="Esgotado">Esgotado</option>
                  <option value="Pré-venda">Pré-venda</option>
                </select>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Quantidade</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="number"
                  name="supplier_quantity"
                  value={product.supplier_quantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </dd>
            </div>

            {/* Tempos de Manuseio */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tempo Manuseio Fornecedor (dias)</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="number"
                  name="supplier_handling_time"
                  value={product.supplier_handling_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tempo Manuseio Loja (dias)</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="number"
                  name="store_handling_time"
                  value={product.store_handling_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tempo Manuseio Amazon (dias)</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <input
                  type="number"
                  name="amz_handling_time"
                  value={product.amz_handling_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </dd>
            </div>
          </dl>
        </div>
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            type="button"
            onClick={() => navigate(`/stores/${storeId}/products`)}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? 'Criando...' : 'Criar Produto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewProductPage; 