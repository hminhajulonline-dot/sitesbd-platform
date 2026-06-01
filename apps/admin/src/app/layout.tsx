import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'SitesBD Admin',
  description: 'Admin Dashboard - SitesBD Platform',
};

// Admin navigation links
const adminNavLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/users', label: 'Users' },
  { href: '/settings', label: 'Settings' },
];

// Environment variables for cross-subdomain links
const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.sitesbd.com';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-100">
          <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                      SitesBD Admin
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {adminNavLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <Link
                    href={`${DASHBOARD_URL}/profile`}
                    className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2"
                  >
                    Profile
                  </Link>
                  <form action={`${DASHBOARD_URL}/api/auth/logout`} method="POST">
                    <button
                      type="submit"
                      className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
