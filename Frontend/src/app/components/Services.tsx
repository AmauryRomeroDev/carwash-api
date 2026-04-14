import { useState, useEffect } from "react";
import { Check, Sparkles, Wind, Droplet, Zap, Car, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";
import { useNavigate } from "react-router";

interface Service {
  id: number;
  service_name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

// Mapa de iconos por nombre de servicio
const getServiceIcon = (serviceName: string) => {
  const name = serviceName.toLowerCase();
  if (name.includes("básico") || name.includes("basico")) return Droplet;
  if (name.includes("premium")) return Sparkles;
  if (name.includes("interior")) return Car;
  if (name.includes("pulido") || name.includes("encerado")) return Zap;
  if (name.includes("motor")) return Wrench;
  return Wind;
};

// Características predefinidas por tipo de servicio (para mantener el diseño)
const getServiceFeatures = (serviceName: string): string[] => {
  const name = serviceName.toLowerCase();
  if (name.includes("básico") || name.includes("basico")) {
    return [
      "Lavado exterior con espuma",
      "Enjuague completo",
      "Secado con microfibra",
      "Limpieza de llantas",
      "Limpieza de ventanas exteriores",
    ];
  }
  if (name.includes("premium")) {
    return [
      "Todo lo del lavado básico",
      "Aspirado interior completo",
      "Limpieza de tablero y consola",
      "Limpieza de ventanas interiores",
      "Aromatización",
      "Protección de neumáticos",
    ];
  }
  if (name.includes("interior")) {
    return [
      "Aspirado profundo de asientos y alfombras",
      "Limpieza de tapicería con vapor",
      "Limpieza y protección de cuero",
      "Limpieza de cajuela",
      "Desinfección completa",
      "Eliminación de olores",
    ];
  }
  if (name.includes("pulido") || name.includes("encerado")) {
    return [
      "Pulido profesional",
      "Eliminación de rayones superficiales",
      "Aplicación de cera premium",
      "Sellador de pintura",
      "Restauración del brillo original",
      "Protección contra rayos UV",
    ];
  }
  if (name.includes("motor")) {
    return [
      "Desengrase profesional",
      "Limpieza con vapor",
      "Protección de componentes eléctricos",
      "Aplicación de protector de plásticos",
      "Revisión visual de fugas",
    ];
  }
  return [
    "Servicio profesional",
    "Productos de alta calidad",
    "Personal especializado",
    "Garantía de satisfacción",
  ];
};

// Imágenes predefinidas por tipo de servicio
const getServiceImage = (serviceName: string): string => {
  const name = serviceName.toLowerCase();
  if (name.includes("básico") || name.includes("basico")) {
    return "https://images.unsplash.com/photo-1761312834150-4beefff097a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
  }
  if (name.includes("premium")) {
    return "https://images.unsplash.com/photo-1763291894075-33c686e1a72c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
  }
  if (name.includes("interior")) {
    return "https://images.unsplash.com/photo-1750563289663-a8abdd857ed5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
  }
  if (name.includes("pulido") || name.includes("encerado")) {
    return "https://images.unsplash.com/photo-1733065411447-921bfada4cf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
  }
  if (name.includes("motor")) {
    return "https://images.unsplash.com/photo-1760827797819-4361cd5cd353?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
  }
  return "https://images.unsplash.com/photo-1680032339010-8141679f3761?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
};

export function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchServices();
  }, [navigate]);

  const fetchServices = async () => {
    const token = localStorage.getItem("access_token");
    
    try {
      const response = await fetch("http://localhost:8000/api/v1/services/", {
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
        throw new Error("Error al cargar los servicios");
      }

      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${minutes}min`;
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
            <p className="mt-4 text-gray-600">Cargando servicios...</p>
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
              onClick={fetchServices}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Navigation - Desktop Only */}
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Nuestros Servicios
            </h1>
            <p className="text-xl text-blue-100">
              Desde un lavado rápido hasta un detallado completo
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services List */}
      <section className="px-6 py-12 max-w-7xl mx-auto">
        <div className="space-y-16 lg:space-y-24">
          {services.map((service, index) => {
            const Icon = getServiceIcon(service.service_name);
            const features = getServiceFeatures(service.service_name);
            const image = getServiceImage(service.service_name);
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Image */}
                <div
                  className={`relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-xl ${
                    index % 2 === 1 ? "lg:order-2" : ""
                  }`}
                >
                  <ImageWithFallback
                    src={image}
                    alt={service.service_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Content */}
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold mb-2">
                    {service.service_name}
                  </h2>
                  <p className="text-lg text-gray-600 mb-4">
                    {service.description}
                  </p>
                  
                  {/* Price and Duration */}
                  <div className="flex gap-4 mb-6">
                    <div className="bg-green-50 px-4 py-2 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Precio</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatPrice(service.price)}
                      </p>
                    </div>
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Duración</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatDuration(service.duration_minutes)}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className="bg-green-100 rounded-full p-1 mt-1 flex-shrink-0">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Booking Button */}
                  <button 
                    onClick={() => navigate(`/booking/${service.id}`)}
                    className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    Reservar Ahora
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nuestro Proceso
            </h2>
            <p className="text-xl text-gray-600">
              Así es como cuidamos tu vehículo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Inspección Inicial",
                description: "Evaluamos el estado de tu vehículo y confirmamos el servicio",
              },
              {
                step: "2",
                title: "Preparación",
                description: "Protegemos las áreas sensibles y preparamos los productos",
              },
              {
                step: "3",
                title: "Ejecución",
                description: "Realizamos el servicio con técnicas profesionales",
              },
              {
                step: "4",
                title: "Inspección Final",
                description: "Verificamos la calidad y tu satisfacción",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}