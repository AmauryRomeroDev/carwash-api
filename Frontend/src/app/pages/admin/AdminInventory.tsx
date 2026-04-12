import { useState } from 'react';
import { Plus, Edit2, Trash2, Package, RefreshCw, AlertCircle, X, TrendingUp } from 'lucide-react';
import {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockItem,
  InventoryItem
} from '../../../utils/inventory';

export function AdminInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>(getInventory());
  const [showForm, setShowForm] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [restockingItem, setRestockingItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    category: 'cleaning' as InventoryItem['category'],
    quantity: 0,
    minQuantity: 0,
    unit: 'unit' as InventoryItem['unit'],
    supplier: '',
    cost: 0,
    lastRestocked: new Date().toISOString(),
    location: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingItem) {
      updateInventoryItem(editingItem.id, formData);
    } else {
      addInventoryItem(formData);
    }

    setInventory(getInventory());
    handleCloseForm();
  };

  const handleRestock = () => {
    if (restockingItem && restockQuantity > 0) {
      restockItem(restockingItem.id, restockQuantity);
      setInventory(getInventory());
      setShowRestockModal(false);
      setRestockingItem(null);
      setRestockQuantity(0);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unit: item.unit,
      supplier: item.supplier,
      cost: item.cost,
      lastRestocked: item.lastRestocked,
      location: item.location,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este item?')) {
      deleteInventoryItem(id);
      setInventory(getInventory());
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'cleaning',
      quantity: 0,
      minQuantity: 0,
      unit: 'unit',
      supplier: '',
      cost: 0,
      lastRestocked: new Date().toISOString(),
      location: '',
    });
  };

  const categoryLabels = {
    cleaning: 'Limpieza',
    wax: 'Ceras',
    tools: 'Herramientas',
    chemicals: 'Químicos',
    accessories: 'Accesorios',
  };

  const statusColors = {
    in_stock: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--color-success)' },
    low_stock: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
    out_of_stock: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--color-error)' },
  };

  const statusLabels = {
    in_stock: 'En Stock',
    low_stock: 'Bajo Stock',
    out_of_stock: 'Agotado',
  };

  const totalValue = inventory.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const lowStockCount = inventory.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock').length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ color: 'var(--color-text)' }}>
            Gestión de Inventario
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Monitorea stock y proveedores
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
          <span>Nuevo Item</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-3">
            <Package className="w-10 h-10" style={{ color: 'var(--color-primary)' }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Total Items
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {inventory.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-10 h-10" style={{ color: '#f59e0b' }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Alertas de Stock
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {lowStockCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10" style={{ color: 'var(--color-success)' }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Valor Total
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                ${totalValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ color: 'var(--color-text)' }}>
                {editingItem ? 'Editar Item' : 'Nuevo Item'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Nombre del Producto
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
                    placeholder="Ej: Champú Premium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as InventoryItem['category'] })}
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
                    Unidad
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as InventoryItem['unit'] })}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      border: '1px solid var(--color-border)',
                      outline: 'none'
                    }}
                    required
                  >
                    <option value="unit">Unidad</option>
                    <option value="liter">Litro</option>
                    <option value="kg">Kilogramo</option>
                    <option value="gallon">Galón</option>
                    <option value="bottle">Botella</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      border: '1px solid var(--color-border)',
                      outline: 'none'
                    }}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Cantidad Mínima
                  </label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      border: '1px solid var(--color-border)',
                      outline: 'none'
                    }}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Costo Unitario ($)
                  </label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
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
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      border: '1px solid var(--color-border)',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      border: '1px solid var(--color-border)',
                      outline: 'none'
                    }}
                    placeholder="Ej: Almacén A - Estante 3"
                    required
                  />
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
                  {editingItem ? 'Actualizar' : 'Crear'} Item
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

      {/* Restock Modal */}
      {showRestockModal && restockingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ color: 'var(--color-text)' }}>
                Reabastecer Item
              </h2>
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setRestockingItem(null);
                  setRestockQuantity(0);
                }}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                {restockingItem.name}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Stock actual: {restockingItem.quantity} {restockingItem.unit}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Cantidad a Agregar
              </label>
              <input
                type="number"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-lg transition-all"
                style={{
                  border: '1px solid var(--color-border)',
                  outline: 'none'
                }}
                min="1"
                autoFocus
              />
              {restockQuantity > 0 && (
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Nuevo stock: {restockingItem.quantity + restockQuantity} {restockingItem.unit}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestock}
                disabled={restockQuantity <= 0}
                className="flex-1 text-white py-3 rounded-lg transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setRestockingItem(null);
                  setRestockQuantity(0);
                }}
                className="px-6 py-3 rounded-lg transition-colors"
                style={{
                  border: '1px solid var(--color-border)'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Producto
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Categoría
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Stock
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Estado
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Ubicación
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {inventory.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
                        }}
                      >
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                          {item.name}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {item.supplier}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className="inline-block text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        color: 'var(--color-primary)'
                      }}
                    >
                      {categoryLabels[item.category]}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                        {item.quantity} {item.unit}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Mín: {item.minQuantity}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className="inline-block text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: statusColors[item.status].bg,
                        color: statusColors[item.status].text
                      }}
                    >
                      {statusLabels[item.status]}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                      {item.location}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setRestockingItem(item);
                          setShowRestockModal(true);
                        }}
                        className="p-2 rounded-lg transition-all"
                        style={{
                          color: 'var(--color-success)',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)'
                        }}
                        title="Reabastecer"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 rounded-lg transition-all"
                        style={{
                          color: 'var(--color-primary)',
                          backgroundColor: 'rgba(37, 99, 235, 0.1)'
                        }}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg transition-all"
                        style={{
                          color: 'var(--color-error)',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)'
                        }}
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
  );
}
