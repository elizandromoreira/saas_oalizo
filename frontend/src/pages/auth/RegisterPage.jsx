import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';

const RegisterPage = () => {
  const { register: registerUser } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: ''
    }
  });

  const password = watch('password', '');

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const result = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password
      });
      
      if (result.success) {
        toast.success('Registration successful! You can now log in.');
        navigate('/auth/login');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Error during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="mt-2 text-center text-2xl font-bold text-gray-900">
        Create your account
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <div className="mt-1">
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              className="form-input"
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

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
              autoComplete="new-password"
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

        <div>
          <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="mt-1">
            <input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              required
              className="form-input"
              {...register('passwordConfirm', {
                required: 'Password confirmation is required',
                validate: value => value === password || 'Passwords do not match'
              })}
            />
            {errors.passwordConfirm && (
              <p className="mt-1 text-sm text-red-600">{errors.passwordConfirm.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn btn-primary w-full ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Signing up...' : 'Sign up'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
