import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Car, Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  color: string;
  liscence_plate: string;
  vehicle_type: string;
  is_temporary: boolean;
  client_id?: number;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  type: string;
  address?: string;
}

export function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    color: '',
    liscence_plate: '',
    vehicle_type: 'sedan',
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchUserData();
  }, [navigate]);

  const fetchUserData = async () => {
    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch("http://localhost:8000/api/v1/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          navigate("/");
          return;
        }
        throw new Error("Error al cargar datos del usuario");
      }

      const data = await response.json();
      setUserData(data);
      await fetchVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicles = async () => {
    const token = localStorage.getItem("access_token");
    
    try {
      const response = await fetch("http://localhost:8000/api/v1/vehicles/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const token = localStorage.getItem("access_token");

    // Validar que tengamos el ID del usuario
    if (!userData?.id) {
      setError("No se encontró información del usuario");
      setIsSubmitting(false);
      return;
    }

    // Verificar que el usuario sea de tipo cliente
    if (userData.type !== 'client') {
      setError("Solo los clientes pueden registrar vehículos");
      setIsSubmitting(false);
      return;
    }

    try {
      // Preparar datos - Usar userData.id como client_id
      const vehicleData = {
        liscence_plate: formData.liscence_plate.toUpperCase().trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        color: formData.color.trim(),
        vehicle_type: formData.vehicle_type,
        is_temporary: false,
        client_id: userData.id, // ← Usar el ID del usuario directamente
      };

      console.log("Enviando datos:", vehicleData);
      console.log("UserData:", userData);

      let response;
      if (editingVehicle) {
        response = await fetch(`http://localhost:8000/api/v1/vehicles/${editingVehicle.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(vehicleData),
        });
      } else {
        response = await fetch("http://localhost:8000/api/v1/vehicles/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(vehicleData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.detail || JSON.stringify(errorData) || "Error al guardar el vehículo");
      }

      await fetchVehicles();
      handleCloseForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      liscence_plate: vehicle.liscence_plate,
      vehicle_type: vehicle.vehicle_type,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este vehículo?')) return;

    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(`http://localhost:8000/api/v1/vehicles/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al eliminar el vehículo");
      }

      await fetchVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
    setError("");
    setFormData({
      brand: '',
      model: '',
      color: '',
      liscence_plate: '',
      vehicle_type: 'sedan',
    });
  };

  const vehicleTypeLabels: Record<string, string> = {
    sedan: 'Sedán',
    suv: 'SUV',
    truck: 'Camioneta',
    motorcycle: 'Motocicleta',
    van: 'Van',
    other: 'Otro',
  };

  if (isLoading) {
    return (
      <>
        <div className="hidden lg:block sticky top-0 z-50">
          <TopNav />
        </div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Cargando vehículos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>

      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        {/* Header - Mobile */}
        <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-2">Mis Vehículos</h1>
            <p className="text-blue-100 text-sm">Gestiona tus vehículos registrados</p>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold mb-2">Mis Vehículos</h1>
                <p className="text-xl text-blue-100">Gestiona tus vehículos registrados</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Agregar Vehículo
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 lg:py-8">
          {/* Mobile Add Button */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar Vehículo
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {vehicles.length === 0 ? (
            <div className="text-center py-16">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No tienes vehículos registrados
              </h3>
              <p className="text-gray-500 mb-6">
                Agrega tu primer vehículo para facilitar tus reservas
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Agregar Vehículo
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 h-32 flex items-center justify-center">
                    <Car className="w-16 h-16 text-white" />
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {vehicle.brand} {vehicle.model}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tipo:</span>
                        <span className="font-medium text-gray-700">
                          {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Color:</span>
                        <span className="font-medium text-gray-700">{vehicle.color}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Placa:</span>
                        <span className="font-mono font-medium text-gray-700">
                          {vehicle.liscence_plate}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="flex items-center justify-center bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca *
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Toyota, Honda, etc."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo *
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Camry, Accord, etc."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color *
                    </label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Blanco, Negro, etc."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placa *
                    </label>
                    <input
                      type="text"
                      value={formData.liscence_plate}
                      onChange={(e) => setFormData({ ...formData, liscence_plate: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono uppercase"
                      placeholder="ABC-123"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Vehículo *
                  </label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    {Object.entries(vehicleTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      editingVehicle ? 'Actualizar Vehículo' : 'Agregar Vehículo'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>

      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}