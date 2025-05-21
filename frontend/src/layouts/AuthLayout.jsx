import { Outlet } from 'react-router-dom';

/**
 * Layout for authentication pages (login, register, etc.)
 */
const AuthLayout = () => {
  return (
    <div className="bg-gradient-to-r from-primary-600 to-secondary-600 min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-white">
          Amazon Store Manager
        </h2>
        <p className="mt-2 text-center text-sm text-white text-opacity-80">
          SaaS platform for managing multiple Amazon stores
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Dynamic content (login, register, etc.) */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
