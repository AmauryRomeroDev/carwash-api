// StaffServices.tsx (Corregido)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Calendar, Clock, Car, User, Wrench, CheckCircle,
  XCircle, Eye, Edit, Trash2, Search, RefreshCw,
  Loader2, Filter, AlertCircle, Users
} from "lucide-react";
import { motion } from "motion/react";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";

interface ServiceOrder {
  id: number;
  ticket_id: number;
  client_id: number;
  vehicle_id: number;
  service_id: number;
  washer_id: number | null;
  casher_id: number | null;
  delivery_time: string | null;
  start_time: string | null;
  completion_time: string | null;
  subtotal: number | string;
  notes: string;
  is_active: boolean;
  created_at: string;
  service?: {
    id: number;
    service_name: string;
    price: number;
    has_discount?: boolean;
    discount?: number;
  };
  vehicle?: {
    id: number;
    liscence_plate: string;
    brand: string;
    model: string;
    color: string;
    vehicle_type?: string;
  };
  client?: {
    id: number;
    address?: string;
    user?: {
      id: number;
      name: string;
      last_name: string;
      email?: string;
      phone?: string;
    };
  };
  washer?: {
    id: number;
    user?: {
      id: number;
      name: string;
      last_name: string;
    };
  };
  casher?: {
    id: number;
    user?: {
      id: number;
      name: string;
      last_name: string;
    };
  };
}

export function StaffServices() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [showActiveOnly]);

  const fetchOrders = async () => {
    const token = localStorage.getItem("access_token");
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/staff/services`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          navigate("/");
          return;
        }
        throw new Error("Error al cargar órdenes");
      }

      const data = await response.json();
      console.log("Datos recibidos:", data); // Debug: ver qué llega del backend
      
      setOrders(data);
      setFilteredOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = orders.filter(order =>
      order.ticket_id?.toString().includes(term) ||
      order.service?.service_name?.toLowerCase().includes(term.toLowerCase()) ||
      order.vehicle?.liscence_plate?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredOrders(filtered);
  };

  const handleViewDetails = async (orderId: number) => {
    const token = localStorage.getItem("access_token");
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/staff/services/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const order = await response.json();
        setSelectedOrder(order);
        setShowDetailModal(true);
      }
    } catch (err) {
      setError("Error al cargar detalles");
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("¿Estás seguro de cancelar esta orden?")) return;
    
    const token = localStorage.getItem("access_token");
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/staff/services/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchOrders();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar la orden");
    }
  };

  const handleMarkComplete = async (orderId: number) => {
    const token = localStorage.getItem("access_token");
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/services/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completion_time: new Date().toISOString()
        }),
      });

      if (response.ok) {
        await fetchOrders();
      }
    } catch (err) {
      setError("Error al marcar como completado");
    }
  };

  const getStatusBadge = (order: ServiceOrder) => {
    if (!order.is_active) {
      return { text: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle };
    }
    if (order.completion_time) {
      return { text: "Completado", color: "bg-green-100 text-green-700", icon: CheckCircle };
    }
    if (order.start_time) {
      return { text: "En Proceso", color: "bg-yellow-100 text-yellow-700", icon: Wrench };
    }
    return { text: "Pendiente", color: "bg-blue-100 text-blue-700", icon: Clock };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No programado";
    try {
      return new Date(dateString).toLocaleString('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const getClientName = (order: ServiceOrder) => {
    if (order.client?.user?.email) {
      return `${order.client.user.email}`;
    }
    return "Cliente no registrado";
  };

  const getSubtotal = (order: ServiceOrder) => {
    const subtotal = order.subtotal;
    if (typeof subtotal === 'number') return subtotal;
    if (typeof subtotal === 'string') return parseFloat(subtotal) || 0;
    return 0;
  };

  if (isLoading) {
    return (
      <>
        <TopNav />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <TopNav />
      
      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-2">Gestión de Servicios</h1>
            <p className="text-xl text-purple-100">Administra reservas y órdenes de servicio</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por ticket #, servicio o placa..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowActiveOnly(true)}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                    showActiveOnly
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setShowActiveOnly(false)}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                    !showActiveOnly
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Cancelados
                </button>
                <button
                  onClick={fetchOrders}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Orders Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => {
              const status = getStatusBadge(order);
              const StatusIcon = status.icon;
              const subtotal = getSubtotal(order);
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Ticket #{order.ticket_id}</p>
                        <h3 className="font-bold text-lg mt-1">
                          {order.service?.service_name || "Servicio"}
                        </h3>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.text}
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    {order.vehicle && (
                      <div className="bg-gray-50 rounded-xl p-3 mb-4">
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <Car className="h-4 w-4 text-gray-500" />
                          <span className="font-mono font-bold">{order.vehicle.liscence_plate}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.vehicle.brand} {order.vehicle.model} - {order.vehicle.color}
                        </p>
                      </div>
                    )}

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{getClientName(order)}</span>
                      </div>
                      {order.delivery_time && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Entrega: {formatDate(order.delivery_time)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Creado: {formatDate(order.created_at)}</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Total:</span>
                        <span className="text-xl font-bold text-purple-600">
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(order.id)}
                        className="flex-1 bg-purple-50 text-purple-600 py-2 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </button>
                      {order.is_active && !order.completion_time && (
                        <button
                          onClick={() => handleMarkComplete(order.id)}
                          className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Completar
                        </button>
                      )}
                      {order.is_active && !order.completion_time && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No hay órdenes</h3>
              <p className="text-gray-500">
                {showActiveOnly ? "No hay órdenes activas" : "No hay órdenes canceladas"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Detalle de Orden</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Ticket #</p>
                  <p className="font-semibold">{selectedOrder.ticket_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <p className="font-semibold">
                    {selectedOrder.completion_time ? "Completado" : 
                     selectedOrder.is_active ? "Activo" : "Cancelado"}
                  </p>
                </div>
              </div>

              {/* Service Info */}
              <div>
                <h3 className="font-semibold mb-2">Servicio</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="font-medium">{selectedOrder.service?.service_name || "Servicio"}</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    ${getSubtotal(selectedOrder).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Vehicle Info */}
              {selectedOrder.vehicle && (
                <div>
                  <h3 className="font-semibold mb-2">Vehículo</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-mono font-bold">{selectedOrder.vehicle.liscence_plate}</p>
                    <p className="text-gray-600">
                      {selectedOrder.vehicle.brand} {selectedOrder.vehicle.model}
                    </p>
                    <p className="text-gray-600">Color: {selectedOrder.vehicle.color}</p>
                  </div>
                </div>
              )}

              {/* Times */}
              <div>
                <h3 className="font-semibold mb-2">Horarios</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creado:</span>
                    <span>{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  {selectedOrder.delivery_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Entrega programada:</span>
                      <span>{formatDate(selectedOrder.delivery_time)}</span>
                    </div>
                  )}
                  {selectedOrder.completion_time && (
                    <div className="flex justify-between text-green-600">
                      <span>Completado:</span>
                      <span>{formatDate(selectedOrder.completion_time)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notas</h3>
                  <div className="bg-yellow-50 rounded-xl p-4 text-gray-700">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <BottomNav />
    </>
  );
}