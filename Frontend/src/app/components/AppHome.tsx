import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Sparkles, Clock, MapPin, Star, Calendar, Bell, Search, User, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface UserData {
  id: number;
  name: string;
  email: string;
  type: string;
  address?: string;
}

interface Service {
  id: number;
  service_name: string;
  price: number;
  duration_minutes: number;
}

interface Comment {
  id: number;
  content: string;
  rating: number;
  created_at: string;
  author: {
    id: number;
    name: string;
  };
  service: {
    id: number;
    service_name: string;
  } | null;
  replies: Comment[];
}

interface Booking {
  id: number;
  ticket_id: number;
  service: {
    id: number;
    name: string;
    price: number;
  };
  vehicle: {
    brand: string;
    model: string;
    license_plate: string;
  };
  status_code: string;
  subtotal: number;
  delivery_time: string | null;
  created_at: string;
  notes: string | null;
}

export function AppHome() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
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
    
    try {
      // 1. Obtener datos del usuario
      const userResponse = await fetch("http://localhost:8000/api/v1/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          localStorage.clear();
          navigate("/");
          return;
        }
        throw new Error("Error al cargar datos del usuario");
      }

      const userDataResponse = await userResponse.json();
      setUserData(userDataResponse);

      // 2. Obtener servicios disponibles
      const servicesResponse = await fetch("http://localhost:8000/api/v1/services/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let servicesData: Service[] = [];
      if (servicesResponse.ok) {
        servicesData = await servicesResponse.json();
        setServices(servicesData.slice(0, 4));
      }

      // 3. Obtener comentarios recientes
      const commentsResponse = await fetch("http://localhost:8000/api/v1/comments/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        const sortedComments = commentsData
          .sort((a: Comment, b: Comment) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          .slice(0, 3);
        setRecentComments(sortedComments);
      }

      // 4. Obtener reservas del usuario (incluyendo canceladas)
      const bookingsResponse = await fetch("http://localhost:8000/api/v1/users/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (bookingsResponse.ok) {
        const bookingsData: Booking[] = await bookingsResponse.json();
        
        // Filtrar solo servicios completados o en progreso (excluir cancelados)
        // O mostrar todos pero con indicador visual
        const activeBookings = bookingsData.filter(
          booking => booking.status_code === 'completed' || booking.status_code === 'in_progress'
        );
        
        // Ordenar por fecha más reciente y tomar los últimos 2
        const sortedBookings = activeBookings
          .sort((a, b) => {
            const dateA = a.delivery_time ? new Date(a.delivery_time) : new Date(a.created_at);
            const dateB = b.delivery_time ? new Date(b.delivery_time) : new Date(b.created_at);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 2);
        
        setRecentBookings(sortedBookings);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickServices = () => {
    const defaultServices: Array<{ icon: typeof Sparkles; name: string; color: string; id: number | null }> = [
      { icon: Sparkles, name: "Lavado\nBásico", color: "bg-blue-500", id: null },
      { icon: Clock, name: "Lavado\nRápido", color: "bg-green-500", id: null },
      { icon: Star, name: "Premium", color: "bg-yellow-500", id: null },
      { icon: Calendar, name: "Agendar", color: "bg-purple-500", id: null },
    ];

    if (services.length > 0) {
      const mappedServices: Array<{ icon: typeof Sparkles; name: string; color: string; id: number | null }> = services.slice(0, 3).map((service) => {
        let icon = Sparkles;
        let color = "bg-blue-500";
        
        if (service.service_name.toLowerCase().includes("rápido") || 
            service.service_name.toLowerCase().includes("rapido")) {
          icon = Clock;
          color = "bg-green-500";
        } else if (service.service_name.toLowerCase().includes("premium")) {
          icon = Star;
          color = "bg-yellow-500";
        }
        
        return {
          icon,
          name: service.service_name.replace(/\s/g, '\n'),
          color,
          id: service.id,
        };
      });
      
      // Agregar el botón "Agendar" al final si tenemos menos de 4 items
      if (mappedServices.length < 4) {
        mappedServices.push(defaultServices[3]);
      }
      
      return mappedServices;
    }
    
    return defaultServices;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Fecha no disponible";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (statusCode: string) => {
    switch (statusCode) {
      case 'completed':
        return { text: 'Completado', color: 'bg-green-100 text-green-700' };
      case 'in_progress':
        return { text: 'En Progreso', color: 'bg-yellow-100 text-yellow-700' };
      case 'scheduled':
        return { text: 'Agendado', color: 'bg-blue-100 text-blue-700' };
      case 'cancelled':
        return { text: 'Cancelado', color: 'bg-red-100 text-red-700' };
      default:
        return { text: statusCode, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const promotions = [
    {
      title: "30% OFF",
      subtitle: "En tu primer servicio",
      image: "https://images.unsplash.com/photo-1761312834150-4beefff097a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
    {
      title: "Lavado Gratis",
      subtitle: "Cada 5 servicios",
      image: "https://images.unsplash.com/photo-1763291894075-33c686e1a72c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
  ];

  if (isLoading) {
    return (
      <>
        <div className="hidden lg:block sticky top-0 z-50">
          <TopNav />
        </div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="hidden lg:block sticky top-0 z-50">
          <TopNav />
        </div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        </div>
      </>
    );
  }

  const firstName = userData?.name?.split(" ")[0] || "Usuario";
  const quickServicesList = getQuickServices();

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>

      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        {/* Header - Mobile Version */}
        <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-blue-100 text-sm">Hola,</p>
                <h1 className="text-2xl font-bold">{firstName} 👋</h1>
              </div>
              <button className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <Bell className="h-6 w-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar servicios..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-900 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Hero Section - Desktop Only */}
        <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-4">
                ¡Bienvenido, {firstName}! 👋
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Tu auto merece el mejor cuidado. Agenda tu próximo servicio hoy.
              </p>
              {/* Search Bar - Desktop */}
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar servicios..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-900 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:mt-8 -mt-6">
          {/* Desktop Grid Layout */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Services */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Servicios Rápidos</h2>
                <div className="grid grid-cols-4 gap-4">
                  {quickServicesList.map((service, index) => (
                    <motion.button
                      key={index}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (service.id) {
                          navigate(`/booking/${service.id}`);
                        } else {
                          navigate("/services");
                        }
                      }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className={`${service.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                        <service.icon className="h-7 w-7" />
                      </div>
                      <span className="text-xs text-center text-gray-600 whitespace-pre-line leading-tight">
                        {service.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Promotions Carousel */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Promociones</h2>
                <div className="grid lg:grid-cols-2 gap-4">
                  {promotions.map((promo, index) => (
                    <motion.div
                      key={index}
                      whileTap={{ scale: 0.98 }}
                      className="relative h-48 rounded-2xl overflow-hidden shadow-lg cursor-pointer"
                      onClick={() => navigate("/promotions")}
                    >
                      <ImageWithFallback
                        src={promo.image}
                        alt={promo.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 flex flex-col justify-center px-6">
                        <h3 className="text-3xl font-bold text-white mb-1">{promo.title}</h3>
                        <p className="text-white text-sm">{promo.subtitle}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent Comments/Testimonials */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Comentarios Recientes</h2>
                  <button 
                    onClick={() => navigate("/reviews")}
                    className="text-blue-600 text-sm font-medium"
                  >
                    Ver todos
                  </button>
                </div>
                <div className="space-y-3">
                  {recentComments.length > 0 ? (
                    recentComments.map((comment) => (
                      <motion.div 
                        key={comment.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-2xl p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{comment.author.name}</h3>
                              <span className="text-xs text-gray-400">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            {comment.service && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                {comment.service.service_name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(comment.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-3">{comment.content}</p>
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-blue-600">
                              <MessageCircle className="h-3 w-3" />
                              <span>{comment.replies.length} respuesta(s)</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                      <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No hay comentarios aún</p>
                      <button 
                        onClick={() => navigate("/services")}
                        className="mt-3 text-blue-600 text-sm font-medium"
                      >
                        Sé el primero en comentar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-6 mt-6 lg:mt-0">
              {/* User Info Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-xl">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{userData?.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{userData?.email}</p>
                    <p className="text-xs text-blue-600 mt-1 capitalize">
                      {userData?.type === "client" ? "Cliente Premium" : "Usuario"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-4">
                <div className="bg-blue-600 p-3 rounded-xl">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Servicio a Domicilio</h3>
                  <p className="text-sm text-gray-600">
                    Llevamos el lavado hasta tu puerta. Sin costo adicional en la ciudad.
                  </p>
                </div>
              </div>

              {/* Recent Services from Bookings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Servicios Recientes</h2>
                  <button 
                    onClick={() => navigate("/my-bookings")}
                    className="text-blue-600 text-sm font-medium"
                  >
                    Ver todos
                  </button>
                </div>
                <div className="space-y-3">
                  {recentBookings.length > 0 ? (
                    recentBookings.map((booking) => {
                      const statusBadge = getStatusBadge(booking.status_code);
                      return (
                        <div key={booking.id} className="bg-white rounded-2xl p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{booking.service.name}</h3>
                            <span className={`text-xs px-3 py-1 rounded-full ${statusBadge.color}`}>
                              {statusBadge.text}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              {booking.vehicle.brand} {booking.vehicle.model}
                            </span>
                            <span className="font-medium text-blue-600">
                              ${booking.subtotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(booking.delivery_time || booking.created_at)}
                          </div>
                          {booking.notes && (
                            <p className="text-xs text-gray-400 mt-2 truncate">
                              {booking.notes}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No hay servicios previos</p>
                      <button 
                        onClick={() => navigate("/services")}
                        className="mt-3 text-blue-600 text-sm font-medium"
                      >
                        Agendar tu primer servicio
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/services")}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold shadow-lg hover:bg-blue-700 transition-colors"
              >
                Agendar Nuevo Servicio
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}