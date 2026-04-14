import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { User, Mail, Phone, MapPin, Settings, LogOut, Bell, HelpCircle, Shield, ChevronRight, Star, ShoppingBag, Car, Edit2, Ticket, Calendar, Camera, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  type: string;
  role?: string;
  photo_url?: string;
}

export function Profile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData>({
    id: 0,
    name: "",
    email: "",
    phone: "",
    address: "",
    type: "",
    role: "",
    photo_url: "",
  });
  const [error, setError] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUserData = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/users/me", {
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
        throw new Error("Error al obtener datos del usuario");
      }

      const data = await response.json();
      setUserData({
        id: data.id,
        name: `${data.name} ${data.last_name || ""} ${data.second_last_name || ""}`.trim(),
        email: data.email,
        phone: data.phone || "",
        address: data.address || "",
        type: data.type,
        role: data.role,
        photo_url: data.photo_url || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("access_token");
    
    try {
      if (token) {
        await fetch("http://localhost:8000/api/v1/users/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      localStorage.clear();
      navigate("/");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona una imagen válida");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5MB");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowPhotoModal(true);
    setError("");
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    const token = localStorage.getItem("access_token");
    setIsUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/api/v1/users/me/image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al subir la imagen");
      }

      const data = await response.json();
      
      // Actualizar la foto de perfil en el estado
      setUserData(prev => ({
        ...prev,
        photo_url: data.photo_url,
      }));
      
      setShowPhotoModal(false);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      
      // Recargar datos del usuario para asegurar consistencia
      await fetchUserData();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsUploading(false);
    }
  };

  const getPhotoUrl = () => {
    if (userData.photo_url) {
      // Si la URL es relativa, añadir el host
      if (userData.photo_url.startsWith("/")) {
        return `http://localhost:8000${userData.photo_url}`;
      }
      return userData.photo_url;
    }
    return null;
  };

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  const quickActions = [
    { icon: Car, label: "Mis Vehículos", path: "/vehicles", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Ticket, label: "Mis Tickets", path: "/tickets", color: "text-indigo-600", bg: "bg-indigo-50" },
    { icon: Calendar, label: "Mis Reservas", path: "/my-bookings", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Star, label: "Mis Reseñas", path: "/reviews", color: "text-yellow-600", bg: "bg-yellow-50" },
    { icon: ShoppingBag, label: "Productos", path: "/products", color: "text-green-600", bg: "bg-green-50" },
  ];

  const adminAction = { icon: Shield, label: "Panel Admin", path: "/admin", color: "text-purple-600", bg: "bg-purple-50" };
  const allQuickActions = userData.role === "admin" ? [...quickActions, adminAction] : quickActions;

  const menuItems = [
    { icon: Settings, label: "Configuración", description: "Ajusta tus preferencias", color: "text-blue-600", bg: "bg-blue-50", path: "/profile/settings" },
    { icon: Bell, label: "Notificaciones", description: "Gestiona alertas", color: "text-purple-600", bg: "bg-purple-50", path: "/profile/notifications" },
    { icon: Shield, label: "Privacidad", description: "Seguridad de datos", color: "text-gray-600", bg: "bg-gray-50", path: "/profile/privacy" },
    { icon: HelpCircle, label: "Ayuda y Soporte", description: "Obtén asistencia", color: "text-orange-600", bg: "bg-orange-50", path: "/profile/support" },
  ];

  const getUserTypeLabel = () => {
    if (userData.role === "admin") return "Administrador";
    if (userData.type === "client") return "Cliente Premium";
    return "Usuario";
  };

  if (isLoading) {
    return (
      <>
        <div className="hidden lg:block sticky top-0 z-50">
          <TopNav />
        </div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando perfil...</p>
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
              onClick={fetchUserData}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        </div>
      </>
    );
  }

  const photoUrl = getPhotoUrl();

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <div className="hidden lg:block sticky top-0 z-50">
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
                {/* Avatar con opción de cambiar foto */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative group">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {userData.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 text-white hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-1">{userData.name}</h2>
                    <p className="text-sm text-gray-500">{getUserTypeLabel()}</p>
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
                      <p className="font-medium">{userData.phone || "No registrado"}</p>
                    </div>
                  </div>

                  {userData.address && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Dirección</p>
                        <p className="font-medium">{userData.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate("/profile/edit")}
                  className="w-full mt-6 bg-blue-50 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
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
                {/* Avatar con opción de cambiar foto */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                        {userData.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 bg-blue-600 rounded-full p-2 text-white hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <h2 className="text-2xl font-bold mb-1 text-center mt-4">{userData.name}</h2>
                  <p className="text-sm text-gray-500">{getUserTypeLabel()}</p>
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
                    <p className="font-medium text-gray-700">{userData.phone || "No registrado"}</p>
                  </div>
                  {userData.address && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Dirección</p>
                      <p className="font-medium text-gray-700">{userData.address}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate("/profile/edit")}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mb-3 flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
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
                  {allQuickActions.map((item, index) => (
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
                      onClick={() => {
                        if (item.path) {
                          navigate(item.path);
                        }
                      }}
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

      {/* Input file oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Modal para previsualizar y confirmar foto */}
      <AnimatePresence>
        {showPhotoModal && previewUrl && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Cambiar foto de perfil</h3>
                <button
                  onClick={() => {
                    setShowPhotoModal(false);
                    setSelectedFile(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex justify-center mb-6">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-40 h-40 rounded-full object-cover border-4 border-blue-600"
                />
              </div>

              <p className="text-center text-gray-600 mb-6">
                ¿Deseas usar esta imagen como tu foto de perfil?
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPhotoModal(false);
                    setSelectedFile(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadPhoto}
                  disabled={isUploading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}