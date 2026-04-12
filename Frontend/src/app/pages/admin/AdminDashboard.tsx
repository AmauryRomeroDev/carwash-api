import { TrendingUp, Users, Package, DollarSign, AlertCircle } from 'lucide-react';
import { getStaff, getActiveStaff } from '../../../utils/staff';
import { getInventory, getLowStockItems } from '../../../utils/inventory';

export function AdminDashboard() {
  const staff = getStaff();
  const activeStaff = getActiveStaff();
  const inventory = getInventory();
  const lowStockItems = getLowStockItems();

  const stats = [
    {
      icon: Users,
      label: 'Staff Activo',
      value: `${activeStaff.length}/${staff.length}`,
      colorBg: 'rgba(37, 99, 235, 0.1)',
      colorText: 'var(--color-primary)',
    },
    {
      icon: Package,
      label: 'Items en Inventario',
      value: inventory.length,
      colorBg: 'rgba(16, 185, 129, 0.1)',
      colorText: 'var(--color-success)',
    },
    {
      icon: AlertCircle,
      label: 'Bajo Stock',
      value: lowStockItems.length,
      colorBg: 'rgba(245, 158, 11, 0.1)',
      colorText: '#f59e0b',
    },
    {
      icon: TrendingUp,
      label: 'Valor Inventario',
      value: `$${inventory.reduce((sum, item) => sum + (item.cost * item.quantity), 0).toFixed(2)}`,
      colorBg: 'rgba(14, 165, 233, 0.1)',
      colorText: 'var(--color-secondary)',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ color: 'var(--color-text)' }}>
          Panel de Control
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Resumen general del negocio
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 transition-all hover:scale-105"
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: stat.colorBg }}
                >
                  <Icon className="w-7 h-7" style={{ color: stat.colorText }} />
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl p-6 mb-8" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6" style={{ color: '#f59e0b' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              Alertas de Inventario
            </h2>
          </div>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <div>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                    {item.name}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Cantidad actual: {item.quantity} {item.unit} (Mínimo: {item.minQuantity})
                  </p>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: item.status === 'out_of_stock'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(245, 158, 11, 0.1)',
                    color: item.status === 'out_of_stock'
                      ? 'var(--color-error)'
                      : '#f59e0b'
                  }}
                >
                  {item.status === 'out_of_stock' ? 'Agotado' : 'Bajo Stock'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          className="bg-white rounded-xl p-6 hover:scale-105 transition-all cursor-pointer"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <Users className="w-10 h-10 mb-4" style={{ color: 'var(--color-primary)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Gestión de Staff
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Administra empleados y horarios
          </p>
        </div>

        <div
          className="bg-white rounded-xl p-6 hover:scale-105 transition-all cursor-pointer"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <Package className="w-10 h-10 mb-4" style={{ color: 'var(--color-success)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Control de Inventario
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Monitorea stock y proveedores
          </p>
        </div>

        <div
          className="bg-white rounded-xl p-6 hover:scale-105 transition-all cursor-pointer"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <TrendingUp className="w-10 h-10 mb-4" style={{ color: 'var(--color-secondary)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Análisis y Reportes
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Visualiza métricas de negocio
          </p>
        </div>
      </div>
    </div>
  );
}
