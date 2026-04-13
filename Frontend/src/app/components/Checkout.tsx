import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, CreditCard, Calendar, Clock, CheckCircle, ShoppingBag, Package, Car, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

interface Product {
  id: number;
  product_name: string;
  description: string;
  unit_price: number;
  stock: number;
  discount: number;
  has_discount: boolean;
  is_active: boolean;
  category?: string;
  image_url?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Service {
  id: number;
  service_name: string;
  description: string;
  price: number;
  duration_minutes: number;
  has_discount: boolean;
  discount: number;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  type: string;
  client?: { id: number };
}

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  liscence_plate: string;
}

export function Checkout() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<CartItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [step, setStep] = useState<'cart' | 'booking' | 'confirmation'>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResults, setTicketResults] = useState<{ services?: any; products?: any }>({});
  const [bookingData, setBookingData] = useState({
    vehicleId: '',
    date: '',
    time: '',
    notes: '',
  });

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    loadCart();
    loadSelectedServices();
    fetchUserData();
    fetchVehicles();
  }, [navigate]);

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setProducts(JSON.parse(savedCart));
    }
  };
// En Checkout.tsx, función loadSelectedServices
const loadSelectedServices = () => {
  const savedServices = localStorage.getItem("selected_services");
  if (savedServices) {
    setSelectedServices(JSON.parse(savedServices));
  }
  
  // También cargar la información de agendamiento
  const savedBookingInfo = localStorage.getItem("booking_info");
  if (savedBookingInfo) {
    const info = JSON.parse(savedBookingInfo);
    setBookingData({
      vehicleId: info.vehicleId || '',
      date: info.date || '',
      time: info.time || '',
      notes: info.notes || '',
    });
  }
};

  const fetchUserData = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await fetch("http://localhost:8000/api/v1/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (err) {
      console.error("Error:", err);
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
      console.error("Error:", err);
    }
  };

  const getFinalPrice = (product: Product): number => {
    if (product.has_discount && product.discount > 0) {
      return product.unit_price * (1 - product.discount / 100);
    }
    return product.unit_price;
  };

  const getServiceFinalPrice = (service: Service): number => {
    if (service.has_discount && service.discount > 0) {
      return service.price * (1 - service.discount / 100);
    }
    return service.price;
  };

  const updateProductQuantity = (productId: number, delta: number) => {
    const existingItem = products.find((item) => item.id === productId);
    let updatedCart: CartItem[];

    if (existingItem) {
      const newQuantity = existingItem.quantity + delta;
      if (newQuantity <= 0) {
        updatedCart = products.filter((item) => item.id !== productId);
      } else if (newQuantity <= existingItem.stock) {
        updatedCart = products.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        );
      } else {
        return;
      }
    } else {
      return;
    }

    setProducts(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeProduct = (productId: number) => {
    const updatedCart = products.filter((item) => item.id !== productId);
    setProducts(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeService = (serviceId: number) => {
    const updatedServices = selectedServices.filter((s) => s.id !== serviceId);
    setSelectedServices(updatedServices);
    localStorage.setItem("selected_services", JSON.stringify(updatedServices));
  };

  const handleProceedToBooking = () => {
    if (products.length > 0 || selectedServices.length > 0) {
      setStep('booking');
    }
  };

  const submitServicesOrder = async () => {
    const token = localStorage.getItem("access_token");
    
    if (selectedServices.length === 0) return null;

    const deliveryDateTime = new Date(`${bookingData.date}T${bookingData.time}`);
    
    // Formato correcto para servicios según el esquema
    const ordersData = selectedServices.map(service => ({
      client_id: userData?.client?.id || 0,
      vehicle_id: parseInt(bookingData.vehicleId),
      service_id: service.id,
      washer_id: 0, // Se asigna después
      casher_id: 0, // Se asigna después
      delivery_time: deliveryDateTime.toISOString(),
      start_time: deliveryDateTime.toISOString(),
      completion_time: null,
      subtotal: getServiceFinalPrice(service),
      notes: bookingData.notes,
      is_active: true
    }));

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
      throw new Error(errorData.detail || "Error al procesar servicios");
    }

    return await response.json();
  };

  const submitProductsOrder = async () => {
    const token = localStorage.getItem("access_token");
    
    if (products.length === 0) return null;

    // Formato correcto para productos según el esquema
    const orderItems = products.map(product => {
      const finalPrice = getFinalPrice(product);
      const subtotal = finalPrice * product.quantity;
      
      return {
        product_id: product.id,
        client_id: userData?.client?.id || 0,
        casher_id: 0, // Se asigna después
        amount: product.quantity,
        subtotal: subtotal,
        total: subtotal // El total después de impuestos
      };
    });

    const response = await fetch("http://localhost:8000/api/v1/staff/orders/products/sells", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderItems),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al procesar productos");
    }

    return await response.json();
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasServices = selectedServices.length > 0;
    
    if (hasServices && !bookingData.vehicleId) {
      alert("Por favor selecciona un vehículo");
      return;
    }
    if (hasServices && (!bookingData.date || !bookingData.time)) {
      alert("Por favor selecciona fecha y hora");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const results: { services?: any; products?: any } = {};

      if (hasServices) {
        results.services = await submitServicesOrder();
      }

      if (products.length > 0) {
        results.products = await submitProductsOrder();
      }

      setTicketResults(results);
      setStep('confirmation');
      
      setTimeout(() => {
        localStorage.removeItem("cart");
        localStorage.removeItem("selected_services");
      }, 3000);
      
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al procesar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateSubtotal = () => {
    const productTotal = products.reduce(
      (sum, p) => sum + getFinalPrice(p) * p.quantity, 0
    );
    const serviceTotal = selectedServices.reduce(
      (sum, s) => sum + getServiceFinalPrice(s), 0
    );
    return productTotal + serviceTotal;
  };

  const calculateTax = () => calculateSubtotal() * 0.08;
  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const hasServices = selectedServices.length > 0;
  const hasProducts = products.length > 0;
  const cartItemsCount = products.reduce((sum, p) => sum + p.quantity, 0) + selectedServices.length;

  // Confirmation Step
  if (step === 'confirmation') {
    const selectedVehicle = vehicles.find(v => v.id === parseInt(bookingData.vehicleId));
    const serviceTicket = ticketResults.services;
    const productTicket = ticketResults.products;
    
    return (
      <>
        <div className="hidden lg:block"><TopNav /></div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">¡Pago Confirmado!</h2>
            <p className="text-xl text-gray-600 mb-6">
              {hasServices && hasProducts 
                ? "Tu servicio y productos han sido procesados exitosamente"
                : hasServices 
                  ? "Tu servicio ha sido agendado exitosamente"
                  : "Tu compra ha sido procesada exitosamente"}
            </p>
            <div className="bg-gray-50 rounded-lg p-6 text-left mb-6 max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-3">Detalles de tu pedido:</h3>
              
              {hasServices && serviceTicket && (
                <>
                  <p className="font-medium text-blue-600 mt-2">Ticket de Servicio #{serviceTicket.ticket_id}</p>
                  {serviceTicket.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm ml-2">
                      <span>{item.service_name}</span>
                      <span>${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t">
                    <span>Total Servicios:</span>
                    <span>${serviceTicket.grand_total?.toFixed(2) || 0}</span>
                  </div>
                </>
              )}
              
              {hasProducts && productTicket && (
                <>
                  <p className="font-medium text-green-600 mt-3">Ticket de Productos #{productTicket.ticket_id}</p>
                  {productTicket.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm ml-2">
                      <span>{item.product_name} x{item.amount}</span>
                      <span>${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t">
                    <span>Total Productos:</span>
                    <span>${productTicket.grand_total?.toFixed(2) || 0}</span>
                  </div>
                </>
              )}
              
              {hasServices && selectedVehicle && (
                <div className="mt-3 pt-2 border-t">
                  <p><strong>Vehículo:</strong> {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.liscence_plate})</p>
                  <p><strong>Fecha:</strong> {new Date(bookingData.date).toLocaleDateString('es-ES')}</p>
                  <p><strong>Hora:</strong> {bookingData.time}</p>
                </div>
              )}
              
              <div className="mt-3 pt-2 border-t flex justify-between font-bold text-lg">
                <span>Total General:</span>
                <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
            >
              Volver al Inicio
            </button>
          </motion.div>
        </div>
        <div className="lg:hidden"><BottomNav /></div>
      </>
    );
  }

  // Booking Step
  if (step === 'booking') {
    return (
      <>
        <div className="hidden lg:block"><TopNav /></div>
        <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-6 lg:rounded-b-3xl">
            <div className="max-w-7xl mx-auto">
              <button onClick={() => setStep('cart')} className="flex items-center gap-2 mb-4 text-blue-100">
                <ArrowLeft className="h-5 w-5" />
                <span>Volver al carrito</span>
              </button>
              <h1 className="text-3xl font-bold mb-2">
                {hasServices ? "Agendar Servicio" : "Confirmar Compra"}
              </h1>
              <p className="text-blue-100">
                {hasServices ? "Selecciona fecha y hora para tu servicio" : "Confirma los detalles de tu compra"}
              </p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-6 py-8">
            <motion.div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-semibold text-lg mb-3">Resumen de Compra</h3>
                {hasServices && selectedServices.map((s) => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span>{s.service_name}</span>
                    <span>${getServiceFinalPrice(s).toFixed(2)}</span>
                  </div>
                ))}
                {hasProducts && products.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span>{p.product_name} x{p.quantity}</span>
                    <span>${(getFinalPrice(p) * p.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-3 mt-2 border-t">
                  <span>Total:</span>
                  <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleConfirmBooking} className="space-y-6">
                {hasServices && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Car className="h-4 w-4 inline mr-1" /> Selecciona tu vehículo *
                      </label>
                      <select
                        required
                        value={bookingData.vehicleId}
                        onChange={(e) => setBookingData({ ...bookingData, vehicleId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300"
                      >
                        <option value="">Selecciona un vehículo</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.brand} {v.model} - {v.liscence_plate}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" /> Fecha *
                        </label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={bookingData.date}
                          onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock className="h-4 w-4 inline mr-1" /> Hora *
                        </label>
                        <select
                          required
                          value={bookingData.time}
                          onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300"
                        >
                          <option value="">Selecciona una hora</option>
                          {timeSlots.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas adicionales</label>
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 resize-none"
                    placeholder={hasServices ? "Instrucciones especiales para el servicio..." : "Instrucciones especiales para la entrega..."}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || (hasServices && vehicles.length === 0)}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                  {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Procesando...</> : <><CreditCard className="h-5 w-5" /> Confirmar Pago - ${calculateTotal().toFixed(2)}</>}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
        <div className="lg:hidden"><BottomNav /></div>
      </>
    );
  }

  // Cart Step
  return (
    <>
      <div className="hidden lg:block"><TopNav /></div>
      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-6 lg:rounded-b-3xl">
          <div className="max-w-7xl mx-auto">
            <button onClick={() => navigate('/services')} className="flex items-center gap-2 mb-4 text-blue-100">
              <ArrowLeft className="h-5 w-5" />
              <span>Continuar comprando</span>
            </button>
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold mb-1">Carrito de Compras</h1>
                <p className="text-blue-100">{cartItemsCount} item(s) en tu carrito</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {(products.length === 0 && selectedServices.length === 0) ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
              <div className="flex gap-4 justify-center">
                <button onClick={() => navigate('/services')} className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2">
                  <Car className="h-5 w-5" /> Ver Servicios
                </button>
                <button onClick={() => navigate('/products')} className="bg-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2">
                  <Package className="h-5 w-5" /> Ver Productos
                </button>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {hasServices && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Car className="h-5 w-5 text-blue-600" /> Servicios
                    </h3>
                    {selectedServices.map((service) => (
                      <div key={service.id} className="bg-white rounded-xl shadow-sm p-6 mb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{service.service_name}</h3>
                            <p className="text-gray-600 text-sm">{service.description}</p>
                            <p className="text-blue-600 font-bold mt-2">${getServiceFinalPrice(service).toFixed(2)}</p>
                          </div>
                          <button onClick={() => removeService(service.id)} className="text-red-600">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {hasProducts && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-600" /> Productos
                    </h3>
                    {products.map((product) => (
                      <div key={product.id} className="bg-white rounded-xl shadow-sm p-6 mb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{product.product_name}</h3>
                            <p className="text-gray-600 text-sm">${getFinalPrice(product).toFixed(2)} c/u</p>
                            <div className="flex items-center gap-3 mt-2">
                              <button onClick={() => updateProductQuantity(product.id, -1)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">-</button>
                              <span className="font-semibold w-8 text-center">{product.quantity}</span>
                              <button onClick={() => updateProductQuantity(product.id, 1)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">+</button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${(getFinalPrice(product) * product.quantity).toFixed(2)}</p>
                            <button onClick={() => removeProduct(product.id)} className="text-red-600 text-sm mt-2">Eliminar</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                  <h3 className="font-semibold text-lg mb-4">Resumen del Pedido</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (8%):</span>
                      <span>${calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-bold text-xl">
                      <span>Total:</span>
                      <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={handleProceedToBooking} className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 mb-3">
                    <CreditCard className="h-5 w-5" /> Proceder al Pago
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="lg:hidden"><BottomNav /></div>
    </>
  );
}