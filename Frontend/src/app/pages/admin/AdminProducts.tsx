import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, X, Star, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TopNav } from '../../components/TopNav';
import { BottomNav } from '../../components/BottomNav';

interface Product {
  id: number;
  product_name: string;
  description: string;
  unit_price: number;
  stock: number;
  discount: number;
  has_discount: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    unit_price: 0,
    stock: 0,
    discount: 0,
    has_discount: false,
  });

  const getToken = () => localStorage.getItem("access_token");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const token = getToken();
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/products/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = getToken();
    if (!token) {
      console.error("No hay token de acceso disponible");
      return;
    }

    const url = editingProduct 
      ? `http://localhost:8000/api/v1/products/${editingProduct.id}` 
      : "http://localhost:8000/api/v1/products/";
    
    const method = editingProduct ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          product_name: formData.product_name,
          description: formData.description || "Sin descripción",
          unit_price: Number(formData.unit_price),
          stock: Number(formData.stock),
          discount: formData.discount,
          has_discount: formData.has_discount
        })
      });

      if (res.status === 401) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      if (res.ok) {
        fetchProducts();
        handleCloseForm();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Error al guardar el producto");
      }
    } catch (error) {
      console.error("Error en la petición:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      description: product.description || '',
      unit_price: product.unit_price,
      stock: product.stock,
      discount: product.discount,
      has_discount: product.has_discount,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchProducts();
      } else if (res.status === 401) {
        alert("Tu sesión ha expirado");
        localStorage.clear();
        window.location.href = "/";
      } else {
        alert("Error al eliminar el producto");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      product_name: '',
      description: '',
      unit_price: 0,
      stock: 0,
      discount: 0,
      has_discount: false,
    });
  };

  const activeProducts = products.filter(p => p.is_active);
  const totalValue = products.reduce((sum, p) => sum + (p.unit_price * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock < 20 && p.is_active);

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-500">Cargando productos...</p>
      </div>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Productos</h1>
            <p className="text-gray-500 mt-1">Administra el catálogo de productos</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Producto</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Productos Activos</p>
                <p className="text-2xl font-bold text-gray-900">{activeProducts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Bajo Stock</p>
                <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Producto</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Precio</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Stock</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Descuento</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.filter(p => p.is_active).map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.product_name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">${product.unit_price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${
                        product.stock === 0 ? 'text-red-600' : 
                        product.stock < 20 ? 'text-amber-600' : 'text-gray-900'
                      }`}>
                        {product.stock} unidades
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {product.has_discount && product.discount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                          -{product.discount}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin descuento</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock === 0 ? 'bg-red-100 text-red-700' :
                        product.stock < 20 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {product.stock === 0 ? 'Agotado' : product.stock < 20 ? 'Stock Bajo' : 'Disponible'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button onClick={handleCloseForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Ej: Shampoo Premium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    rows={3}
                    placeholder="Descripción del producto"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Unitario ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock *
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descuento (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-8">
                    <input
                      type="checkbox"
                      id="has_discount"
                      checked={formData.has_discount}
                      onChange={(e) => setFormData({ ...formData, has_discount: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="has_discount" className="text-sm font-medium text-gray-700">
                      Aplicar descuento
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-6 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}