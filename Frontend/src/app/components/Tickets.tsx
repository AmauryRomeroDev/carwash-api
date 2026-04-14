import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Ticket, Calendar, Clock, Car, DollarSign, Eye, X, Loader2, Search, Filter, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

interface ServiceTicket {
  id: number;
  ticket_id: number;
  service_name: string;
  date: string;
  total: number;
  status: string;
  notes: string;
}

interface ProductTicket {
  id: number;
  ticket_id: number;
  product_name: string;
  amount: number;
  date: string;
  total: number;
}

interface PurchaseHistory {
  services: ServiceTicket[];
  products: ProductTicket[];
}

interface GroupedTicket {
  ticket_id: number;
  date: string;
  items: Array<{
    type: 'service' | 'product';
    name: string;
    amount?: number;
    total: number;
    notes?: string;
    status?: string;
  }>;
  total: number;
  status: string;
}

export function Tickets() {
  const navigate = useNavigate();
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory | null>(null);
  const [groupedTickets, setGroupedTickets] = useState<GroupedTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<GroupedTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<GroupedTicket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "cancelled">("all");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchTickets();
  }, [navigate]);

  const fetchTickets = async () => {
    const token = localStorage.getItem("access_token");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/v1/users/my-purchase-history", {
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
        throw new Error("Error al cargar los tickets");
      }

      const data: PurchaseHistory = await response.json();
      setPurchaseHistory(data);
      
      const ticketsMap = new Map<number, GroupedTicket>();
      
      for (const service of data.services) {
        if (!ticketsMap.has(service.ticket_id)) {
          ticketsMap.set(service.ticket_id, {
            ticket_id: service.ticket_id,
            date: service.date,
            items: [],
            total: 0,
            status: service.status,
          });
        }
        const ticket = ticketsMap.get(service.ticket_id)!;
        ticket.items.push({
          type: 'service',
          name: service.service_name,
          total: service.total,
          notes: service.notes,
          status: service.status,
        });
        ticket.total += service.total;
      }
      
      for (const product of data.products) {
        if (!ticketsMap.has(product.ticket_id)) {
          ticketsMap.set(product.ticket_id, {
            ticket_id: product.ticket_id,
            date: product.date,
            items: [],
            total: 0,
            status: 'completado',
          });
        }
        const ticket = ticketsMap.get(product.ticket_id)!;
        ticket.items.push({
          type: 'product',
          name: product.product_name,
          amount: product.amount,
          total: product.total,
        });
        ticket.total += product.total;
      }
      
      const tickets = Array.from(ticketsMap.values()).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setGroupedTickets(tickets);
      setFilteredTickets(tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, filterStatus);
  };

  const handleStatusFilter = (status: "all" | "completed" | "pending" | "cancelled") => {
    setFilterStatus(status);
    applyFilters(searchTerm, status);
  };

  const applyFilters = (term: string, status: string) => {
    let filtered = [...groupedTickets];
    
    if (term.trim()) {
      filtered = filtered.filter(ticket =>
        ticket.ticket_id.toString().includes(term) ||
        ticket.items.some(item => item.name.toLowerCase().includes(term.toLowerCase()))
      );
    }
    
    if (status !== "all") {
      filtered = filtered.filter(ticket => {
        if (status === "cancelled") {
          return ticket.items.some(item => item.notes?.toLowerCase().includes("cancelado"));
        }
        return ticket.status.toLowerCase() === status;
      });
    }
    
    setFilteredTickets(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (ticket: GroupedTicket) => {
    const isCancelled = ticket.items.some(item => item.notes?.toLowerCase().includes("cancelado"));
    if (isCancelled) {
      return { text: "Cancelado", color: "bg-red-100 text-red-700" };
    }
    if (ticket.status === "Completado") {
      return { text: "Completado", color: "bg-green-100 text-green-700" };
    }
    return { text: "En Proceso", color: "bg-yellow-100 text-yellow-700" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="hidden lg:block sticky top-0 z-50">
          <TopNav />
        </div>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Cargando tickets...</p>
          </div>
        </div>
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="hidden lg:block sticky top-0 z-50">
          <TopNav />
        </div>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchTickets}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        </div>
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>

      {/* Header - Mobile */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-2">Mis Tickets</h1>
          <p className="text-blue-100">Historial de tus compras y servicios</p>
        </div>
      </div>

      {/* Header - Desktop */}
      <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-4">Mis Tickets</h1>
          <p className="text-xl text-blue-100">Historial de tus compras y servicios</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 lg:py-8">
        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número de ticket o servicio..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleStatusFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filterStatus === "all" 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => handleStatusFilter("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filterStatus === "pending" 
                  ? "bg-yellow-600 text-white" 
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => handleStatusFilter("completed")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filterStatus === "completed" 
                  ? "bg-green-600 text-white" 
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Completados
            </button>
            <button
              onClick={() => handleStatusFilter("cancelled")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filterStatus === "cancelled" 
                  ? "bg-red-600 text-white" 
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Cancelados
            </button>
          </div>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-12 text-center"
          >
            <Ticket className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-2">No hay tickets</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? "No se encontraron tickets con esa búsqueda" : "Aún no has realizado ninguna compra o servicio"}
            </p>
            <button
              onClick={() => navigate('/services')}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Ver Servicios
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const statusBadge = getStatusBadge(ticket);
              return (
                <motion.div
                  key={ticket.ticket_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div className="flex items-center gap-3 mb-2 sm:mb-0">
                        <div className="bg-blue-100 p-2 rounded-xl">
                          <Ticket className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Ticket #{ticket.ticket_id}</h3>
                          <p className="text-sm text-gray-500">{formatDate(ticket.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                          {statusBadge.text}
                        </span>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(ticket.total)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Items ({ticket.items.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {ticket.items.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-sm ${
                              item.type === 'service' 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'bg-green-50 text-green-700'
                            }`}
                          >
                            {item.type === 'service' ? '🔧' : '📦'} {item.name}
                            {item.amount && ` x${item.amount}`}
                          </span>
                        ))}
                        {ticket.items.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                            +{ticket.items.length - 3} más
                          </span>
                        )}
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
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
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
                <div>
                  <h3 className="text-xl font-bold">Ticket #{selectedTicket.ticket_id}</h3>
                  <p className="text-sm text-gray-500">{formatDate(selectedTicket.date)}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Items del Ticket</h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Tipo</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Descripción</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Cant.</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedTicket.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.type === 'service' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {item.type === 'service' ? 'Servicio' : 'Producto'}
                              </span>
                             </td>
                            <td className="px-4 py-3 font-medium">{item.name}</td>
                            <td className="px-4 py-3 text-right">{item.amount || 1}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right font-bold">Total:</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-600">
                            {formatCurrency(selectedTicket.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {selectedTicket.items.some(item => item.notes) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Notas</h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      {selectedTicket.items.map((item, idx) => item.notes && (
                        <p key={idx} className="text-sm text-gray-600">
                          <span className="font-medium">{item.name}:</span> {item.notes}
                        </p>
                      ))}
                    </div>
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

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}