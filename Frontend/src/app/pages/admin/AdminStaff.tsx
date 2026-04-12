import { useState } from 'react';
import { Plus, Edit2, Trash2, User, X, Calendar } from 'lucide-react';
import { getStaff, addStaff, updateStaff, deleteStaff, Staff } from '../../../utils/staff';

export function AdminStaff() {
  const [staff, setStaff] = useState<Staff[]>(getStaff());
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: 'operations' as Staff['department'],
    status: 'active' as Staff['status'],
    salary: 0,
    hireDate: new Date().toISOString().split('T')[0],
    schedule: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingStaff) {
      updateStaff(editingStaff.id, formData);
    } else {
      addStaff(formData);
    }

    setStaff(getStaff());
    handleCloseForm();
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phone: staffMember.phone,
      position: staffMember.position,
      department: staffMember.department,
      status: staffMember.status,
      salary: staffMember.salary,
      hireDate: staffMember.hireDate,
      schedule: staffMember.schedule,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
      deleteStaff(id);
      setStaff(getStaff());
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingStaff(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      department: 'operations',
      status: 'active',
      salary: 0,
      hireDate: new Date().toISOString().split('T')[0],
      schedule: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
    });
  };

  const departmentLabels = {
    operations: 'Operaciones',
    sales: 'Ventas',
    management: 'Gerencia',
    maintenance: 'Mantenimiento',
  };

  const statusLabels = {
    active: 'Activo',
    inactive: 'Inactivo',
    vacation: 'Vacaciones',
  };

  const statusColors = {
    active: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--color-success)' },
    inactive: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' },
    vacation: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
  };

  const daysOfWeek = [
    { key: 'monday' as const, label: 'Lun' },
    { key: 'tuesday' as const, label: 'Mar' },
    { key: 'wednesday' as const, label: 'Mié' },
    { key: 'thursday' as const, label: 'Jue' },
    { key: 'friday' as const, label: 'Vie' },
    { key: 'saturday' as const, label: 'Sáb' },
    { key: 'sunday' as const, label: 'Dom' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ color: 'var(--color-text)' }}>
            Gestión de Staff
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Administra empleados y horarios
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
          <span>Nuevo Empleado</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ color: 'var(--color-text)' }}>
                {editingStaff ? 'Editar Empleado' : 'Nuevo Empleado'}
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
              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                  Información Personal
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg transition-all"
                      style={{
                        border: '1px solid var(--color-border)',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg transition-all"
                      style={{
                        border: '1px solid var(--color-border)',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg transition-all"
                      style={{
                        border: '1px solid var(--color-border)',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg transition-all"
                      style={{
                        border: '1px solid var(--color-border)',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Employment Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                  Información de Empleo
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Posición
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg transition-all"
                      style={{
                        border: '1px solid var(--color-border)',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Departamento
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value as Staff['department'] })}
                      className="w-full px-4 py-3 rounded-lg transition-all"
                      style={{
                        border: '1px solid var(--color-border)',
                        outline: 'none'
                      }}
                      required
                    >
                      {Object.entries(departmentLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Estado
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Staff['status'] })}
                      className="w-full px-4 py-3 rounded-lg transition-all"
                      style={{
                        border: '1px solid var(--color-border)',
                        outline: 'none'
                      }}
                      required
                    >
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Salario Anual ($)
                    </label>
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 rounded-lg transition-all"
                      style={{
                        border: '1px solid var(--color-border)',
                        outline: 'none'
                      }}
                      min="0"
                      step="1000"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Fecha de Contratación
                    </label>
                    <input
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg transition-all"
                      style={{
                        border: '1px solid var(--color-border)',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                  Horario
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {daysOfWeek.map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all"
                      style={{
                        backgroundColor: formData.schedule[key]
                          ? 'rgba(37, 99, 235, 0.1)'
                          : 'var(--color-surface)',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.schedule[key]}
                        onChange={(e) => setFormData({
                          ...formData,
                          schedule: { ...formData.schedule, [key]: e.target.checked }
                        })}
                        className="w-4 h-4"
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
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
                  {editingStaff ? 'Actualizar' : 'Crear'} Empleado
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

      {/* Staff Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Empleado
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Posición
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Departamento
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Estado
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Horario
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {staff.map((member) => (
                <tr
                  key={member.id}
                  className="transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
                        }}
                      >
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                      {member.position}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className="inline-block text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        color: 'var(--color-primary)'
                      }}
                    >
                      {departmentLabels[member.department]}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className="inline-block text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: statusColors[member.status].bg,
                        color: statusColors[member.status].text
                      }}
                    >
                      {statusLabels[member.status]}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-1">
                      {daysOfWeek.map(({ key, label }) => (
                        <span
                          key={key}
                          className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium"
                          style={{
                            backgroundColor: member.schedule[key]
                              ? 'rgba(37, 99, 235, 0.1)'
                              : 'var(--color-surface)',
                            color: member.schedule[key]
                              ? 'var(--color-primary)'
                              : 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)'
                          }}
                        >
                          {label.charAt(0)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="p-2 rounded-lg transition-all"
                        style={{
                          color: 'var(--color-primary)',
                          backgroundColor: 'rgba(37, 99, 235, 0.1)'
                        }}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
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
