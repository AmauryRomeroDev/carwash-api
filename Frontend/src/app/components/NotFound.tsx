import { Link } from "react-router";
import { Home, ArrowLeft } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
        <h2 className="text-3xl md:text-4xl mb-6">
          Página No Encontrada
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Home className="h-5 w-5" />
            Volver al Inicio
          </Link>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver Atrás
          </button>
        </div>
      </div>
    </div>
  );
}
