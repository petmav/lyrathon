export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Lyrathon
        </h1>
        <p className="text-lg mb-6">
          A Next.js application with RAG (Retrieval-Augmented Generation) pipeline capabilities.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-3">Getting Started</h2>
          <p className="mb-2">
            This is a scaffold for building a RAG-powered application. The project includes:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Next.js 15 with App Router</li>
            <li>TypeScript for type safety</li>
            <li>ESLint for code quality</li>
            <li>Ready for RAG pipeline integration</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">📚 Documentation</h3>
            <p className="text-gray-600">
              Check the README.md for detailed setup and usage instructions.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">🚀 Development</h3>
            <p className="text-gray-600">
              Run <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code> to start the development server.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
