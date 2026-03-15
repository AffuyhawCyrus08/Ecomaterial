import React, { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const MainLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemsCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#13ec80] rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">W2V</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">Waste2Value</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link to="/products" className="text-gray-300 hover:text-white transition-colors">
                Materials
              </Link>
              <Link to="/products?category=plastics" className="text-gray-300 hover:text-white transition-colors">
                Plastics
              </Link>
              <Link to="/products?category=metals" className="text-gray-300 hover:text-white transition-colors">
                Metals
              </Link>
              <Link to="/products?category=textiles" className="text-gray-300 hover:text-white transition-colors">
                Textiles
              </Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Cart */}
              <Link to="/cart" className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#13ec80] text-black text-xs font-bold rounded-full flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                    <div className="w-8 h-8 bg-[#1a1a2e] rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">{user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}</span>
                    </div>
                    <span className="hidden sm:block">{user?.firstName || user?.name}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] rounded-lg shadow-lg border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link to="/dashboard" className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-t-lg">
                      Dashboard
                    </Link>
                    <Link to="/profile" className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5">
                      Profile
                    </Link>
                    <Link to="/orders" className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5">
                      Orders
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5">
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-b-lg"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="px-4 py-2 bg-[#13ec80] text-black font-medium rounded-lg hover:bg-[#0fc76a] transition-colors">
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-t border-white/10">
            <nav className="px-4 py-4 space-y-2">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-300 hover:text-white">Home</Link>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-300 hover:text-white">Materials</Link>
              <Link to="/products?category=plastics" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-300 hover:text-white">Plastics</Link>
              <Link to="/products?category=metals" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-300 hover:text-white">Metals</Link>
              <Link to="/products?category=textiles" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-300 hover:text-white">Textiles</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#13ec80] rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-sm">W2V</span>
                </div>
                <span className="text-white font-semibold text-lg">Waste2Value</span>
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                The leading marketplace for recycled industrial materials. Connecting suppliers with manufacturers for a sustainable future.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/products" className="text-gray-400 hover:text-white text-sm">Browse Materials</Link></li>
                <li><Link to="/products?category=plastics" className="text-gray-400 hover:text-white text-sm">Plastics</Link></li>
                <li><Link to="/products?category=metals" className="text-gray-400 hover:text-white text-sm">Metals</Link></li>
                <li><Link to="/products?category=textiles" className="text-gray-400 hover:text-white text-sm">Textiles</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Waste2Value. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
