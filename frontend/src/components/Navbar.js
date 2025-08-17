import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, User, LogOut, Settings, BarChart3 } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin, isCompany } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">BehaviorMarket</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                
                {user?.role === 'user' && (
                  <>
                    <Link
                      to="/behaviors"
                      className={`nav-link ${isActive('/behaviors') ? 'active' : ''}`}
                    >
                      Behaviors
                    </Link>
                    <Link
                      to="/predictions"
                      className={`nav-link ${isActive('/predictions') ? 'active' : ''}`}
                    >
                      Predictions
                    </Link>
                  </>
                )}

                <Link
                  to="/marketplace"
                  className={`nav-link ${isActive('/marketplace') ? 'active' : ''}`}
                >
                  Marketplace
                </Link>

                {isCompany && (
                  <Link
                    to="/company"
                    className={`nav-link ${isActive('/company') ? 'active' : ''}`}
                  >
                    Company
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                  >
                    Admin
                  </Link>
                )}

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                    <User className="h-5 w-5" />
                    <span>{user?.firstName}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/pricing" className="nav-link">
                  Pricing
                </Link>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                
                {user?.role === 'user' && (
                  <>
                    <Link
                      to="/behaviors"
                      className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Behaviors
                    </Link>
                    <Link
                      to="/predictions"
                      className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Predictions
                    </Link>
                  </>
                )}

                <Link
                  to="/marketplace"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Marketplace
                </Link>

                {isCompany && (
                  <Link
                    to="/company"
                    className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Company
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/pricing"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-base font-medium text-blue-600 hover:text-blue-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
