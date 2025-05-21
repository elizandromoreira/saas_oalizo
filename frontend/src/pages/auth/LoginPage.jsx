import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const result = await login(data);
      
      if (result.success) {
        // Use the redirectPath from login result
        if (result.redirectPath) {
          navigate(result.redirectPath);
        } else if (result.stores && result.stores.length > 0) {
          navigate('/dashboard');
        } else {
          navigate('/stores/new');
        }
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="mt-2 text-center text-2xl font-bold text-gray-900">
        Sign in to your account
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="form-input"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-input"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
              Don't have an account? Sign up
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn btn-primary w-full ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
