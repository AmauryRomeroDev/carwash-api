import { useState } from 'react';
import { Plus, Edit2, Trash2, Sparkles, X, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { getServices, addService, updateService, deleteService, Service } from '../../../utils/services';

export function AdminServices() {
  const [services, setServices] = useState<Service[]>(getServices());
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    category: 'basic' as Service['category'],
    features: [''],
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty features
    const cleanedFeatures = formData.features.filter(f => f.trim() !== '');

    if (editingService) {
      updateService(editingService.id, { ...formData, features: cleanedFeatures });
    } else {
      addService({ ...formData, features: cleanedFeatures });
    }

    setServices(getServices());
    handleCloseForm();
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      features: [...service.features],
      isActive: service.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      deleteService(id);
      setServices(getServices());
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration: 30,
      category: 'basic',
      features: [''],
      isActive: true,
    });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const categoryLabels = {
    basic: 'Básico',
    premium: 'Premium',
    detail: 'Detallado',
    protection: 'Protección',
    special: 'Especial',
  };

  const activeCount = services.filter(s => s.isActive).length;
  const totalRevenue = services.reduce((sum, s) => sum + (s.isActive ? s.price : 0), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ color: 'var(--color-text)' }}>
            Gestión de Servicios
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Administra los servicios de lavado
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg transition-all hover:scale-105"
          style={{
            backgroundColor: 'var(--color-primary)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-3">
            <Sparkles className="w-10 h-10" style={{ color: 'var(--color-primary)' }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Total Servicios
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {services.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-10 h-10" style={{ color: 'var(--color-success)' }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Servicios Activos
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {activeCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-3">
            <DollarSign className="w-10 h-10" style={{ color: 'var(--color-secondary)' }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Precio Promedio
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                ${activeCount > 0 ? (totalRevenue / activeCount).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ color: 'var(--color-text)' }}>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                  Información Básica
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Nombre del Servicio
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg transition-all"
                      style={{
                        border: '1px solid var(--color-border)',
                        outline: 'none'
                      }}
                      placeholder="Ej: Lavado Premium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg resize-none transition-all"
                      style={{
                        border: '1px solid var(--color-border)',
                        outline: 'none'
                      }}
                      rows={3}
                      placeholder="Descripción del servicio"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                        Categoría
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as Service['category'] })}
                        className="w-full px-4 py-3 rounded-lg transition-all"
                        style={{
                          border: '1px solid var(--color-border)',
                          outline: 'none'
                        }}
                        required
                      >
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                        Precio ($)
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        className="w-full px-4 py-3 rounded-lg transition-all"
                        style={{
                          border: '1px solid var(--color-border)',
                          outline: 'none'
                        }}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                        Duración (minutos)
                      </label>
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-lg transition-all"
                        style={{
                          border: '1px solid var(--color-border)',
                          outline: 'none'
                        }}
                        min="1"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-5 h-5"
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          Servicio Activo
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    Características
                  </h3>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                    style={{
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--color-primary)'
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-lg transition-all"
                        style={{
                          border: '1px solid var(--color-border)',
                          outline: 'none'
                        }}
                        placeholder={`Característica ${index + 1}`}
                      />
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-3 rounded-lg transition-all"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--color-error)'
                          }}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 text-white py-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {editingService ? 'Actualizar' : 'Crear'} Servicio
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-6 py-3 rounded-lg transition-colors"
                  style={{
                    border: '1px solid var(--color-border)'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-xl overflow-hidden transition-all hover:scale-105"
            style={{ boxShadow: 'var(--shadow-md)' }}
          >
            <div
              className="h-32 flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
              }}
            >
              <Sparkles className="w-12 h-12 text-white" />
              {!service.isActive && (
                <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Inactivo
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="mb-3">
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                  {service.name}
                </h3>
                <span
                  className="inline-block text-xs px-3 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    color: 'var(--color-primary)'
                  }}
                >
                  {categoryLabels[service.category]}
                </span>
              </div>

              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {service.description}
              </p>

              <div className="flex items-center gap-4 mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{service.duration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                    ${service.price}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Incluye:
                </p>
                <ul className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {service.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {service.features.length > 3 && (
                    <li className="text-xs" style={{ color: 'var(--color-primary)' }}>
                      +{service.features.length - 3} más
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    color: 'var(--color-primary)'
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="flex items-center justify-center p-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--color-error)'
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
