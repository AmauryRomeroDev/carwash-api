import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Car, Plus, Edit2, Trash2, X, Loader2, Clock } from 'lucide-react';
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
    vehicle_type: 'sedan'
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
  
  if (!token) {
    console.error("No token found");
    navigate("/");
    return;
  }

  try {
    const response = await fetch("http://localhost:8000/api/v1/users/me", {
      method: "GET", // Especificar método explícitamente
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" // Añadir content-type
      },
    });

    if (!response.ok) {
      console.error("Response status:", response.status);
      console.error("Response status text:", response.statusText);
      
      if (response.status === 401) {
        localStorage.clear();
        navigate("/");
        return;
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("User data received:", data); // DEBUG
    setUserData(data);
    await fetchVehicles();
  } catch (err) {
    console.error("Fetch error:", err);
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

    try {
      const vehicleData = {
        liscence_plate: formData.liscence_plate.toUpperCase().trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        color: formData.color.trim(),
        vehicle_type: formData.vehicle_type,
        is_temporary: false,
        client_id: userData?.id 
      };
      console.log("Enviando datos del vehículo:", vehicleData);
      const url = editingVehicle 
        ? `http://localhost:8000/api/v1/vehicles/${editingVehicle.id}`
        : "http://localhost:8000/api/v1/vehicles/";

      const response = await fetch(url, {
        method: editingVehicle ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.[0]?.msg || errorData.detail || "Error al guardar");
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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al eliminar");
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
      brand: '', model: '', color: '', 
      liscence_plate: '', vehicle_type: 'sedan'
    });
  };

  const vehicleTypeLabels: Record<string, string> = {
    sedan: 'Sedán', suv: 'SUV', truck: 'Camioneta',
    motorcycle: 'Motocicleta', van: 'Van', other: 'Otro',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:block sticky top-0 z-50"><TopNav /></div>

      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-12 lg:rounded-b-none rounded-b-3xl">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Mis Vehículos</h1>
              <p className="text-blue-100">Gestiona tus vehículos para tus reservas</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="hidden lg:flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-5 h-5" /> Agregar Vehículo
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => setShowForm(true)}
            className="lg:hidden w-full mb-6 flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-semibold"
          >
            <Plus className="w-5 h-5" /> Agregar Vehículo
          </button>

          {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <motion.div
                key={vehicle.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className={`h-24 flex items-center justify-center ${vehicle.is_temporary ? 'bg-amber-500' : 'bg-blue-600'}`}>
                  <Car className="w-12 h-12 text-white" />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{vehicle.brand} {vehicle.model}</h3>
                      <p className="text-sm text-gray-500">{vehicleTypeLabels[vehicle.vehicle_type]}</p>
                    </div>
                    {vehicle.is_temporary && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">
                        <Clock className="w-3 h-3" /> Temporal
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                      <p className="text-gray-400 text-[10px] uppercase font-bold">Placa</p>
                      <p className="font-mono font-bold text-gray-700">{vehicle.liscence_plate}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                      <p className="text-gray-400 text-[10px] uppercase font-bold">Color</p>
                      <p className="font-bold text-gray-700">{vehicle.color}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(vehicle)} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                      <Edit2 className="w-4 h-4" /> Editar
                    </button>
                    <button onClick={() => handleDelete(vehicle.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{editingVehicle ? 'Editar' : 'Nuevo'} Vehículo</h2>
                <button onClick={handleCloseForm} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Marca</label>
                    <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Modelo</label>
                    <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Color</label>
                    <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Placa</label>
                    <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none" value={formData.liscence_plate} onChange={e => setFormData({...formData, liscence_plate: e.target.value.toUpperCase()})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo de Vehículo</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.vehicle_type} onChange={e => setFormData({...formData, vehicle_type: e.target.value})}>
                    {Object.entries(vehicleTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : editingVehicle ? 'Actualizar' : 'Registrar'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
      <div className="lg:hidden"><BottomNav /></div>
    </>
  );
}