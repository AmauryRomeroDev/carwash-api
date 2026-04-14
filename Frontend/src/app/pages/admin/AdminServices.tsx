import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Sparkles, X, Clock, DollarSign, CheckCircle, Loader2, AlertCircle, Eye, EyeOff, Archive, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TopNav } from '../../components/TopNav';
import { BottomNav } from '../../components/BottomNav';

interface Service {
  id: number;
  service_name: string;
  description: string;
  price: number;
  duration_minutes: number;
  has_discount: boolean;
  discount: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    price: 0,
    duration_minutes: 30,
    discount: 0,
    has_discount: false,
    is_active: true,
  });

  const getToken = () => localStorage.getItem("access_token");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const token = getToken();
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/services/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const transformedData = data.map((service: any) => ({
          ...service,
          price: typeof service.price === 'number' ? service.price : Number(service.price) || 0,
          discount: typeof service.discount === 'number' ? service.discount : Number(service.discount) || 0,
          duration_minutes: typeof service.duration_minutes === 'number' ? service.duration_minutes : Number(service.duration_minutes) || 0,
        }));
        setServices(transformedData);
      } else if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error cargando servicios:", error);
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

    const url = editingService 
      ? `http://localhost:8000/api/v1/services/${editingService.id}` 
      : "http://localhost:8000/api/v1/services/";
    
    const method = editingService ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          service_name: formData.service_name,
          description: formData.description,
          price: Number(formData.price),
          duration_minutes: Number(formData.duration_minutes),
          discount: formData.has_discount ? formData.discount : 0,
          has_discount: formData.has_discount,
          is_active: formData.is_active
        })
      });

      if (res.status === 401) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      if (res.ok) {
        await fetchServices();
        handleCloseForm();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Error al guardar el servicio");
      }
    } catch (error) {
      console.error("Error en la petición:", error);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      service_name: service.service_name,
      description: service.description || '',
      price: service.price,
      duration_minutes: service.duration_minutes,
      discount: service.discount,
      has_discount: service.has_discount,
      is_active: service.is_active,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (service: Service) => {
    const token = getToken();
    if (!token) return;

    const newActiveState = !service.is_active;
    
    // Enviar el objeto completo con el nuevo estado
    const updateData = {
      service_name: service.service_name,
      description: service.description,
      price: service.price,
      duration_minutes: service.duration_minutes,
      discount: service.discount,
      has_discount: service.has_discount,
      is_active: newActiveState
    };

    console.log("Enviando actualización de estado:", updateData);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/services/${service.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        // Actualizar el estado local inmediatamente para mejor UX
        setServices(prevServices => 
          prevServices.map(s => 
            s.id === service.id 
              ? { ...s, is_active: newActiveState }
              : s
          )
        );
      } else if (res.status === 401) {
        alert("Tu sesión ha expirado");
        localStorage.clear();
        window.location.href = "/";
      } else {
        const errorData = await res.json();
        console.error("Error response:", errorData);
        alert(errorData.detail || "Error al cambiar el estado del servicio");
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
    
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setServices(prevServices => prevServices.filter(s => s.id !== id));
      } else if (res.status === 401) {
        alert("Tu sesión ha expirado");
        localStorage.clear();
        window.location.href = "/";
      } else {
        alert("Error al eliminar el servicio");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingService(null);
    setFormData({
      service_name: '',
      description: '',
      price: 0,
      duration_minutes: 30,
      discount: 0,
      has_discount: false,
      is_active: true,
    });
  };

  const getFinalPrice = (service: Service) => {
    if (service.has_discount && service.discount > 0) {
      return service.price * (1 - service.discount / 100);
    }
    return service.price;
  };

  const activeServices = services.filter(s => s.is_active);
  const inactiveServices = services.filter(s => !s.is_active);
  const activeCount = activeServices.length;
  const inactiveCount = inactiveServices.length;
  const totalRevenue = activeServices.reduce((sum, s) => sum + s.price, 0);

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-500">Cargando servicios...</p>
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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Servicios</h1>
            <p className="text-gray-500 mt-1">Administra los servicios de lavado</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Servicio</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Servicios</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Servicios Activos</p>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Archive className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Servicios Inactivos</p>
                <p className="text-2xl font-bold text-gray-900">{inactiveCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Precio Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${activeCount > 0 ? (totalRevenue / activeCount).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle View Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowInactive(false)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
              !showInactive 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            Servicios Activos
          </button>
          <button
            onClick={() => setShowInactive(true)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
              showInactive 
                ? 'bg-gray-600 text-white shadow-md shadow-gray-200' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <EyeOff className="w-4 h-4" />
            Servicios Inactivos
          </button>
        </div>

        {/* Active Services Grid */}
        {!showInactive && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Servicios Activos ({activeCount})
            </h2>
            {activeServices.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay servicios activos</h3>
                <p className="text-gray-500 mb-6">Agrega tu primer servicio haciendo clic en el botón superior</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                {activeServices.map((service) => {
                  const finalPrice = getFinalPrice(service);
                  return (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      finalPrice={finalPrice}
                      onEdit={handleEdit}
                      onToggleActive={handleToggleActive}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Inactive Services Grid */}
        {showInactive && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Archive className="w-5 h-5 text-gray-500" />
              Servicios Inactivos ({inactiveCount})
            </h2>
            {inactiveServices.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay servicios inactivos</h3>
                <p className="text-gray-500 mb-6">Todos los servicios están activos</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {inactiveServices.map((service) => {
                  const finalPrice = getFinalPrice(service);
                  return (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      finalPrice={finalPrice}
                      onEdit={handleEdit}
                      onToggleActive={handleToggleActive}
                      onDelete={handleDelete}
                      isInactive={true}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
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
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h2>
                <button onClick={handleCloseForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Ej: Lavado Premium"
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
                    placeholder="Descripción del servicio"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración (minutos) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      min="1"
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

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Servicio Activo
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    {editingService ? 'Actualizar Servicio' : 'Crear Servicio'}
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

// Componente de tarjeta de servicio
function ServiceCard({ 
  service, 
  finalPrice, 
  onEdit, 
  onToggleActive, 
  onDelete,
  isInactive = false 
}: { 
  service: Service; 
  finalPrice: number; 
  onEdit: (service: Service) => void; 
  onToggleActive: (service: Service) => void; 
  onDelete: (id: number) => void;
  isInactive?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden transition-all hover:shadow-lg border ${isInactive ? 'border-gray-200 opacity-75' : 'border-gray-100'}`}>
      <div
        className="h-32 flex items-center justify-center relative"
        style={{
          background: isInactive 
            ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
            : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
        }}
      >
        <Sparkles className="w-12 h-12 text-white opacity-90" />
        {!service.is_active && (
          <div className="absolute top-3 right-3 bg-gray-700 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Inactivo
          </div>
        )}
        {service.has_discount && service.discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            -{service.discount}% OFF
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {service.service_name}
        </h3>

        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {service.description || 'Sin descripción'}
        </p>

        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{service.duration_minutes} min</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {service.has_discount && service.discount > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-600">
                  ${finalPrice.toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  ${service.price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                ${service.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(service)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>Editar</span>
          </button>
          <button
            onClick={() => onToggleActive(service)}
            className={`flex items-center justify-center p-2 rounded-xl transition-colors ${
              service.is_active 
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
            title={service.is_active ? 'Desactivar' : 'Activar'}
          >
            {service.is_active ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onDelete(service.id)}
            className="flex items-center justify-center p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}