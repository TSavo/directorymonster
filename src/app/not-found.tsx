import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Site Not Found</h1>
      <p className="text-lg mb-8">
        The directory site you are looking for does not exist or has been moved.
      </p>
      <Link 
        href="/"
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Return to Main Platform
      </Link>
    </div>
  );
}