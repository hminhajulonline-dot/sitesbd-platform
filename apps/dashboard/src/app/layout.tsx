import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SitesBD Dashboard',
  description: 'User Dashboard - SitesBD Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
