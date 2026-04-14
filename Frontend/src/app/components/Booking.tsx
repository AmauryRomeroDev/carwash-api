import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Calendar, Clock, Car, User, Mail, Phone, CheckCircle, MapPin, Loader2, Plus, Trash2, ShoppingBag, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

interface UserData {
  id: number;
  name: string;
  email: string;
  type: string;
  address?: string;
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

interface SelectedService {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  hasDiscount: boolean;
}

export function Booking() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any>(null);
  const [error, setError] = useState("");
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);

  const [formData, setFormData] = useState({
    vehicleId: "",
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
        const transformedServices = data
          .filter((s: Service) => s.is_active !== false)
          .map((service: Service) => ({
            ...service,
            price: typeof service.price === "number" ? service.price : Number(service.price) || 0,
            discount: typeof service.discount === "number" ? service.discount : Number(service.discount) || 0,
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
    const price = typeof service.price === "number" ? service.price : Number(service.price) || 0;
    if (service.has_discount && service.discount > 0) {
      const discount = typeof service.discount === "number" ? service.discount : Number(service.discount) || 0;
      return Number((price * (1 - discount / 100)).toFixed(2));
    }
    return Number(price.toFixed(2));
  };

  const addService = (service: Service) => {
    if (selectedServices.some((s) => s.id === service.id)) {
      setError("Este servicio ya ha sido agregado");
      setTimeout(() => setError(""), 3000);
      return;
    }
    const finalPrice = getFinalPrice(service);
    setSelectedServices([
      ...selectedServices,
      {
        id: service.id,
        name: service.service_name,
        price: finalPrice,
        originalPrice: service.price,
        discount: service.discount,
        hasDiscount: service.has_discount,
      },
    ]);
    setShowServiceDropdown(false);
  };

  const removeService = (serviceId: number) => {
    setSelectedServices(selectedServices.filter((s) => s.id !== serviceId));
  };

  const calculateTotal = () => {
    return selectedServices.reduce((sum, service) => sum + service.price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.vehicleId) {
      setError("Por favor selecciona un vehículo");
      return;
    }
    if (selectedServices.length === 0) {
      setError("Por favor selecciona al menos un servicio");
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
    if (userData?.type !== "client") {
      setError("Solo los clientes pueden realizar reservas");
      return;
    }
    if (!userData?.id) {
      setError("No se encontró información del usuario");
      return;
    }

    setIsSubmitting(true);

    const token = localStorage.getItem("access_token");
    const deliveryDateTime = new Date(`${formData.date}T${formData.time}`);
    const isoString = deliveryDateTime.toISOString();

    const ordersData = selectedServices.map((service) => ({
      ticket_id: 0,
      client_id: userData.id,
      vehicle_id: parseInt(formData.vehicleId),
      service_id: service.id,
      washer_id: 0,
      casher_id: 0,
      delivery_time: isoString,
      notes: formData.notes || "",
      start_time: isoString,
      completion_time: null,
      subtotal: service.price,
      is_active: true,
    }));

    try {
      const response = await fetch("http://localhost:8000/api/v1/staff/services/sells", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ordersData),
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  ];

  const availableServices = services.filter(
    (service) => !selectedServices.some((s) => s.id === service.id)
  );

  // ── Selected vehicle helper ──────────────────────────────────────────────────
  const selectedVehicle = vehicles.find((v) => v.id.toString() === formData.vehicleId);

  // ── Guards ───────────────────────────────────────────────────────────────────
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
    const total = calculateTotal();
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
              Gracias, <strong>{userData?.name}</strong>. Hemos recibido tu solicitud.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 text-left mb-6 max-h-60 overflow-y-auto">
              <h3 className="font-semibold mb-3">Detalles de tu reserva:</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Ticket #:</strong> {createdTicket.ticket_id}</li>
                <li><strong>Servicios:</strong></li>
                {selectedServices.map((service) => (
                  <li key={service.id} className="ml-4 text-sm">
                    • {service.name} - ${service.price.toFixed(2)}
                  </li>
                ))}
                <li>
                  <strong>Vehículo:</strong> {selectedVehicle?.brand} {selectedVehicle?.model} ({selectedVehicle?.liscence_plate})
                </li>
                <li>
                  <strong>Fecha:</strong>{" "}
                  {new Date(formData.date).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </li>
                <li><strong>Hora:</strong> {formData.time}</li>
                <li><strong>Total:</strong> ${total.toFixed(2)}</li>
              </ul>
            </div>
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

  // ── Main Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>

      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        <section className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl">
          <div className="max-w-md mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-3xl font-bold mb-4">Reserva Tu Cita</h1>
              <p className="text-blue-100">Completa el formulario y confirma tu servicio</p>
            </motion.div>
          </div>
        </section>

        <section className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl font-bold mb-4">Reservación de Cita</h1>
              <p className="text-xl text-blue-100">Completa el formulario y confirma tu servicio</p>
            </motion.div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-6 lg:py-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
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
                  {/* Información de contacto */}
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

                  {/* ── Vehicle Dropdown ─────────────────────────────────── */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Car className="h-4 w-4 inline mr-1" />
                      Selecciona tu vehículo *
                    </label>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                          formData.vehicleId
                            ? "border-blue-500 bg-blue-50/30"
                            : "border-gray-300 bg-white"
                        } hover:border-blue-400`}
                      >
                        <div className="flex items-center gap-3">
                          {formData.vehicleId ? (
                            <>
                              <div className="bg-blue-600 p-1.5 rounded-lg">
                                <Car className="h-4 w-4 text-white" />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-gray-900 leading-tight">
                                  {selectedVehicle?.brand} {selectedVehicle?.model}
                                </p>
                                <p className="text-xs text-blue-600 font-medium">
                                  {selectedVehicle?.liscence_plate}
                                </p>
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500">Selecciona un vehículo</span>
                          )}
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${
                            showVehicleDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {showVehicleDropdown && (
                          <>
                            {/* Overlay para cerrar al hacer clic fuera */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowVehicleDropdown(false)}
                            />

                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-20 mt-2 w-full bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
                            >
                              <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                                {vehicles.length === 0 ? (
                                  <div className="p-4 text-center text-gray-500 text-sm">
                                    No tienes vehículos registrados
                                  </div>
                                ) : (
                                  vehicles.map((vehicle) => (
                                    <button
                                      key={vehicle.id}
                                      type="button"
                                      onClick={() => {
                                        setFormData({ ...formData, vehicleId: vehicle.id.toString() });
                                        setShowVehicleDropdown(false);
                                      }}
                                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                                        formData.vehicleId === vehicle.id.toString()
                                          ? "bg-blue-50 border border-blue-200"
                                          : "hover:bg-gray-50 border border-transparent"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`p-2 rounded-lg ${
                                            formData.vehicleId === vehicle.id.toString()
                                              ? "bg-blue-600 text-white"
                                              : "bg-gray-100 text-gray-500"
                                          }`}
                                        >
                                          <Car className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                          <p className="font-bold text-gray-900">
                                            {vehicle.brand} {vehicle.model}
                                          </p>
                                          <p className="text-sm text-gray-500 uppercase">
                                            {vehicle.liscence_plate}
                                          </p>
                                        </div>
                                      </div>
                                      {formData.vehicleId === vehicle.id.toString() && (
                                        <CheckCircle className="h-5 w-5 text-blue-600" />
                                      )}
                                    </button>
                                  ))
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => navigate("/Vehicles")}
                                className="w-full p-3 bg-gray-50 border-t border-gray-100 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Gestionar Vehículos
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* ── Services Dropdown ────────────────────────────────── */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ShoppingBag className="h-4 w-4 inline mr-1" />
                      Selecciona los servicios *
                    </label>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-300 bg-white hover:border-blue-400 transition-colors"
                      >
                        <span className="text-gray-500">+ Agregar servicio</span>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-400 transition-transform ${
                            showServiceDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {showServiceDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-10 mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-y-auto"
                          >
                            {availableServices.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                Todos los servicios ya fueron agregados
                              </div>
                            ) : (
                              availableServices.map((service) => {
                                const finalPrice = getFinalPrice(service);
                                return (
                                  <button
                                    key={service.id}
                                    type="button"
                                    onClick={() => addService(service)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-medium text-gray-900">{service.service_name}</p>
                                        <p className="text-sm text-gray-500">
                                          {service.description?.substring(0, 60)}...
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        {service.has_discount && service.discount > 0 ? (
                                          <>
                                            <p className="font-bold text-green-600">${finalPrice.toFixed(2)}</p>
                                            <p className="text-xs text-gray-400 line-through">
                                              ${service.price.toFixed(2)}
                                            </p>
                                          </>
                                        ) : (
                                          <p className="font-bold text-blue-600">${finalPrice.toFixed(2)}</p>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Selected services list */}
                    {selectedServices.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {selectedServices.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{service.name}</p>
                              <div className="flex items-center gap-2 text-sm">
                                {service.hasDiscount && service.discount > 0 ? (
                                  <>
                                    <span className="text-green-600 font-semibold">
                                      ${service.price.toFixed(2)}
                                    </span>
                                    <span className="text-gray-400 line-through">
                                      ${service.originalPrice.toFixed(2)}
                                    </span>
                                    <span className="text-red-500 text-xs">-{service.discount}%</span>
                                  </>
                                ) : (
                                  <span className="text-blue-600 font-semibold">
                                    ${service.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeService(service.id)}
                              className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}

                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <span className="font-semibold text-gray-700">Total:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            ${calculateTotal().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Fecha *
                      </label>
                      <input
                        type="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Hora *
                      </label>
                      <select
                        name="time"
                        required
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      >
                        <option value="">Selecciona una hora</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas adicionales
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                      placeholder="Instrucciones especiales para el servicio..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || selectedServices.length === 0}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      `Confirmar Reserva - $${calculateTotal().toFixed(2)}`
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

      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}