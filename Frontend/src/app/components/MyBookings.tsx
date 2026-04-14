import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Calendar, Clock, Car, MapPin, CheckCircle, XCircle, AlertCircle, Eye, X, Package, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

interface ServiceDetail {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
}

interface VehicleDetail {
  id: number;
  brand: string;
  model: string;
  license_plate: string;
  color?: string;
  vehicle_type?: string;
}

interface AssignedWasher {
  id: number;
  name: string;
  email?: string;
}

interface Booking {
  id: number;
  ticket_id: number;
  service: ServiceDetail;
  vehicle: VehicleDetail;
  status: string;
  status_code: string;
  subtotal: number;
  delivery_time: string | null;
  start_time: string | null;
  completion_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_washer: AssignedWasher | null;
  is_active: boolean;
}

interface GroupedTicket {
  ticket_id: number;
  vehicle: VehicleDetail;
  status_code: string;
  is_active: boolean;
  delivery_time: string | null;
  start_time: string | null;
  completion_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_washer: AssignedWasher | null;
  services: ServiceDetail[];
  subtotal: number;
}

export function MyBookings() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [groupedBookings, setGroupedBookings] = useState<GroupedTicket[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<GroupedTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<GroupedTicket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState<GroupedTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchBookings();
  }, [navigate]);

  useEffect(() => {
    filterBookings();
  }, [filter, groupedBookings]);

  // Agrupar reservas por ticket_id
  const groupBookingsByTicket = (bookingsList: Booking[]): GroupedTicket[] => {
    const grouped = new Map<number, GroupedTicket>();
    
    for (const booking of bookingsList) {
      if (grouped.has(booking.ticket_id)) {
        const existing = grouped.get(booking.ticket_id)!;
        existing.services.push(booking.service);
        existing.subtotal += booking.subtotal;
      } else {
        grouped.set(booking.ticket_id, {
          ticket_id: booking.ticket_id,
          vehicle: booking.vehicle,
          status_code: booking.status_code,
          is_active: booking.is_active,
          delivery_time: booking.delivery_time,
          start_time: booking.start_time,
          completion_time: booking.completion_time,
          notes: booking.notes,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
          assigned_washer: booking.assigned_washer,
          services: [booking.service],
          subtotal: booking.subtotal,
        });
      }
    }
    
    return Array.from(grouped.values());
  };

  const fetchBookings = async () => {
    const token = localStorage.getItem("access_token");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/v1/users/my-bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          navigate("/");
          return;
        }
        throw new Error("Error al cargar las reservas");
      }

      const data = await response.json();
      setBookings(data);
      const grouped = groupBookingsByTicket(data);
      setGroupedBookings(grouped);
      calculateStats(grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (groupedList: GroupedTicket[]) => {
    const now = new Date();
    const upcoming = groupedList.filter(t => 
      t.is_active !== false && 
      t.status_code === 'scheduled' && 
      t.delivery_time && 
      new Date(t.delivery_time) > now
    ).length;
    const completed = groupedList.filter(t => t.status_code === 'completed' && t.is_active !== false).length;
    const cancelled = groupedList.filter(t => t.status_code === 'cancelled' || t.is_active === false).length;
    const totalSpent = groupedList
      .filter(t => t.status_code === 'completed' && t.is_active !== false)
      .reduce((sum, t) => sum + t.subtotal, 0);

    setStats({
      total: groupedList.filter(t => t.is_active !== false).length,
      upcoming,
      completed,
      cancelled,
      totalSpent,
    });
  };

  const filterBookings = () => {
    const now = new Date();
    let filtered = [...groupedBookings];

    switch (filter) {
      case 'upcoming':
        filtered = groupedBookings.filter(t => 
          t.is_active !== false &&
          t.status_code === 'scheduled' && 
          t.delivery_time && 
          new Date(t.delivery_time) > now
        );
        break;
      case 'past':
        filtered = groupedBookings.filter(t => 
          t.is_active !== false &&
          (t.status_code === 'completed' || 
           (t.status_code === 'scheduled' && t.delivery_time && new Date(t.delivery_time) <= now))
        );
        break;
      case 'cancelled':
        filtered = groupedBookings.filter(t => 
          t.status_code === 'cancelled' || t.is_active === false
        );
        break;
      default:
        filtered = groupedBookings.filter(t => t.is_active !== false);
    }

    // Ordenar por fecha más reciente primero
    filtered.sort((a, b) => {
      const dateA = a.delivery_time ? new Date(a.delivery_time) : new Date(a.created_at);
      const dateB = b.delivery_time ? new Date(b.delivery_time) : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    setFilteredBookings(filtered);
  };

  const handleCancelBooking = async () => {
    if (!ticketToCancel) return;

    const token = localStorage.getItem("access_token");
    setIsCancelling(true);

    try {
      // Buscar todas las órdenes con este ticket_id
      const ordersToCancel = bookings.filter(b => b.ticket_id === ticketToCancel.ticket_id);
      
      for (const order of ordersToCancel) {
        const response = await fetch(`http://localhost:8000/api/v1/staff/services/${order.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Error al cancelar la reserva");
        }
      }

      // Actualizar el estado local
      const updatedBookings = bookings.map(booking => 
        booking.ticket_id === ticketToCancel.ticket_id 
          ? { 
              ...booking, 
              status_code: 'cancelled',
              is_active: false,
              notes: booking.notes ? `${booking.notes} - Cancelado por el cliente` : 'Cancelado por el cliente'
            }
          : booking
      );
      
      setBookings(updatedBookings);
      const updatedGrouped = groupBookingsByTicket(updatedBookings);
      setGroupedBookings(updatedGrouped);
      calculateStats(updatedGrouped);
      
      setShowCancelModal(false);
      setTicketToCancel(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (statusCode: string, isActive: boolean = true) => {
    if (!isActive || statusCode === 'cancelled') {
      return 'bg-red-100 text-red-700';
    }
    switch (statusCode) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (statusCode: string, isActive: boolean = true) => {
    if (!isActive || statusCode === 'cancelled') {
      return 'Cancelada';
    }
    switch (statusCode) {
      case 'scheduled':
        return 'Agendada';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completada';
      default:
        return statusCode;
    }
  };

  const getStatusIcon = (statusCode: string, isActive: boolean = true) => {
    if (!isActive || statusCode === 'cancelled') {
      return XCircle;
    }
    switch (statusCode) {
      case 'scheduled':
        return Calendar;
      case 'in_progress':
        return Clock;
      case 'completed':
        return CheckCircle;
      default:
        return AlertCircle;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No especificada";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "No especificada";
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canCancelTicket = (ticket: GroupedTicket) => {
    if (!ticket.is_active || ticket.status_code === 'cancelled') {
      return false;
    }
    if (ticket.status_code === 'completed') {
      return false;
    }
    if (ticket.status_code === 'in_progress') {
      return false;
    }
    if (ticket.delivery_time) {
      const bookingDate = new Date(ticket.delivery_time);
      const now = new Date();
      return bookingDate > now;
    }
    return true;
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
            <p className="mt-4 text-gray-600">Cargando reservas...</p>
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
        <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-24 rounded-b-3xl">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-2">Mis Reservas</h1>
            <p className="text-blue-100">Gestiona tus citas agendadas</p>
          </div>
        </div>

        {/* Header - Desktop */}
        <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-4">Mis Reservas</h1>
            <p className="text-xl text-blue-100">Gestiona tus citas agendadas</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Stats Cards - Mobile */}
          <div className="lg:hidden -mt-16 mb-6 grid grid-cols-4 gap-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-3 text-center shadow-lg"
            >
              <p className="text-xl font-bold text-blue-600 mb-1">{stats.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-xl p-3 text-center shadow-lg"
            >
              <p className="text-xl font-bold text-green-600 mb-1">{stats.upcoming}</p>
              <p className="text-xs text-gray-600">Próximas</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-3 text-center shadow-lg"
            >
              <p className="text-xl font-bold text-purple-600 mb-1">{stats.completed}</p>
              <p className="text-xs text-gray-600">Completadas</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-xl p-3 text-center shadow-lg"
            >
              <p className="text-xl font-bold text-red-600 mb-1">{stats.cancelled}</p>
              <p className="text-xs text-gray-600">Canceladas</p>
            </motion.div>
          </div>

          {/* Stats Cards - Desktop */}
          <div className="hidden lg:grid grid-cols-5 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Reservas</p>
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-xl p-6 shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Próximas</p>
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Completadas</p>
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-xl p-6 shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Canceladas</p>
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.cancelled}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Gastado</p>
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">${stats.totalSpent.toFixed(2)}</p>
            </motion.div>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-4 mb-6"
          >
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filter === 'upcoming'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Próximas
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filter === 'past'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pasadas
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filter === 'cancelled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Canceladas
              </button>
            </div>
          </motion.div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-12 text-center"
            >
              <Calendar className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-2">No hay reservas</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'upcoming'
                  ? 'No tienes reservas próximas'
                  : filter === 'past'
                  ? 'No tienes reservas pasadas'
                  : filter === 'cancelled'
                  ? 'No tienes reservas canceladas'
                  : 'Aún no has realizado ninguna reserva'}
              </p>
              <button
                onClick={() => navigate('/services')}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Reservar Servicio
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((ticket, index) => {
                const StatusIcon = getStatusIcon(ticket.status_code, ticket.is_active);
                const displayDate = ticket.delivery_time || ticket.created_at;
                const isCancelled = !ticket.is_active || ticket.status_code === 'cancelled';
                return (
                  <motion.div
                    key={ticket.ticket_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
                      isCancelled ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg">Ticket #{ticket.ticket_id}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(ticket.status_code, ticket.is_active)}`}>
                              <StatusIcon className="h-3 w-3" />
                              {getStatusLabel(ticket.status_code, ticket.is_active)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Creada el {formatDate(ticket.created_at)}
                          </p>
                        </div>
                        {!isCancelled && (
                          <p className="text-2xl font-bold text-blue-600">${ticket.subtotal.toFixed(2)}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Fecha y Hora</p>
                            <p className="font-medium text-gray-900">{formatDate(displayDate)}</p>
                            <p className="text-sm text-gray-600">{formatTime(displayDate)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Car className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Vehículo</p>
                            <p className="font-medium text-gray-900">{ticket.vehicle.brand} {ticket.vehicle.model}</p>
                            <p className="text-sm text-gray-600">{ticket.vehicle.license_plate}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Servicios ({ticket.services.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {ticket.services.map((service, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              {service.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowDetailModal(true);
                          }}
                          className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalles
                        </button>
                        {canCancelTicket(ticket) && (
                          <button
                            onClick={() => {
                              setTicketToCancel(ticket);
                              setShowCancelModal(true);
                            }}
                            className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold">Detalles de la Reserva</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Número de Ticket</p>
                    <p className="font-bold text-lg">#{selectedTicket.ticket_id}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status_code, selectedTicket.is_active)}`}>
                    {getStatusLabel(selectedTicket.status_code, selectedTicket.is_active)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Fecha del Servicio</p>
                    <p className="font-medium">{formatDate(selectedTicket.delivery_time || selectedTicket.created_at)}</p>
                    <p className="text-sm text-gray-600">{formatTime(selectedTicket.delivery_time || selectedTicket.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Vehículo</p>
                    <p className="font-medium">{selectedTicket.vehicle.brand} {selectedTicket.vehicle.model}</p>
                    <p className="text-sm text-gray-600">{selectedTicket.vehicle.license_plate}</p>
                    {selectedTicket.vehicle.color && (
                      <p className="text-sm text-gray-600">Color: {selectedTicket.vehicle.color}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-3">Servicios</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Servicio</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Precio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedTicket.services.map((service, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-medium">{service.name}</td>
                            <td className="px-4 py-3 text-right font-medium">${service.price.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td className="px-4 py-3">Total</td>
                          <td className="px-4 py-3 text-right text-blue-600">${selectedTicket.subtotal.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedTicket.assigned_washer && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Lavador Asignado</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium">{selectedTicket.assigned_washer.name}</p>
                      {selectedTicket.assigned_washer.email && (
                        <p className="text-sm text-gray-600">{selectedTicket.assigned_washer.email}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedTicket.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Notas</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedTicket.notes}</p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && ticketToCancel && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm  flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">¿Cancelar Reserva?</h3>
                <p className="text-gray-600 mb-6">
                  ¿Estás seguro de que deseas cancelar esta reserva? Se cancelarán todos los servicios de este ticket.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    No, mantener
                  </button>
                  <button
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      'Sí, cancelar'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}