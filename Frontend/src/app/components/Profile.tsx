import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { User, Mail, Phone, MapPin, Settings, LogOut, Bell, HelpCircle, Shield, ChevronRight, Star, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

export function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
      return;
    }

    setUserData({
      name: localStorage.getItem("userName") || "Usuario",
      email: localStorage.getItem("userEmail") || "",
      phone: localStorage.getItem("userPhone") || "",
      address: localStorage.getItem("userAddress") || "",
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const quickActions = [
    { icon: Star, label: "Mis Reseñas", path: "/reviews", color: "text-yellow-600", bg: "bg-yellow-50" },
    { icon: ShoppingBag, label: "Productos", path: "/products", color: "text-green-600", bg: "bg-green-50" },
  ];

  const menuItems = [
    { icon: Settings, label: "Configuración", description: "Ajusta tus preferencias", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Bell, label: "Notificaciones", description: "Gestiona alertas", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Shield, label: "Privacidad", description: "Seguridad de datos", color: "text-gray-600", bg: "bg-gray-50" },
    { icon: HelpCircle, label: "Ayuda y Soporte", description: "Obtén asistencia", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <div className="hidden lg:block">
        <TopNav />
      </div>

      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        {/* Header - Mobile Version */}
        <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-24 rounded-b-3xl">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-2">Mi Perfil</h1>
            <p className="text-blue-100 text-sm">Administra tu cuenta y preferencias</p>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-4">Mi Perfil</h1>
            <p className="text-xl text-blue-100">Administra tu cuenta y preferencias</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:py-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Mobile Profile Card Container */}
            <div className="lg:hidden -mt-16 mb-6">
              {/* Profile Card - Mobile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 mb-6"
              >
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-1">{userData.name}</h2>
                    <p className="text-sm text-gray-500">Cliente Premium</p>
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium">{userData.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Phone className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Teléfono</p>
                      <p className="font-medium">{userData.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Dirección</p>
                      <p className="font-medium">{userData.address}</p>
                    </div>
                  </div>
                </div>

                <button className="w-full mt-6 bg-blue-50 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors">
                  Editar Perfil
                </button>
              </motion.div>

              {/* Stats - Mobile */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-blue-600 mb-1">8</p>
                  <p className="text-xs text-gray-600">Servicios</p>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-green-600 mb-1">$240</p>
                  <p className="text-xs text-gray-600">Ahorrado</p>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-yellow-600 mb-1">5.0</p>
                  <p className="text-xs text-gray-600">Rating</p>
                </div>
              </div>
            </div>

            {/* Desktop Left Column - Profile Info */}
            <div className="hidden lg:block lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-8 sticky top-24"
              >
                {/* Avatar */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white text-5xl font-bold mb-4">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold mb-1 text-center">{userData.name}</h2>
                  <p className="text-sm text-gray-500">Cliente Premium</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 mb-1">8</p>
                    <p className="text-xs text-gray-600">Servicios</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 mb-1">$240</p>
                    <p className="text-xs text-gray-600">Ahorrado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600 mb-1">5.0</p>
                    <p className="text-xs text-gray-600">Rating</p>
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nombre</p>
                    <p className="font-medium text-gray-700">{userData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Correo electrónico</p>
                    <p className="font-medium text-gray-700">{userData.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                    <p className="font-medium text-gray-700">{userData.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Dirección</p>
                    <p className="font-medium text-gray-700">{userData.address}</p>
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mb-3">
                  Editar Perfil
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar Sesión
                </button>
              </motion.div>
            </div>

            {/* Right Column - Settings & Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-semibold text-lg">Acciones Rápidas</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {quickActions.map((item, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors"
                      onClick={() => navigate(item.path)}
                    >
                      <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center`}>
                        <item.icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <span className="flex-1 text-left font-medium text-gray-700 text-lg">{item.label}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Settings Menu */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-semibold text-lg">Configuración</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {menuItems.map((item, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center`}>
                        <item.icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-700 text-lg">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Mobile Logout Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="lg:hidden w-full bg-red-50 text-red-600 py-4 rounded-2xl font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 mb-6"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </motion.button>

              {/* Version */}
              <p className="text-center text-xs text-gray-500 lg:text-left">
                AutoSplash v1.0.0
              </p>
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
