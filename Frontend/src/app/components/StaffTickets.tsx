// StaffTickets.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Ticket,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Loader2,
  ChevronRight,
  Printer,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  CreditCard,
  ShoppingBag,
  Calendar,
  User,
  Package,
  DollarSign,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { TopNav } from "../components/TopNav";
import { BottomNav } from "../components/BottomNav";

interface OrderItem {
  id: number;
  ticket_id: number;
  product_id: number;
  client_id: number | null;
  casher_id: number | null;
  amount: number;
  subtotal: number;
  total: number;
  discount: number;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    product_name: string;
    description: string;
    unit_price: number;
    stock: number;
    discount: number;
    has_discount: boolean;
    is_active: boolean;
  };
  casher: {
    id: number;
    name: string;
    last_name?: string;
  } | null;
  client: {
    id: number;
    name: string;
    last_name: string;
  } | null;
}

interface Ticket {
  ticket_id: number;
  casher_name: string;
  client_name: string;
  created_at: string;
  grand_total: number;
  status: "paid" | "pending" | "cancelled" | "refunded";
  payment_method?: "cash" | "card" | "transfer";
  items: TicketItem[];
}

interface TicketItem {
  product_name: string;
  unit_price: number;
  amount: number;
  subtotal: number;
  discount: number;
  total: number;
}

type StatusFilter = "all" | "paid" | "pending" | "cancelled" | "refunded";

// Función para determinar estado basado en lógica
const determineTicketStatus = (ticket: any): Ticket["status"] => {
  const ticketDate = new Date(ticket.created_at);
  const now = new Date();
  const isToday = ticketDate.toDateString() === now.toDateString();

  if (ticket.casher_name === "Compra Online" && isToday) {
    return "pending";
  }
  if (ticket.casher_name !== "Compra Online") {
    return "paid";
  }
  return "paid";
};

export function StaffTickets() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [searchTerm, statusFilter, tickets]);

  const fetchOrders = async () => {
    const token = localStorage.getItem("access_token");
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/staff/orders/products",
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
      setOrders(data);

      // Agrupar por ticket_id
      const ticketsMap = new Map<number, Ticket>();

      data.forEach((order: OrderItem) => {
        if (!ticketsMap.has(order.ticket_id)) {
          let casherName = "Compra Online";
          if (order.casher) {
            casherName = `${order.casher.name} ${order.casher.last_name || ""}`.trim();
          }

          let clientName = "Público General";
          if (order.client) {
            clientName = `${order.client.name} ${order.client.last_name}`.trim();
          }

          ticketsMap.set(order.ticket_id, {
            ticket_id: order.ticket_id,
            casher_name: casherName,
            client_name: clientName,
            created_at: order.created_at,
            grand_total: 0,
            status: "paid",
            items: [],
          });
        }

        const ticket = ticketsMap.get(order.ticket_id)!;
        ticket.items.push({
          product_name: order.product.product_name,
          unit_price: order.product.unit_price,
          amount: order.amount,
          subtotal: order.subtotal,
          discount: order.discount || (order.product.has_discount ? order.product.discount : 0),
          total: order.total,
        });
        ticket.grand_total += order.total;
      });

      const ticketsList = Array.from(ticketsMap.values()).map((ticket) => ({
        ...ticket,
        status: determineTicketStatus(ticket),
      }));

      setTickets(ticketsList);
      setFilteredTickets(ticketsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.ticket_id.toString().includes(searchTerm) ||
          ticket.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.casher_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
  };

  const handleViewTicket = async (ticketId: number) => {
    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/staff/orders/tickets/${ticketId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const ticket = await response.json();
        setSelectedTicket(ticket);
        setShowTicketModal(true);
      } else {
        const localTicket = tickets.find((t) => t.ticket_id === ticketId);
        if (localTicket) {
          setSelectedTicket(localTicket);
          setShowTicketModal(true);
        }
      }
    } catch (err) {
      const localTicket = tickets.find((t) => t.ticket_id === ticketId);
      if (localTicket) {
        setSelectedTicket(localTicket);
        setShowTicketModal(true);
      } else {
        setError("Error al cargar el ticket");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  const handleCompleteTicket = async (ticketId: number) => {
    if (!confirm("¿Marcar este ticket como completado?")) return;

    const token = localStorage.getItem("access_token");
    setActionLoading(ticketId);

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/staff/orders/tickets/${ticketId}/complete`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(`Ticket #${result.ticket_id} marcado como completado\nTotal: $${result.total.toFixed(2)}`);
        await fetchOrders();
        if (showTicketModal) {
          setShowTicketModal(false);
          setSelectedTicket(null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al completar el ticket");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al marcar el ticket como completado");
      setTimeout(() => setError(""), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm("¿Estás seguro de eliminar este ticket? Esta acción no se puede deshacer y restaurará el inventario.")) return;

    const token = localStorage.getItem("access_token");
    setActionLoading(ticketId);

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/staff/orders/tickets/${ticketId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        await fetchOrders();
        if (showTicketModal) {
          setShowTicketModal(false);
          setSelectedTicket(null);
        }
        alert("Ticket eliminado correctamente");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al eliminar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el ticket");
      setTimeout(() => setError(""), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: Ticket["status"]) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "refunded":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Ticket className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: Ticket["status"]) => {
    switch (status) {
      case "paid":
        return "Pagado";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelado";
      case "refunded":
        return "Reembolsado";
      default:
        return "Desconocido";
    }
  };

  const getStatusColor = (status: Ticket["status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "refunded":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getHeaderGradient = (status: Ticket["status"]) => {
    switch (status) {
      case "paid":
        return "from-green-500 to-green-600";
      case "pending":
        return "from-yellow-500 to-yellow-600";
      case "cancelled":
        return "from-red-500 to-red-600";
      case "refunded":
        return "from-orange-500 to-orange-600";
      default:
        return "from-indigo-500 to-purple-500";
    }
  };

  const stats = {
    total: tickets.length,
    paid: tickets.filter((t) => t.status === "paid").length,
    pending: tickets.filter((t) => t.status === "pending").length,
    cancelled: tickets.filter((t) => t.status === "cancelled").length,
    refunded: tickets.filter((t) => t.status === "refunded").length,
    totalRevenue: tickets
      .filter((t) => t.status === "paid")
      .reduce((sum, t) => sum + t.grand_total, 0),
  };

  if (isLoading) {
    return (
      <>
        <TopNav />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-2">Gestión de Tickets</h1>
            <p className="text-xl text-indigo-100">
              Administra ventas de productos y servicios
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <ShoppingBag className="h-5 w-5 text-gray-400" />
                <span className="text-2xl font-bold text-gray-800">
                  {stats.total}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Tickets</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-700">
                  {stats.paid}
                </span>
              </div>
              <p className="text-sm text-green-600">Pagados</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-700">
                  {stats.pending}
                </span>
              </div>
              <p className="text-sm text-yellow-600">Pendientes</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold text-red-700">
                  {stats.cancelled}
                </span>
              </div>
              <p className="text-sm text-red-600">Cancelados</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 shadow-sm border border-indigo-100">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-indigo-500" />
                <span className="text-2xl font-bold text-indigo-700">
                  ${stats.totalRevenue.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-indigo-600">Ingresos Totales</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por ticket #, cliente o cajero..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Filter className="h-5 w-5" />
                Filtros
              </button>
              <button
                onClick={fetchOrders}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
                Actualizar
              </button>
            </div>

            {/* Filter Chips */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 pt-4 border-t"
              >
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === "all"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Todos ({stats.total})
                  </button>
                  <button
                    onClick={() => setStatusFilter("paid")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === "paid"
                        ? "bg-green-600 text-white"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    <CheckCircle className="inline h-4 w-4 mr-1" />
                    Pagados ({stats.paid})
                  </button>
                  <button
                    onClick={() => setStatusFilter("pending")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === "pending"
                        ? "bg-yellow-600 text-white"
                        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    }`}
                  >
                    <Clock className="inline h-4 w-4 mr-1" />
                    Pendientes ({stats.pending})
                  </button>
                  <button
                    onClick={() => setStatusFilter("cancelled")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === "cancelled"
                        ? "bg-red-600 text-white"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    <XCircle className="inline h-4 w-4 mr-1" />
                    Cancelados ({stats.cancelled})
                  </button>
                  <button
                    onClick={() => setStatusFilter("refunded")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === "refunded"
                        ? "bg-orange-600 text-white"
                        : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                    }`}
                  >
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    Reembolsados ({stats.refunded})
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
              {error}
            </div>
          )}

          {/* Tickets Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.ticket_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div
                  className={`bg-gradient-to-r ${getHeaderGradient(ticket.status)} p-4`}
                >
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-6 w-6" />
                      <span className="font-bold text-lg">
                        Ticket #{ticket.ticket_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {getStatusText(ticket.status)}
                      </span>
                      <button
                        onClick={() => handleViewTicket(ticket.ticket_id)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span className="text-sm truncate">
                        Cliente: {ticket.client_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="h-4 w-4" />
                      <span className="text-sm">
                        Productos: {ticket.items.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">
                        Cajero: {ticket.casher_name}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-500">Total:</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        ${ticket.grand_total.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewTicket(ticket.ticket_id)}
                        className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Ver Detalle
                      </button>
                      <button
                        onClick={() => handleCompleteTicket(ticket.ticket_id)}
                        disabled={actionLoading === ticket.ticket_id}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Marcar como completado"
                      >
                        {actionLoading === ticket.ticket_id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteTicket(ticket.ticket_id)}
                        disabled={actionLoading === ticket.ticket_id}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar ticket"
                      >
                        {actionLoading === ticket.ticket_id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                      <button className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <Printer className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredTickets.length === 0 && (
            <div className="text-center py-16">
              <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">
                No hay tickets
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "No se encontraron tickets con los filtros aplicados"
                  : "No se encontraron tickets de venta"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div
              className={`sticky top-0 bg-gradient-to-r ${getHeaderGradient(selectedTicket.status)} p-6 text-white`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Ticket className="h-8 w-8" />
                    <h2 className="text-2xl font-bold">
                      Ticket #{selectedTicket.ticket_id}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20`}
                    >
                      {getStatusText(selectedTicket.status)}
                    </span>
                  </div>
                  <p className="text-white/80 mt-1">
                    {formatDate(selectedTicket.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Cajero / Vendedor
                  </p>
                  <p className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    {selectedTicket.casher_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cliente</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    {selectedTicket.client_name}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Producto</th>
                      <th className="text-right p-3">Precio</th>
                      <th className="text-right p-3">Cantidad</th>
                      <th className="text-right p-3">Descuento</th>
                      <th className="text-right p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedTicket.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.product_name}</td>
                        <td className="text-right p-3">
                          ${item.unit_price.toFixed(2)}
                        </td>
                        <td className="text-right p-3">{item.amount}</td>
                        <td className="text-right p-3 text-green-600">
                          {item.discount > 0
                            ? `-$${item.discount.toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="text-right p-3 font-semibold">
                          ${item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={4} className="text-right p-3">
                        Total:{" "}
                      </td>
                      <td className="text-right p-3 text-indigo-600 text-xl">
                        ${selectedTicket.grand_total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    handleCompleteTicket(selectedTicket.ticket_id);
                    setShowTicketModal(false);
                  }}
                  disabled={actionLoading === selectedTicket.ticket_id}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === selectedTicket.ticket_id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  Marcar como Completado
                </button>
                <button
                  onClick={() => {
                    handleDeleteTicket(selectedTicket.ticket_id);
                    setShowTicketModal(false);
                  }}
                  disabled={actionLoading === selectedTicket.ticket_id}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === selectedTicket.ticket_id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                  Eliminar Ticket
                </button>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="flex-1 border border-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNav />
    </>
  );
}