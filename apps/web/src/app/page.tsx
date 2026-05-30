export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">SitesBD Platform</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Landing Website
      </p>
      <div className="mt-8 space-y-2 text-center">
        <p><strong>Environment:</strong> {process.env.NEXT_PUBLIC_ENVIRONMENT || 'development'}</p>
        <p><strong>Version:</strong> 0.1.0</p>
        <p><strong>Health:</strong> OK</p>
      </div>
    </main>
  );
}
