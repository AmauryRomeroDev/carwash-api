import { useLocation, useNavigate } from "react-router";
import { Home, Calendar, Star, ShoppingBag, User } from "lucide-react";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: "Inicio", path: "/home" },
    { icon: Calendar, label: "Agendar", path: "/booking" },
    { icon: Star, label: "Reseñas", path: "/reviews" },
    { icon: ShoppingBag, label: "Productos", path: "/products" },
    { icon: User, label: "Perfil", path: "/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom shadow-lg">
      <div className="max-w-md mx-auto px-2">
        <div className="grid grid-cols-5 gap-1 py-2">
          {navItems.map((item, index) => {
            const active = isActive(item.path);
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-all ${
                  active
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}