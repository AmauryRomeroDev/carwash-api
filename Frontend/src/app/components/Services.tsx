import { Check, Sparkles, Wind, Droplet, Zap, Car, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { BottomNav } from "./BottomNav";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export function Services() {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
    }
  }, [navigate]);

  const services = [
    {
      icon: Droplet,
      title: "Lavado Básico",
      description: "Lavado exterior completo con secado a mano",
      features: [
        "Lavado exterior con espuma",
        "Enjuague completo",
        "Secado con microfibra",
        "Limpieza de llantas",
        "Limpieza de ventanas exteriores",
      ],
      image: "https://images.unsplash.com/photo-1761312834150-4beefff097a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjB3YXNoaW5nJTIwZm9hbXxlbnwxfHx8fDE3NzM2MzIwNjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      icon: Sparkles,
      title: "Lavado Premium",
      description: "Lavado completo interior y exterior",
      features: [
        "Todo lo del lavado básico",
        "Aspirado interior completo",
        "Limpieza de tablero y consola",
        "Limpieza de ventanas interiores",
        "Aromatización",
        "Protección de neumáticos",
      ],
      image: "https://images.unsplash.com/photo-1763291894075-33c686e1a72c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbiUyMHNoaW55JTIwY2FyJTIwZXh0ZXJpb3J8ZW58MXx8fHwxNzczNzA4ODQzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      icon: Car,
      title: "Detallado Interior",
      description: "Limpieza profunda del habitáculo",
      features: [
        "Aspirado profundo de asientos y alfombras",
        "Limpieza de tapicería con vapor",
        "Limpieza y protección de cuero",
        "Limpieza de cajuela",
        "Desinfección completa",
        "Eliminación de olores",
      ],
      image: "https://images.unsplash.com/photo-1750563289663-a8abdd857ed5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBkZXRhaWxpbmclMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzM2OTA3MDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      icon: Zap,
      title: "Pulido y Encerado",
      description: "Restauración y protección de la pintura",
      features: [
        "Pulido profesional",
        "Eliminación de rayones superficiales",
        "Aplicación de cera premium",
        "Sellador de pintura",
        "Restauración del brillo original",
        "Protección contra rayos UV",
      ],
      image: "https://images.unsplash.com/photo-1733065411447-921bfada4cf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBjYXIlMjBwb2xpc2h8ZW58MXx8fHwxNzczNzA4ODQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      icon: Wrench,
      title: "Limpieza de Motor",
      description: "Desengrase y limpieza del compartimiento",
      features: [
        "Desengrase profesional",
        "Limpieza con vapor",
        "Protección de componentes eléctricos",
        "Aplicación de protector de plásticos",
        "Revisión visual de fugas",
      ],
      image: "https://images.unsplash.com/photo-1760827797819-4361cd5cd353?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjB3YXNoJTIwY2xlYW5pbmclMjBzZXJ2aWNlfGVufDF8fHx8MTc3MzY1NzUwOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      icon: Wind,
      title: "Detallado Completo",
      description: "El paquete más completo",
      features: [
        "Todos los servicios anteriores",
        "Limpieza de tapicería de techo",
        "Restauración de faros",
        "Limpieza de rieles y molduras",
        "Tratamiento anti-lluvia en cristales",
        "Garantía de satisfacción total",
      ],
      image: "https://images.unsplash.com/photo-1680032339010-8141679f3761?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGN1c3RvbWVyJTIwY2FyJTIwc2VydmljZXxlbnwxfHx8fDE3NzM2OTYxMzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
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
              Nuestros Servicios
            </h1>
            <p className="text-blue-100">
              Desde un lavado rápido hasta un detallado completo
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services List */}
      <section className="px-6 py-6 max-w-md mx-auto">
        <div className="space-y-16">
          {services.map((service, index) => (
            <motion.div
              key={index}
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
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Content */}
              <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <service.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-3xl md:text-4xl mb-4">
                  {service.title}
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  {service.description}
                </p>
                <ul className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="bg-green-100 rounded-full p-1 mt-1 flex-shrink-0">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl mb-4">
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
                <h3 className="text-xl mb-2">{item.title}</h3>
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