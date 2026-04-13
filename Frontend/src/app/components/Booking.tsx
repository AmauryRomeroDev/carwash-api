import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Calendar, Clock, Car, User, Mail, Phone, CheckCircle, MapPin, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

interface UserData {
  id: number;
  name: string;
  email: string;
  type: string;
  address?: string;
  client?: {
    id: number;
  };
}

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  liscence_plate: string;
  is_temporary: boolean;
}

interface Service {
  is_active: boolean;
  id: number;
  service_name: string;
  description: string;
  price: number;
  duration_minutes: number;
  has_discount: boolean;
  discount: number;
}

export function Booking() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any>(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    vehicleId: "",
    serviceId: "",
    date: "",
    time: "",
    notes: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchUserData();
    fetchServices();
    fetchVehicles();
  }, [navigate]);

  const fetchUserData = async () => {
    const token = localStorage.getItem("access_token");
    
    try {
      const response = await fetch("http://localhost:8000/api/v1/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          navigate("/");
          return;
        }
        throw new Error("Error al cargar datos del usuario");
      }

      const data = await response.json();
      setUserData(data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const fetchServices = async () => {
    const token = localStorage.getItem("access_token");
    
    try {
      const response = await fetch("http://localhost:8000/api/v1/services/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Transformar los datos para asegurar tipos numéricos
        const transformedServices = data
          .filter((s: Service) => s.is_active !== false)
          .map((service: Service) => ({
            ...service,
            price: typeof service.price === 'number' ? service.price : Number(service.price) || 0,
            discount: typeof service.discount === 'number' ? service.discount : Number(service.discount) || 0,
          }));
        setServices(transformedServices);
      }
    } catch (err) {
      console.error("Error al cargar servicios:", err);
    }
  };

  const fetchVehicles = async () => {
    const token = localStorage.getItem("access_token");
    
    try {
      const response = await fetch("http://localhost:8000/api/v1/vehicles/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFinalPrice = (service: Service): number => {
    const price = typeof service.price === 'number' ? service.price : Number(service.price) || 0;
    
    if (service.has_discount && service.discount > 0) {
      const discount = typeof service.discount === 'number' ? service.discount : Number(service.discount) || 0;
      return Number((price * (1 - discount / 100)).toFixed(2));
    }
    return Number(price.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.vehicleId) {
      setError("Por favor selecciona un vehículo");
      return;
    }
    if (!formData.serviceId) {
      setError("Por favor selecciona un servicio");
      return;
    }
    if (!formData.date) {
      setError("Por favor selecciona una fecha");
      return;
    }
    if (!formData.time) {
      setError("Por favor selecciona una hora");
      return;
    }

    setIsSubmitting(true);

    const token = localStorage.getItem("access_token");
    const selectedService = services.find(s => s.id === parseInt(formData.serviceId));
    const finalPrice = selectedService ? getFinalPrice(selectedService) : 0;
    
    // Combinar fecha y hora
    const deliveryDateTime = new Date(`${formData.date}T${formData.time}`);
    
    // Crear la orden de servicio con el formato completo
    const orderData = [{
      client_id: userData?.client?.id || 0,
      vehicle_id: parseInt(formData.vehicleId),
      service_id: parseInt(formData.serviceId),
      washer_id: 0,
      casher_id: 0,
      delivery_time: deliveryDateTime.toISOString(),
      start_time: deliveryDateTime.toISOString(),
      completion_time: null,
      subtotal: finalPrice,
      notes: formData.notes,
      is_active: true
    }];

    try {
      const response = await fetch("http://localhost:8000/api/v1/sells/services/sells", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear la reserva");
      }

      const ticketData = await response.json();
      setCreatedTicket(ticketData);
      setSubmitted(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  if (isLoading) {
    return (
      <>
        <div className="hidden lg:block sticky top-0 z-50">
          <TopNav />
        </div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </>
    );
  }

  if (submitted && createdTicket) {
    const selectedService = services.find(s => s.id === parseInt(formData.serviceId));
    const selectedVehicle = vehicles.find(v => v.id === parseInt(formData.vehicleId));
    const finalPrice = selectedService ? getFinalPrice(selectedService) : 0;
    const ticketTotal = createdTicket.grand_total ? Number(createdTicket.grand_total) : finalPrice;
    
    return (
      <>
        <div className="hidden lg:block sticky top-0 z-50">
          <TopNav />
        </div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">¡Reserva Confirmada!</h2>
            <p className="text-xl text-gray-600 mb-6">
              Gracias, <strong>{userData?.name}</strong>. Hemos recibido tu solicitud de reserva.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
              <h3 className="font-semibold mb-3">Detalles de tu reserva:</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Ticket #:</strong> {createdTicket.ticket_id}</li>
                <li><strong>Servicio:</strong> {selectedService?.service_name}</li>
                <li><strong>Vehículo:</strong> {selectedVehicle?.brand} {selectedVehicle?.model} ({selectedVehicle?.liscence_plate})</li>
                <li><strong>Fecha:</strong> {new Date(formData.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                <li><strong>Hora:</strong> {formData.time}</li>
                <li><strong>Total:</strong> ${ticketTotal.toFixed(2)}</li>
              </ul>
            </div>
            <p className="text-gray-600 mb-6">
              Te hemos enviado un correo de confirmación a <strong>{userData?.email}</strong>
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/home")}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Volver al Inicio
              </button>
              <button
                onClick={() => navigate("/my-bookings")}
                className="w-full bg-white text-blue-600 border-2 border-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Ver mis reservas
              </button>
            </div>
          </motion.div>
          <BottomNav />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>

      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        {/* Hero Section - Mobile */}
        <section className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold mb-4">
                Reserva Tu Cita
              </h1>
              <p className="text-blue-100">
                Completa el formulario y confirma tu servicio
              </p>
            </motion.div>
          </div>
        </section>

        {/* Hero Section - Desktop */}
        <section className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl font-bold mb-4">
                Reservación de Cita
              </h1>
              <p className="text-xl text-blue-100">
                Completa el formulario y confirma tu servicio
              </p>
            </motion.div>
          </div>
        </section>

        {/* Booking Form */}
        <section className="max-w-7xl mx-auto px-6 py-6 lg:py-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 lg:p-8"
              >
                <h2 className="text-xl lg:text-2xl font-semibold mb-6">Datos de la Reserva</h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Datos del Usuario (pre-llenados) */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-gray-700 mb-2">Información de contacto</h3>
                    <div className="flex items-center gap-3 text-gray-600">
                      <User className="h-5 w-5" />
                      <span>{userData?.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="h-5 w-5" />
                      <span>{userData?.email}</span>
                    </div>
                  </div>

                  {/* Vehículo */}
                  <div>
                    <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-2">
                      <Car className="h-4 w-4 inline mr-1" />
                      Selecciona tu vehículo *
                    </label>
                    <select
                      id="vehicleId"
                      name="vehicleId"
                      required
                      value={formData.vehicleId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    >
                      <option value="">Selecciona un vehículo</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} - {vehicle.liscence_plate}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Servicio */}
                  <div>
                    <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de servicio *
                    </label>
                    <select
                      id="serviceId"
                      name="serviceId"
                      required
                      value={formData.serviceId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    >
                      <option value="">Selecciona un servicio</option>
                      {services.map((service) => {
                        const finalPrice = getFinalPrice(service);
                        const originalPrice = Number(service.price) || 0;
                        const discountValue = Number(service.discount) || 0;
                        
                        return (
                          <option key={service.id} value={service.id}>
                            {service.service_name} - ${finalPrice.toFixed(2)}
                            {service.has_discount && discountValue > 0 && 
                              ` (${discountValue}% OFF - Original $${originalPrice.toFixed(2)})`
                            }
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Fecha y Hora */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Fecha *
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Hora *
                      </label>
                      <select
                        id="time"
                        name="time"
                        required
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      >
                        <option value="">Selecciona una hora</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Notas adicionales
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                      placeholder="Instrucciones especiales para el servicio..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Confirmar Reserva"
                    )}
                  </button>
                </form>
              </motion.div>
            </div>

            {/* Right Column - Info */}
            <div className="lg:col-span-1 mt-6 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 lg:sticky lg:top-24"
              >
                <h3 className="font-semibold text-lg mb-4">Información Importante</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Respuesta Rápida</h4>
                      <p className="text-sm text-gray-600">Confirmamos tu cita en menos de 2 horas</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Disponibilidad</h4>
                      <p className="text-sm text-gray-600">Abierto 7 días a la semana de 8 AM a 6 PM</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Servicio a Domicilio</h4>
                      <p className="text-sm text-gray-600">Sin costo adicional en la ciudad</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Flexibilidad</h4>
                      <p className="text-sm text-gray-600">Cancela o reprograma sin costo</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">¿Tienes preguntas?</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Contáctanos y te ayudaremos con tu reserva
                  </p>
                  <a
                    href="tel:+5551234567"
                    className="block text-center bg-blue-50 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                  >
                    (555) 123-4567
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}