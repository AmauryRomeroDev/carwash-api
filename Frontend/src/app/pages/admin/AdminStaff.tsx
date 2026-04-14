import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, X, Mail, Phone, Calendar, Briefcase, CheckCircle, XCircle, Loader2, Eye, EyeOff, Archive, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TopNav } from '../../components/TopNav';
import { BottomNav } from '../../components/BottomNav';

interface Employee {
  id: number;
  user_id: number;
  name: string;
  last_name: string;
  second_last_name: string;
  email: string;
  phone: string;
  role: string;
  day_labor: number[];  // Array de números (múltiples días)
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Días laborales disponibles
const DIAS_LABORALES = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" }
];

export function AdminStaff() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    second_last_name: '',
    email: '',
    phone: '',
    role: 'employee',
    day_labor: [] as number[],  // Array de números
    password: '',
  });

  const getToken = () => localStorage.getItem("access_token");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const token = getToken();
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/staff/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      } else if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error cargando empleados:", error);
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

    const url = editingEmployee 
      ? `http://localhost:8000/api/v1/staff/${editingEmployee.id}` 
      : "http://localhost:8000/api/v1/staff/";
    
    const method = editingEmployee ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          last_name: formData.last_name,
          second_last_name: formData.second_last_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          day_labor: formData.day_labor,
          password: formData.password || undefined
        })
      });

      if (res.status === 401) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      if (res.ok) {
        await fetchEmployees();
        handleCloseForm();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Error al guardar el empleado");
      }
    } catch (error) {
      console.error("Error en la petición:", error);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      last_name: employee.last_name,
      second_last_name: employee.second_last_name || '',
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      day_labor: employee.day_labor || [],
      password: '',
    });
    setShowForm(true);
  };

  const handleToggleActive = async (employee: Employee) => {
    const token = getToken();
    if (!token) return;

    const newActiveState = !employee.is_active;
    
    const updateData = {
      name: employee.name,
      last_name: employee.last_name,
      second_last_name: employee.second_last_name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      day_labor: employee.day_labor,
      is_active: newActiveState
    };

    try {
      const res = await fetch(`http://localhost:8000/api/v1/staff/${employee.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        setEmployees(prevEmployees => 
          prevEmployees.map(e => 
            e.id === employee.id 
              ? { ...e, is_active: newActiveState }
              : e
          )
        );
      } else if (res.status === 401) {
        alert("Tu sesión ha expirado");
        localStorage.clear();
        window.location.href = "/";
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Error al cambiar el estado del empleado");
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este empleado?')) return;
    
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/staff/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setEmployees(prevEmployees => prevEmployees.filter(e => e.id !== id));
      } else if (res.status === 401) {
        alert("Tu sesión ha expirado");
        localStorage.clear();
        window.location.href = "/";
      } else {
        alert("Error al eliminar el empleado");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setFormData({
      name: '',
      last_name: '',
      second_last_name: '',
      email: '',
      phone: '',
      role: 'employee',
      day_labor: [],
      password: '',
    });
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      employee: 'Empleado',
      washer: 'Lavador',
      cashier: 'Cajero'
    };
    return roles[role] || role;
  };

  const getDayLaborLabels = (days: number[]) => {
    if (!days || days.length === 0) return 'No asignado';
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days.map(d => dayNames[d]).join(', ');
  };

  const activeEmployees = employees.filter(e => e.is_active);
  const inactiveEmployees = employees.filter(e => !e.is_active);
  const activeCount = activeEmployees.length;
  const inactiveCount = inactiveEmployees.length;

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-500">Cargando empleados...</p>
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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Personal</h1>
            <p className="text-gray-500 mt-1">Administra los empleados del negocio</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Empleado</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Empleados Activos</p>
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
                <p className="text-sm text-gray-500 font-medium">Empleados Inactivos</p>
                <p className="text-2xl font-bold text-gray-900">{inactiveCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Roles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(employees.map(e => e.role)).size}
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
            Empleados Activos
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
            Empleados Inactivos
          </button>
        </div>

        {/* Active Employees Grid */}
        {!showInactive && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Empleados Activos ({activeCount})
            </h2>
            {activeEmployees.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay empleados activos</h3>
                <p className="text-gray-500 mb-6">Agrega tu primer empleado haciendo clic en el botón superior</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                {activeEmployees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                    getRoleLabel={getRoleLabel}
                    getDayLaborLabels={getDayLaborLabels}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Inactive Employees Grid */}
        {showInactive && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Archive className="w-5 h-5 text-gray-500" />
              Empleados Inactivos ({inactiveCount})
            </h2>
            {inactiveEmployees.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay empleados inactivos</h3>
                <p className="text-gray-500 mb-6">Todos los empleados están activos</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {inactiveEmployees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                    getRoleLabel={getRoleLabel}
                    getDayLaborLabels={getDayLaborLabels}
                    isInactive={true}
                  />
                ))}
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
                  {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                </h2>
                <button onClick={handleCloseForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido Paterno *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido Materno
                    </label>
                    <input
                      type="text"
                      value={formData.second_last_name}
                      onChange={(e) => setFormData({ ...formData, second_last_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rol *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      required
                    >
                      <option value="admin">Administrador</option>
                      <option value="employee">Empleado</option>
                      <option value="washer">Lavador</option>
                      <option value="cashier">Cajero</option>
                    </select>
                  </div>
                </div>

                {/* Días Laborales - Checkboxes múltiples */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días Laborales *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIAS_LABORALES.map((dia) => (
                      <label key={dia.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.day_labor.includes(dia.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ 
                                ...formData, 
                                day_labor: [...formData.day_labor, dia.value] 
                              });
                            } else {
                              setFormData({ 
                                ...formData, 
                                day_labor: formData.day_labor.filter(v => v !== dia.value)
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{dia.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona los días en que labora el empleado
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña {!editingEmployee && '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required={!editingEmployee}
                    placeholder={editingEmployee ? 'Dejar vacío para no cambiar' : '********'}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    {editingEmployee ? 'Actualizar Empleado' : 'Crear Empleado'}
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

// Componente de tarjeta de empleado
function EmployeeCard({ 
  employee, 
  onEdit, 
  onToggleActive, 
  onDelete,
  getRoleLabel,
  getDayLaborLabels,
  isInactive = false 
}: { 
  employee: Employee; 
  onEdit: (employee: Employee) => void; 
  onToggleActive: (employee: Employee) => void; 
  onDelete: (id: number) => void;
  getRoleLabel: (role: string) => string;
  getDayLaborLabels: (days: number[]) => string;
  isInactive?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden transition-all hover:shadow-lg border ${isInactive ? 'border-gray-200 opacity-75' : 'border-gray-100'}`}>
      <div
        className="h-28 flex items-center justify-center relative"
        style={{
          background: isInactive 
            ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
            : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
        }}
      >
        <Users className="w-12 h-12 text-white opacity-90" />
        {!employee.is_active && (
          <div className="absolute top-3 right-3 bg-gray-700 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Inactivo
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {employee.name} {employee.last_name}
        </h3>
        <p className="text-sm text-gray-500 mb-3">{employee.email}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              Rol:
            </span>
            <span className="font-medium text-gray-700">{getRoleLabel(employee.role)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Días Laborales:
            </span>
            <span className="font-medium text-gray-700 text-right">
              {getDayLaborLabels(employee.day_labor)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <Phone className="w-4 h-4" />
              Teléfono:
            </span>
            <span className="font-medium text-gray-700">{employee.phone}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(employee)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>Editar</span>
          </button>
          <button
            onClick={() => onToggleActive(employee)}
            className={`flex items-center justify-center p-2 rounded-xl transition-colors ${
              employee.is_active 
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
            title={employee.is_active ? 'Desactivar' : 'Activar'}
          >
            {employee.is_active ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onDelete(employee.id)}
            className="flex items-center justify-center p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}