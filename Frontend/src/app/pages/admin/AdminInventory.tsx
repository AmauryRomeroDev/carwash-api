import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, RefreshCw, AlertCircle, X, TrendingUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TopNav } from '../../components/TopNav';
import { BottomNav } from '../../components/BottomNav';

interface Product {
  id: number;
  product_name: string;
  unit_price: number;
  stock: number;
  is_active: boolean;
  description: string;
  discount: number;
  has_discount: boolean;
}

export function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [restockingItem, setRestockingItem] = useState<Product | null>(null);
  
  const [restockData, setRestockData] = useState({ amount: 1, note: '' });
  const [formData, setFormData] = useState({
    product_name: '',
    unit_price: 0,
    stock: 0,
    description: '',
    is_active: true,
    discount: 0,
    has_discount: false
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

    const url = editingItem 
      ? `http://localhost:8000/api/v1/products/${editingItem.id}` 
      : "http://localhost:8000/api/v1/products/";
    
    const method = editingItem ? "PUT" : "POST";

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

  const handleRestock = async () => {
    if (!restockingItem) return;

    const token = getToken();
    if (!token) return;

    try {
      // Formato correcto según el esquema del backend
      const movementData = {
        product_id: restockingItem.id,
        type: "in",
        amount: restockData.amount,
        order_id: 0,
        employee_id: 0,
        note: restockData.note || "Reabastecimiento manual desde panel"
      };

      console.log("Enviando movimiento:", movementData);

      const res = await fetch("http://localhost:8000/api/v1/staff/inventory/movements", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(movementData)
      });

      if (res.ok) {
        fetchProducts(); // Refrescar productos
        setShowRestockModal(false);
        setRestockingItem(null);
        setRestockData({ amount: 1, note: '' });
        alert("Stock actualizado correctamente");
      } else {
        const errorData = await res.json();
        console.error("Error response:", errorData);
        alert(errorData.detail || "Error al reabastecer");
      }
    } catch (error) {
      console.error("Error en movimiento:", error);
      alert("Error de conexión al servidor");
    }
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
    setEditingItem(null);
    setFormData({ 
      product_name: '', 
      unit_price: 0, 
      stock: 0, 
      description: '', 
      is_active: true, 
      discount: 0, 
      has_discount: false 
    });
  };

  const totalValue = products.reduce((sum, p) => sum + (p.unit_price * p.stock), 0);
  const lowStockCount = products.filter(p => p.stock < 10 && p.is_active).length;

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-500">Cargando inventario...</p>
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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
            <p className="text-gray-500 mt-1">Control de stock y movimientos de almacén</p>
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
          <StatCard icon={Package} label="Total Productos" value={products.length} color="blue" />
          <StatCard icon={AlertCircle} label="Bajo Stock" value={lowStockCount} color="amber" />
          <StatCard icon={TrendingUp} label="Valor Total" value={`$${totalValue.toFixed(2)}`} color="emerald" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Producto</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Precio Unit.</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Stock</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.filter(p => p.is_active).map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{product.product_name}</p>
                      <p className="text-xs text-gray-400">ID: #{product.id}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">${product.unit_price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${product.stock < 10 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {product.stock} unidades
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock <= 0 ? 'bg-red-100 text-red-700' : 
                        product.stock < 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {product.stock <= 0 ? 'Agotado' : product.stock < 10 ? 'Stock Bajo' : 'Disponible'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => { setRestockingItem(product); setShowRestockModal(true); }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Entrada de Inventario"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingItem(product);
                          setFormData({
                            product_name: product.product_name,
                            unit_price: product.unit_price,
                            stock: product.stock,
                            description: product.description || '',
                            is_active: product.is_active,
                            discount: product.discount,
                            has_discount: product.has_discount
                          });
                          setShowForm(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reabastecer Modal */}
      <AnimatePresence>
        {showRestockModal && restockingItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Entrada de Inventario</h2>
                <button onClick={() => setShowRestockModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-500 mb-6">Añadiendo stock para: <b>{restockingItem.product_name}</b></p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad a añadir</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={restockData.amount}
                    onChange={(e) => setRestockData({...restockData, amount: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nota / Referencia</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Compra proveedor X"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={restockData.note}
                    onChange={(e) => setRestockData({...restockData, note: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleRestock} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                    Confirmar Entrada
                  </button>
                  <button onClick={() => setShowRestockModal(false)} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Form Modal (Nuevo/Editar) */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingItem ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                <button onClick={handleCloseForm} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre del Producto *</label>
                  <input 
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descripción del producto"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Precio Unitario ($) *</label>
                    <input 
                      type="number" step="0.01" required
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock Inicial *</label>
                    <input 
                      type="number" required
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Descuento (%)</label>
                    <input 
                      type="number" step="1"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.discount}
                      onChange={(e) => setFormData({...formData, discount: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-8">
                    <input 
                      type="checkbox"
                      id="has_discount"
                      checked={formData.has_discount}
                      onChange={(e) => setFormData({...formData, has_discount: e.target.checked})}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="has_discount" className="text-sm font-medium text-gray-700">Aplicar descuento</label>
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 mt-4 transition-all shadow-lg shadow-blue-100">
                  {editingItem ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
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

// Sub-componente para las tarjetas de estadísticas
function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600"
  };
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}