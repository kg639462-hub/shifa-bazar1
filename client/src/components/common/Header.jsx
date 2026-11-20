import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, LogOut, Package, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import DispensaryLogo from './DispensaryLogo';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { user, isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#f0faf4]/95 backdrop-blur-md border-b border-[#e2ece5]">
      {/* Top Main Navigation Bar */}
      <div className="w-full max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Hamburger & Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[#0a2e1e] hover:bg-[#e2ece5] rounded-md transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Dispensary Logo (Separate interchangeable component) */}
          <DispensaryLogo variant="header" />
        </div>

        {/* Center: Desktop Navigation Links (Styled from screenshots) */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-[#0a2e1e]/80">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-full transition-all ${
              isActive('/')
                ? 'bg-[#dcfce7] text-[#0a2e1e] font-bold shadow-xs'
                : 'hover:text-[#0a2e1e] hover:bg-[#e2ece5]/60'
            }`}
          >
            Home
          </Link>

          <Link
            to="/contact"
            className={`px-3 py-1.5 rounded-full transition-all ${
              isActive('/contact')
                ? 'bg-[#dcfce7] text-[#0a2e1e] font-bold shadow-xs'
                : 'hover:text-[#0a2e1e] hover:bg-[#e2ece5]/60'
            }`}
          >
            Contact
          </Link>

          {!isAuthenticated ? (
            <>
              <Link
                to="/signin"
                className={`px-3 py-1.5 rounded-full transition-all ${
                  isActive('/signin')
                    ? 'bg-[#dcfce7] text-[#0a2e1e] font-bold shadow-xs'
                    : 'hover:text-[#0a2e1e] hover:bg-[#e2ece5]/60'
                }`}
              >
                Login / Sign In
              </Link>

              <Link
                to="/register"
                className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                  isActive('/register')
                    ? 'bg-[#0a2e1e] text-white shadow-sm'
                    : 'bg-[#e2ece5] text-[#0a2e1e] hover:bg-[#0a2e1e] hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Register
              </Link>
            </>
          ) : (
            <Link
              to="/orders"
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                isActive('/orders')
                  ? 'bg-[#dcfce7] text-[#0a2e1e] font-bold shadow-xs'
                  : 'hover:text-[#0a2e1e] hover:bg-[#e2ece5]/60'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-[#0a2e1e]" />
              My Orders & History
            </Link>
          )}

          <Link
            to="/cart"
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
              isActive('/cart')
                ? 'bg-[#dcfce7] text-[#0a2e1e] font-bold shadow-xs'
                : 'hover:text-[#0a2e1e] hover:bg-[#e2ece5]/60'
            }`}
          >
            Cart
            <span className="ml-0.5 px-1.5 py-0.2 bg-[#0a2e1e] text-white text-[10px] rounded-full font-bold">
              {itemCount}
            </span>
          </Link>
        </nav>

        {/* Right: Quick Action Icons */}
        <div className="flex items-center gap-3">
          {/* Cart Icon with count badge */}
          <Link
            to="/cart"
            className="relative p-2 text-[#0a2e1e] hover:bg-[#e2ece5] rounded-full transition-colors"
            title="View Dispensary Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute 1 top-0.5 right-0.5 bg-[#0a2e1e] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Profile Dropdown / Auth Button */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-8 h-8 rounded-full bg-[#0a2e1e] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              title={isAuthenticated ? user?.email : 'Account'}
            >
              <User className="w-4 h-4" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#e2ece5] py-2 z-50">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 border-b border-[#f0f0f0]">
                      <p className="text-xs text-gray-500">Apothecary Patient</p>
                      <p className="text-sm font-semibold text-[#0a2e1e] truncate">
                        {user?.user_metadata?.full_name || user?.email}
                      </p>
                    </div>
                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#0a2e1e] hover:bg-[#f0faf4] transition-colors"
                    >
                      <Package className="w-4 h-4 text-[#0a2e1e]" />
                      My Orders & Cancellations
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setUserDropdownOpen(false);
                        navigate('/signin');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#0a2e1e] hover:bg-[#f0faf4]"
                    >
                      <User className="w-4 h-4" />
                       Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#0a2e1e] hover:bg-[#f0faf4]"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Patient Enrollment
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e2ece5] bg-[#f0faf4] px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
              isActive('/') ? 'bg-[#dcfce7] text-[#0a2e1e]' : 'text-[#0a2e1e]/80'
            }`}
          >
            Home / Botanical Compendium
          </Link>
          <Link
            to="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold ${
              isActive('/cart') ? 'bg-[#dcfce7] text-[#0a2e1e]' : 'text-[#0a2e1e]/80'
            }`}
          >
            <span>Prescription Cart</span>
            <span className="bg-[#0a2e1e] text-white px-2 py-0.5 rounded-full text-xs">
              {itemCount}
            </span>
          </Link>
          <Link
            to="/orders"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
              isActive('/orders') ? 'bg-[#dcfce7] text-[#0a2e1e]' : 'text-[#0a2e1e]/80'
            }`}
          >
            My Orders & Cancellations
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
              isActive('/contact') ? 'bg-[#dcfce7] text-[#0a2e1e]' : 'text-[#0a2e1e]/80'
            }`}
          >
            Contact Dispensary
          </Link>
          {!isAuthenticated ? (
            <div className="pt-2 border-t border-[#e2ece5] flex gap-2">
              <Link
                to="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs font-bold rounded-lg border border-[#0a2e1e] text-[#0a2e1e]"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs font-bold rounded-lg bg-[#0a2e1e] text-white"
              >
                Register
              </Link>
            </div>
          ) : (
            <button
              onClick={() => {
                signOut();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 font-semibold"
            >
              Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
