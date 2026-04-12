import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Car, Plus, Edit2, Trash2, Star, X } from 'lucide-react';
import { motion } from 'motion/react';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';
import { getUserVehicles, addVehicle, updateVehicle, deleteVehicle, Vehicle } from '../../utils/vehicles';

export function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [userId, setUserId] = useState('');
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
    type: 'sedan' as Vehicle['type'],
    isDefault: false,
  });

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    const userEmail = localStorage.getItem('userEmail');

    if (!isAuth || !userEmail) {
      navigate('/');
      return;
    }

    setUserId(userEmail);
    loadVehicles(userEmail);
  }, [navigate]);

  const loadVehicles = (userEmail: string) => {
    const userVehicles = getUserVehicles(userEmail);
    setVehicles(userVehicles);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingVehicle) {
      updateVehicle(editingVehicle.id, formData);
    } else {
      addVehicle({ ...formData, userId });
    }

    loadVehicles(userId);
    handleCloseForm();
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      type: vehicle.type,
      isDefault: vehicle.isDefault,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este vehículo?')) {
      deleteVehicle(id);
      loadVehicles(userId);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
    setFormData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      licensePlate: '',
      type: 'sedan',
      isDefault: false,
    });
  };

  const vehicleTypeLabels = {
    sedan: 'Sedán',
    suv: 'SUV',
    truck: 'Camioneta',
    motorcycle: 'Motocicleta',
    van: 'Van',
    other: 'Otro',
  };

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <div className="hidden lg:block">
        <TopNav />
      </div>

      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        {/* Header - Mobile */}
        <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8">
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

          {/* Vehicles Grid */}
          {vehicles.length === 0 ? (
            <div className="text-center py-16">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No tienes vehículos registrados
              </h3>
              <p className="text-gray-500 mb-6">
                Agrega tu primer vehículo para facilitar tus reservas
              </p>
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
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 h-32 flex items-center justify-center relative">
                    <Car className="w-16 h-16 text-white" />
                    {vehicle.isDefault && (
                      <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                        <Star className="w-3 h-3 fill-current" />
                        Predeterminado
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">{vehicle.year}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tipo:</span>
                        <span className="font-medium text-gray-700">
                          {vehicleTypeLabels[vehicle.type]}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Color:</span>
                        <span className="font-medium text-gray-700">{vehicle.color}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Placa:</span>
                        <span className="font-mono font-medium text-gray-700">
                          {vehicle.licensePlate}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Toyota, Honda, etc."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Camry, Accord, etc."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Año
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Blanco, Negro, etc."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placa
                    </label>
                    <input
                      type="text"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                      placeholder="ABC-123"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Vehículo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Vehicle['type'] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {Object.entries(vehicleTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                    Establecer como vehículo predeterminado
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {editingVehicle ? 'Actualizar' : 'Agregar'} Vehículo
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

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}
