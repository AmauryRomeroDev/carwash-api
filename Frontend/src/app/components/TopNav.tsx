import { useLocation, useNavigate } from "react-router";
import { Home, Calendar, Star, ShoppingBag, User, Bell, Menu, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

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

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userRole, setUserRole] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

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
      const fullName = `${data.name} ${data.last_name || ""}`.trim();
      setUserName(fullName.split(" ")[0]);
      setUserEmail(data.email);
      setUserRole(data.role || data.type);
      
      if (data.photo_url) {
        const photoUrl = data.photo_url.startsWith("/") 
          ? `http://localhost:8000${data.photo_url}` 
          : data.photo_url;
        setUserPhoto(photoUrl);
      }
    } catch (err) {
      console.error("Error al cargar usuario:", err);
      const name = localStorage.getItem("userName") || "Usuario";
      setUserName(name.split(" ")[0]);
    }
  };

  // Todas las rutas incluyendo Servicios
  const navItems = [
    { icon: Home, label: "Inicio", path: "/home" },
    { icon: Calendar, label: "Agendar", path: "/booking" },
    { icon: Star, label: "Reseñas", path: "/reviews" },
    { icon: ShoppingBag, label: "Productos", path: "/products" },
    { icon: User, label: "Servicios", path: "/Services" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getUserTypeLabel = () => {
    if (userRole === "admin") return "Administrador";
    if (userRole === "employee") return "Empleado";
    return "Cliente Premium";
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    closeMobileMenu();
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Linkeable al home */}
            <button
              onClick={() => navigate("/home")}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg sm:text-xl px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
                AutoSplash
              </div>
            </button>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item, index) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={index}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-colors ${
                      active
                        ? "text-blue-600 bg-blue-50 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="text-sm lg:text-base">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* User Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Perfil - Solo la foto de perfil linkeable (visible en todos los tamaños) */}
              <button
                onClick={() => navigate("/profile")}
                className="hover:opacity-80 transition-opacity"
                title="Mi Perfil"
              >
                <div className="relative group">
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt="Profile"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-blue-600"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                      {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </div>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-600" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu - Todas las rutas incluyendo Servicios */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={closeMobileMenu}>
          <div 
            className="absolute top-16 left-0 right-0 bg-white shadow-xl rounded-b-2xl mx-4 overflow-hidden max-h-[calc(100vh-4rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Información del usuario en mobile */}
            <div className="px-4 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-3">
                {/* Foto de perfil clickeable también en el menú mobile */}
                <button
                  onClick={() => {
                    navigate("/profile");
                    closeMobileMenu();
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </button>
                <div className="flex-1">
                  <p className="font-semibold text-white">{userName || "Usuario"}</p>
                  <p className="text-xs text-blue-100">{getUserTypeLabel()}</p>
                  <p className="text-xs text-blue-100 mt-0.5">{userEmail}</p>
                </div>
              </div>
            </div>

            {/* Navigation Items Mobile - TODAS las rutas (Inicio, Agendar, Reseñas, Productos, Servicios) */}
            <div className="py-2">
              {navItems.map((item, index) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      navigate(item.path);
                      closeMobileMenu();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      active
                        ? "text-blue-600 bg-blue-50 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-base">{item.label}</span>
                    {active && (
                      <div className="ml-auto w-1 h-6 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Cerrar Sesión en mobile */}
            <div className="border-t border-gray-100 py-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-base">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}