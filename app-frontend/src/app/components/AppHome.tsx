import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Sparkles, Clock, MapPin, Star, Calendar, Bell, Search } from "lucide-react";
import { motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function AppHome() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
      return;
    }
    const name = localStorage.getItem("userName") || "Usuario";
    setUserName(name.split(" ")[0]);
  }, [navigate]);

  const quickServices = [
    { icon: Sparkles, name: "Lavado\nBásico", color: "bg-blue-500" },
    { icon: Clock, name: "Lavado\nRápido", color: "bg-green-500" },
    { icon: Star, name: "Premium", color: "bg-yellow-500" },
    { icon: Calendar, name: "Agendar", color: "bg-purple-500" },
  ];

  const recentBookings = [
    {
      service: "Lavado Premium",
      date: "15 Mar 2026",
      status: "Completado",
      rating: 5,
    },
    {
      service: "Lavado Básico",
      date: "08 Mar 2026",
      status: "Completado",
      rating: 5,
    },
  ];

  const promotions = [
    {
      title: "30% OFF",
      subtitle: "En tu primer servicio",
      image: "https://images.unsplash.com/photo-1761312834150-4beefff097a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjB3YXNoaW5nJTIwZm9hbXxlbnwxfHx8fDE3NzM2MzIwNjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      title: "Lavado Gratis",
      subtitle: "Cada 5 servicios",
      image: "https://images.unsplash.com/photo-1763291894075-33c686e1a72c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbiUyMHNoaW55JTIwY2FyJTIwZXh0ZXJpb3J8ZW58MXx8fHwxNzczNzA4ODQzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
  ];

  const testimonials = [
    {
      name: "Carlos Mendoza",
      service: "Lavado Premium",
      comment: "Excelente servicio! Mi auto quedó impecable. Definitivamente volveré.",
      rating: 5,
    },
    {
      name: "María González",
      service: "Detallado Completo",
      comment: "Increíble trabajo con el detallado. Mi auto de 5 años parece nuevo.",
      rating: 5,
    },
    {
      name: "Ana Martínez",
      service: "Pulido y Encerado",
      comment: "El pulido dejó mi auto brillante como nunca. Muy recomendado!",
      rating: 5,
    },
  ];

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <div className="hidden lg:block">
        <TopNav />
      </div>

      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        {/* Header - Mobile Version */}
        <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-blue-100 text-sm">Hola,</p>
                <h1 className="text-2xl font-bold">{userName} 👋</h1>
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
                ¡Bienvenido, {userName}! 👋
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
                  {quickServices.map((service, index) => (
                    <motion.button
                      key={index}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/booking")}
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
                      className="relative h-48 rounded-2xl overflow-hidden shadow-lg"
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

              {/* Testimonials */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Lo que dicen nuestros clientes</h2>
                  <button 
                    onClick={() => navigate("/reviews")}
                    className="text-blue-600 text-sm font-medium"
                  >
                    Ver todas
                  </button>
                </div>
                <div className="space-y-3">
                  {testimonials.map((testimonial, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-white rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{testimonial.name}</h3>
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {testimonial.service}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-3">{testimonial.comment}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-6 mt-6 lg:mt-0">
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

              {/* Recent Bookings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Servicios Recientes</h2>
                  <button className="text-blue-600 text-sm font-medium">Ver todos</button>
                </div>
                <div className="space-y-3">
                  {recentBookings.map((booking, index) => (
                    <div key={index} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{booking.service}</h3>
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{booking.date}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(booking.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/booking")}
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