import { useState, useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`bg-primary-800 text-white ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 ease-in-out`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-primary-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              )}
            </svg>
          </button>
        </div>

        <nav className="mt-6">
          <ul>
            <li className="px-4 py-2 hover:bg-primary-700">
              <Link to="/admin/dashboard" className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className={`ml-2 ${isSidebarOpen ? 'block' : 'hidden'}`}>
                  Dashboard
                </span>
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-primary-700">
              <Link to="/admin/stores" className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span className={`ml-2 ${isSidebarOpen ? 'block' : 'hidden'}`}>
                  Stores
                </span>
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-primary-700">
              <Link to="/admin/users" className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className={`ml-2 ${isSidebarOpen ? 'block' : 'hidden'}`}>
                  Users
                </span>
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-primary-700">
              <Link to="/admin/subscriptions" className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className={`ml-2 ${isSidebarOpen ? 'block' : 'hidden'}`}>
                  Subscriptions
                </span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-4 py-3 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Platform Administration
            </h2>
            <div className="flex items-center">
              <div className="mr-4">
                <span className="text-sm text-gray-600">
                  {user?.name || user?.email}
                </span>
              </div>
              <div className="relative">
                <button
                  onClick={logout}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-primary-600 focus:outline-none"
                >
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
