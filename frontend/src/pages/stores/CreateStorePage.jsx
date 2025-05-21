import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { StoreContext } from '../../context/StoreContext';

const CreateStorePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createStore } = useContext(StoreContext);
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await createStore(formData);
      if (result.success) {
        toast.success('Loja criada com sucesso!');
        // Redirecionar para a página de credenciais da Amazon com o ID da loja
        navigate(`/stores/${result.store.id}/amazon-credentials`);
      } else {
        throw new Error(result.error || 'Erro ao criar loja');
      }
    } catch (error) {
      console.error('Erro ao criar loja:', error);
      toast.error(error.message || 'Não foi possível criar a loja');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Criar Nova Loja</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nome da Loja*
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descrição (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Criando...' : 'Criar e Configurar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateStorePage;
