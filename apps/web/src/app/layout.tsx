import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'SitesBD - Premium Web Hosting Platform',
  description: 'The premier web hosting platform for Bangladesh',
};

// Marketing navigation links
const marketingNavLinks = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
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
        <div className="min-h-screen bg-white">
          <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href="/" className="text-2xl font-bold text-blue-600">
                      SitesBD
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {marketingNavLinks.map((link) => (
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
                <div className="flex items-center space-x-4">
                  {/* Auth links point to dashboard subdomain */}
                  <Link
                    href={`${DASHBOARD_URL}/login`}
                    className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2"
                  >
                    Login
                  </Link>
                  <Link
                    href={`${DASHBOARD_URL}/register`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
          <footer className="bg-gray-100 py-8 mt-12">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
              © 2026 SitesBD. All rights reserved.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
