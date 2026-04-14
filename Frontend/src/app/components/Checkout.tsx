import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ShoppingCart, Plus, Minus, Trash2, ArrowLeft, CreditCard,
  CheckCircle, ShoppingBag, Package, Loader2,
} from "lucide-react";
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

interface UserData {
  id: number;
  name: string;
  email: string;
  type: string;
  client?: { id: number };
}

export function Checkout() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<CartItem[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [step, setStep] = useState<"cart" | "confirm" | "confirmation">("cart");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    loadCart();
    fetchUserData();
  }, [navigate]);

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setProducts(JSON.parse(savedCart));
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
      console.error("Error al cargar usuario:", err);
    }
  };

  // ── Price helpers ──────────────────────────────────────────────────────────
  const getFinalPrice = (product: Product): number => {
    if (product.has_discount && product.discount > 0) {
      return Number((product.unit_price * (1 - product.discount / 100)).toFixed(2));
    }
    return Number(product.unit_price.toFixed(2));
  };

  // ── Cart actions ───────────────────────────────────────────────────────────
  const updateProductQuantity = (productId: number, delta: number) => {
    const existing = products.find((p) => p.id === productId);
    if (!existing) return;

    const newQty = existing.quantity + delta;
    let updated: CartItem[];

    if (newQty <= 0) {
      updated = products.filter((p) => p.id !== productId);
    } else if (newQty > existing.stock) {
      return; // no exceder stock
    } else {
      updated = products.map((p) =>
        p.id === productId ? { ...p, quantity: newQty } : p
      );
    }

    setProducts(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const removeProduct = (productId: number) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  // ── Totals ─────────────────────────────────────────────────────────────────
  const calculateSubtotal = () =>
    products.reduce((sum, p) => sum + getFinalPrice(p) * p.quantity, 0);

  const calculateTax = () => calculateSubtotal() * 0.08;
  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const cartItemsCount = products.reduce((sum, p) => sum + p.quantity, 0);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (products.length === 0) {
      setError("No hay productos en el carrito");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("access_token");

    // Payload según el schema: array de OrderProduct
    const orderItems = products.map((product) => {
      const finalPrice = getFinalPrice(product);
      const subtotal = Number((finalPrice * product.quantity).toFixed(2));
      return {
        ticket_id: 0,
        product_id: product.id,
        client_id: userData?.client?.id ?? 0,
        casher_id: 0,
        amount: product.quantity,
        subtotal: subtotal,
        total: subtotal,
      };
    });

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/staff/orders/products/sells",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderItems),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al procesar la compra");
      }

      const result = await response.json();
      setTicketResult(result);
      setStep("confirmation");

      // Limpiar carrito tras confirmar
      setTimeout(() => {
        localStorage.removeItem("cart");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Confirmation screen ────────────────────────────────────────────────────
  if (step === "confirmation") {
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
            <h2 className="text-3xl font-bold mb-4">¡Compra Confirmada!</h2>
            <p className="text-xl text-gray-600 mb-6">
              Tu compra ha sido procesada exitosamente.
            </p>

            <div className="bg-gray-50 rounded-xl p-6 text-left mb-6 max-h-72 overflow-y-auto">
              <h3 className="font-semibold mb-3">Detalles del pedido:</h3>

              {ticketResult && (
                <p className="text-sm text-green-700 font-medium mb-2">
                  Ticket #{ticketResult.ticket_id}
                </p>
              )}

              {products.map((p) => (
                <div key={p.id} className="flex justify-between text-sm py-1">
                  <span>
                    {p.product_name} x{p.quantity}
                  </span>
                  <span>${(getFinalPrice(p) * p.quantity).toFixed(2)}</span>
                </div>
              ))}

              <div className="border-t mt-3 pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IVA (8%)</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/home")}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Volver al Inicio
            </button>
          </motion.div>
        </div>
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </>
    );
  }

  // ── Confirm step (resumen + notas antes de pagar) ──────────────────────────
  if (step === "confirm") {
    return (
      <>
        <div className="hidden lg:block sticky top-0 z-50">
          <TopNav />
        </div>
        <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-6">
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => setStep("cart")}
                className="flex items-center gap-2 mb-4 text-blue-100 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Volver al carrito</span>
              </button>
              <h1 className="text-3xl font-bold mb-1">Confirmar Compra</h1>
              <p className="text-blue-100">Revisa tu pedido antes de pagar</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 lg:p-8"
            >
              {/* Order summary */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-semibold text-lg mb-4">Resumen del pedido</h3>
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{p.product_name}</span>
                        <span className="text-gray-400">x{p.quantity}</span>
                      </div>
                      <span className="font-semibold">
                        ${(getFinalPrice(p) * p.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>IVA (8%)</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl pt-2 border-t">
                    <span>Total</span>
                    <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleConfirmPurchase} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                    placeholder="Instrucciones especiales para la entrega..."
                  />
                </div>

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
                    <>
                      <CreditCard className="h-5 w-5" />
                      Confirmar Pago — ${calculateTotal().toFixed(2)}
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </>
    );
  }

  // ── Cart step ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>
      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/products")}
              className="flex items-center gap-2 mb-4 text-blue-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Continuar comprando</span>
            </button>
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold mb-1">Carrito de Compras</h1>
                <p className="text-blue-100">{cartItemsCount} producto(s) en tu carrito</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
              <p className="text-gray-500 mb-6">Agrega productos para continuar</p>
              <button
                onClick={() => navigate("/products")}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 mx-auto hover:bg-blue-700 transition-colors"
              >
                <Package className="h-5 w-5" />
                Ver Productos
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Products list */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Productos
                </h3>

                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm p-5"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1">
                          {product.product_name}
                        </h3>
                        {product.description && (
                          <p className="text-gray-500 text-sm mb-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-bold text-blue-600">
                            ${getFinalPrice(product).toFixed(2)}
                          </span>
                          {product.has_discount && product.discount > 0 && (
                            <>
                              <span className="text-gray-400 line-through text-sm">
                                ${product.unit_price.toFixed(2)}
                              </span>
                              <span className="text-xs text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">
                                -{product.discount}%
                              </span>
                            </>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateProductQuantity(product.id, -1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="font-semibold w-6 text-center">
                            {product.quantity}
                          </span>
                          <button
                            onClick={() => updateProductQuantity(product.id, 1)}
                            disabled={product.quantity >= product.stock}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs text-gray-400">
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="font-bold text-lg">
                          ${(getFinalPrice(product) * product.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order summary sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                  <h3 className="font-semibold text-lg mb-4">Resumen del Pedido</h3>

                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>IVA (8%)</span>
                      <span>${calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-bold text-xl">
                      <span>Total</span>
                      <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep("confirm")}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    Proceder al Pago
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}