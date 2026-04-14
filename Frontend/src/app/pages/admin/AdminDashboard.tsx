import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { TrendingUp, Users, Package, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { TopNav } from '../../components/TopNav';
import { BottomNav } from '../../components/BottomNav';

// Ajustado al modelo de producto del backend
interface Product {
  id: number;
  product_name: string;
  unit_price: number;
  stock: number;
  discount: number;
  has_discount: boolean;
  is_active: boolean;
}

interface InventoryMovement {
  id: number;
  product_id: number;
  product?: {
    product_name: string;
  };
  type: string;
  amount: number;
  note: string;
  created_at: string;
}

// ACTUALIZADO: Basado en tu nuevo esquema EmployeeRead "aplanado"
interface StaffMember {
  id: number;
  role: string;
  is_active: boolean;
  name: string;         // Ahora viene directo según el esquema Read
  last_name: string;    // Ahora viene directo
  email: string;       // Ahora viene directo
  photo_url?: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("access_token");
    setIsLoading(true);
    setError("");

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Ejecutamos las peticiones en paralelo para mejorar velocidad
      const [resProducts, resStaff, resMovements] = await Promise.all([
        fetch("http://localhost:8000/api/v1/products/", { headers }),
        fetch("http://localhost:8000/api/v1/staff/", { headers }),
        fetch("http://localhost:8000/api/v1/staff/inventory/movements", { headers })
      ]);

      if (!resProducts.ok) throw new Error("Error en productos");
      
      const productsData = await resProducts.json();
      setProducts(productsData);

      if (resStaff.ok) {
        const staffData = await resStaff.json();
        setStaff(staffData);
      }

      if (resMovements.ok) {
        const movementsData = await resMovements.json();
        setMovements(movementsData.slice(0, 5));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de métricas
  const lowStockItems = products.filter(p => p.stock < 10 && p.is_active);
  // Filtramos: que esté activo Y que su rol NO sea 'admin'
  const activeStaff = staff.filter(member => 
    member.is_active === true && member.role.toLowerCase() !== 'admin'
  );
  const activeStaffCount = activeStaff.length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.unit_price * p.stock), 0);

  const stats = [
    {
      icon: Users,
      label: 'Staff Activo',
      value: `${activeStaffCount}/${staff.length}`,
      colorBg: 'rgba(37, 99, 235, 0.1)',
      colorText: '#2563eb',
      path: '/admin/staff',
    },
    {
      icon: Package,
      label: 'Items en Inventario',
      value: products.length,
      colorBg: 'rgba(16, 185, 129, 0.1)',
      colorText: '#10b981',
      path: '/admin/inventory',
    },
    {
      icon: AlertCircle,
      label: 'Bajo Stock',
      value: lowStockItems.length,
      colorBg: 'rgba(245, 158, 11, 0.1)',
      colorText: '#f59e0b',
      path: '/admin/inventory',
    },
    {
      icon: TrendingUp,
      label: 'Valor Inventario',
      value: `$${totalInventoryValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      colorBg: 'rgba(14, 165, 233, 0.1)',
      colorText: '#0ea5e9',
      path: '/admin/reports',
    },
  ];

  const quickLinks = [
    {
      icon: Users,
      label: 'Gestión de Staff',
      description: 'Administra empleados y roles',
      color: '#2563eb',
      path: '/admin/staff',
    },
    {
      icon: Package,
      label: 'Control de Inventario',
      description: 'Monitorea stock y productos',
      color: '#10b981',
      path: '/admin/inventory',
    },
    {
      icon: TrendingUp,
      label: 'Análisis y Reportes',
      description: 'Visualiza métricas de negocio',
      color: '#0ea5e9',
      path: '/admin/reports',
    },
    {
      icon: DollarSign,
      label: 'Movimientos',
      description: 'Historial de inventario',
      color: '#8b5cf6',
      path: '/admin/movements',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 lg:py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-600 mt-2">Resumen general del negocio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(stat.path)}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.colorBg }}>
                    <Icon className="w-7 h-7" style={{ color: stat.colorText }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Alertas de Stock */}
        {lowStockItems.length > 0 && (
          <motion.div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border-l-4 border-yellow-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">Alertas de Inventario</h2>
            </div>
            <div className="grid gap-3">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                  <span>{item.product_name}</span>
                  <span className="font-bold text-yellow-700">{item.stock} en stock</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Links */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.label}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(link.path)}
                className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer border border-transparent hover:border-gray-200"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${link.color}15` }}>
                  <Icon className="w-6 h-6" style={{ color: link.color }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{link.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{link.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}