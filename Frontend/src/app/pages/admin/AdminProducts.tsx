import { useState } from 'react';
import { Plus, Edit2, Trash2, Package, X, Star, TrendingUp } from 'lucide-react';
import { getProducts, addProduct, updateProduct, deleteProduct, Product } from '../../../utils/products';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock: 0,
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }

    setProducts(getProducts());
    handleCloseForm();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      isActive: product.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      deleteProduct(id);
      setProducts(getProducts());
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      stock: 0,
      isActive: true,
    });
  };

  const activeProducts = products.filter(p => p.isActive);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock < 20);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ color: 'var(--color-text)' }}>
            Gestión de Productos
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Administra el catálogo de productos
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
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-3">
            <Package className="w-10 h-10" style={{ color: 'var(--color-primary)' }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Productos Activos
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {activeProducts.length}
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

        <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-3">
            <Star className="w-10 h-10" style={{ color: '#f59e0b' }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Bajo Stock
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {lowStockProducts.length}
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
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
              <div>
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
                  placeholder="Ej: Shampoo Premium"
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
                  placeholder="Descripción del producto"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      border: '1px solid var(--color-border)',
                      outline: 'none'
                    }}
                    placeholder="Ej: Shampoo, Cera, etc."
                    required
                  />
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
                    Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      border: '1px solid var(--color-border)',
                      outline: 'none'
                    }}
                    min="0"
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
                      Producto Activo
                    </span>
                  </label>
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
                  {editingProduct ? 'Actualizar' : 'Crear'} Producto
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

      {/* Products Table */}
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
                  Precio
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Stock
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Rating
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Estado
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {products.map((product) => (
                <tr
                  key={product.id}
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
                          {product.name}
                        </p>
                        <p className="text-sm line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {product.description}
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
                      {product.category}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      ${product.price}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className="font-medium"
                      style={{
                        color: product.stock === 0
                          ? 'var(--color-error)'
                          : product.stock < 20
                          ? '#f59e0b'
                          : 'var(--color-success)'
                      }}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        ({product.reviewCount})
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className="inline-block text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: product.isActive
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                        color: product.isActive
                          ? 'var(--color-success)'
                          : 'var(--color-error)'
                      }}
                    >
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 rounded-lg transition-all"
                        style={{
                          color: 'var(--color-primary)',
                          backgroundColor: 'rgba(37, 99, 235, 0.1)'
                        }}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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
