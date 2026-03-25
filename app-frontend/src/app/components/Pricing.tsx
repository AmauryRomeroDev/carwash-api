import { Check, Star } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { BottomNav } from "./BottomNav";
import { useEffect } from "react";

export function Pricing() {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
    }
  }, [navigate]);

  const pricingPlans = [
    {
      name: "Básico",
      price: "$15",
      duration: "20-30 min",
      description: "Perfecto para un lavado rápido",
      features: [
        "Lavado exterior con espuma",
        "Enjuague completo",
        "Secado con microfibra",
        "Limpieza de llantas",
        "Limpieza de ventanas exteriores",
      ],
      popular: false,
    },
    {
      name: "Premium",
      price: "$35",
      duration: "45-60 min",
      description: "El más popular",
      features: [
        "Todo lo del paquete Básico",
        "Aspirado interior completo",
        "Limpieza de tablero",
        "Limpieza de ventanas interiores",
        "Aromatización",
        "Protección de neumáticos",
      ],
      popular: true,
    },
    {
      name: "Deluxe",
      price: "$65",
      duration: "90-120 min",
      description: "Detallado completo",
      features: [
        "Todo lo del Premium",
        "Limpieza profunda de tapicería",
        "Pulido ligero de pintura",
        "Aplicación de cera",
        "Limpieza de motor",
        "Tratamiento anti-lluvia",
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl mb-4">
              Precios
            </h1>
            <p className="text-blue-100">
              Elige el paquete perfecto para tu auto
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 py-6 max-w-md mx-auto">
        <div className="space-y-4">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {plan.popular && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-semibold flex items-center justify-center gap-2">
                  <Star className="h-4 w-4 fill-current" />
                  MÁS POPULAR
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl mb-1">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{plan.price}</div>
                    <p className="text-xs text-gray-500">{plan.duration}</p>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <div className="bg-green-100 rounded-full p-0.5 mt-1 flex-shrink-0">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate("/booking")}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                    plan.popular
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  Seleccionar
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold mb-3 text-blue-900">Beneficios Incluidos</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600" />
              Garantía de satisfacción 100%
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600" />
              Productos premium ecológicos
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600" />
              Servicio a domicilio sin cargo
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600" />
              Acumula puntos por cada servicio
            </li>
          </ul>
        </div>
      </section>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
