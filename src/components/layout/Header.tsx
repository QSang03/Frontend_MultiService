'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui';
import { APP_NAME, ROUTES, getDashboardByRole } from '@/constants';

/** Get the portal prefix based on user role */
function getPortalPrefix(role?: string | number): string {
  if (!role) return '/admin';
  const r = String(role).toUpperCase();
  if (r.includes('SALE') || r === '5') return '/sale';
  if (r.includes('TECH') || r === '6' || r === '7') return '/tech';
  return '/admin';
}

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const portalPrefix = useMemo(() => getPortalPrefix(user?.role), [user?.role]);
  const dashboardLink = useMemo(() => getDashboardByRole(String(user?.role ?? '')), [user?.role]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blue-600">{APP_NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href={ROUTES.SERVICES}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Dịch vụ
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href={dashboardLink}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href={`${portalPrefix}/orders`}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Đơn hàng
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={`${portalPrefix}/profile`}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{user?.name}</span>
                </Link>
                <Button variant="outline" size="sm" onClick={logout}>
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <>
                <Link href={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href={ROUTES.REGISTER}>
                  <Button variant="primary" size="sm">
                    Đăng ký
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              <Link
                href={ROUTES.SERVICES}
                className="text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dịch vụ
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href={dashboardLink}
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={`${portalPrefix}/orders`}
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đơn hàng
                  </Link>
                  <Link
                    href={`${portalPrefix}/profile`}
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Tài khoản
                  </Link>
                  <Button variant="outline" size="sm" onClick={logout}>
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-2">
                  <Link href={ROUTES.LOGIN} onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href={ROUTES.REGISTER} onClick={() => setIsMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Đăng ký
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
