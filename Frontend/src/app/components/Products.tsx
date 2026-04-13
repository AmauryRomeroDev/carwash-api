import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ShoppingCart, Plus, Minus, Star, X, Tag } from "lucide-react";
import { motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Product {
  id: number;
  product_name: string;
  description: string;
  unit_price: number;
  stock: number;
  discount: number;
  has_discount: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: string;
  image_url?: string;
}

interface CartItem extends Product {
  quantity: number;
}

export function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [categories, setCategories] = useState<string[]>(["Todos"]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchProducts();
    loadCart();
  }, [navigate]);

  const fetchProducts = async () => {
    const token = localStorage.getItem("access_token");
    
    try {
      const response = await fetch("http://localhost:8000/api/v1/products/", {
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
        throw new Error("Error al cargar productos");
      }

      const data: Product[] = await response.json();
      
      // Filtrar solo productos activos
      const activeProducts = data.filter(p => p.is_active === true);
      setProducts(activeProducts);
      
      // Extraer categorías únicas (si no hay categoría, usar "General")
      const uniqueCategories = [...new Set(activeProducts.map(p => p.category || "General"))];
      setCategories(["Todos", ...uniqueCategories]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const getFinalPrice = (product: Product): number => {
    if (product.has_discount && product.discount > 0) {
      return product.unit_price * (1 - product.discount / 100);
    }
    return product.unit_price;
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    let updatedCart: CartItem[];

    if (existingItem) {
      // Verificar stock disponible
      if (existingItem.quantity >= product.stock) {
        return; // No se puede agregar más
      }
      updatedCart = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }

    saveCart(updatedCart);
  };

  const removeFromCart = (productId: number) => {
    const existingItem = cart.find((item) => item.id === productId);
    let updatedCart: CartItem[];

    if (existingItem && existingItem.quantity > 1) {
      updatedCart = cart.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    } else {
      updatedCart = cart.filter((item) => item.id !== productId);
    }

    saveCart(updatedCart);
  };

  const removeItemCompletely = (productId: number) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    saveCart(updatedCart);
  };

  const getCartQuantity = (productId: number) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const cartTotal = cart.reduce(
    (total, item) => total + getFinalPrice(item) * item.quantity,
    0
  );

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  const filteredProducts =
    selectedCategory === "Todos"
      ? products
      : products.filter((p) => (p.category || "General") === selectedCategory);

  const getProductImage = (product: Product) => {
    return product.image_url || "https://images.unsplash.com/photo-1631728747540-e328dbd3bba4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
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
            <p className="mt-4 text-gray-600">Cargando productos...</p>
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
              onClick={fetchProducts}
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
    <>
      {/* Top Navigation - Desktop Only */}
      <div className="hidden lg:block sticky top-0 z-50">
        <TopNav />
      </div>

      <div className="min-h-screen bg-gray-50 lg:pb-8 pb-24">
        {/* Header - Mobile Version */}
        <section className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold">Productos</h1>
                <div className="relative">
                  <ShoppingCart className="h-7 w-7" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartItemsCount}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-blue-100">
                Productos profesionales para el cuidado de tu auto
              </p>
            </motion.div>
          </div>
        </section>

        {/* Desktop Header */}
        <section className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl font-bold mb-4">Productos</h1>
                <p className="text-xl text-blue-100">
                  Productos profesionales para el cuidado de tu auto
                </p>
              </motion.div>
              <div className="relative">
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl flex items-center gap-3">
                  <ShoppingCart className="h-6 w-6" />
                  <div>
                    <p className="text-sm text-blue-100">Carrito</p>
                    <p className="font-bold">{cartItemsCount} productos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 lg:py-8 py-6">
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Left Column - Products */}
            <div className="lg:col-span-2">
              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-4 lg:pb-6 scrollbar-hide mb-6">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-blue-600"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="grid lg:grid-cols-2 gap-4 mb-6">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, index) => {
                    const quantity = getCartQuantity(product.id);
                    const finalPrice = getFinalPrice(product);
                    const originalPrice = product.unit_price;
                    const hasDiscount = product.has_discount && product.discount > 0;
                    
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-4 p-4">
                          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 relative">
                            {hasDiscount && (
                              <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded-br-lg">
                                -{product.discount}%
                              </div>
                            )}
                            <ImageWithFallback
                              src={getProductImage(product)}
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1 truncate">
                              {product.product_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {product.description}
                            </p>

                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-500">
                                Stock: {product.stock} unidades
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                {hasDiscount ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-blue-600">
                                      ${finalPrice.toFixed(2)}
                                    </span>
                                    <span className="text-sm text-gray-400 line-through">
                                      ${originalPrice.toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-lg font-bold text-blue-600">
                                    ${finalPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>

                              {quantity === 0 ? (
                                <button
                                  onClick={() => addToCart(product)}
                                  disabled={product.stock === 0}
                                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                    product.stock === 0
                                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                  }`}
                                >
                                  {product.stock === 0 ? "Agotado" : "Agregar"}
                                </button>
                              ) : (
                                <div className="flex items-center gap-2 bg-blue-50 rounded-lg">
                                  <button
                                    onClick={() => removeFromCart(product.id)}
                                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                  >
                                    <Minus className="h-4 w-4 text-blue-600" />
                                  </button>
                                  <span className="font-semibold text-blue-600 min-w-[20px] text-center">
                                    {quantity}
                                  </span>
                                  <button
                                    onClick={() => addToCart(product)}
                                    disabled={quantity >= product.stock}
                                    className={`p-2 rounded-lg transition-colors ${
                                      quantity >= product.stock
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "hover:bg-blue-100 text-blue-600"
                                    }`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-12 bg-white rounded-2xl">
                    <p className="text-gray-500">
                      No hay productos en esta categoría
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Cart Summary (Desktop Sticky) */}
            <div className="lg:col-span-1">
              {cart.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-6 lg:sticky lg:top-24"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Carrito de Compras</h3>
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {cart.map((item) => {
                      const finalPrice = getFinalPrice(item);
                      return (
                        <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <ImageWithFallback
                              src={getProductImage(item)}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.product_name}</h4>
                            <p className="text-blue-600 font-semibold text-sm mt-1">
                              ${finalPrice.toFixed(2)}
                            </p>
                            {item.has_discount && (
                              <p className="text-xs text-green-600">
                                Ahorro: ${(item.unit_price - finalPrice).toFixed(2)}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <Minus className="h-3 w-3 text-gray-600" />
                              </button>
                              <span className="text-sm font-medium min-w-[20px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                disabled={item.quantity >= item.stock}
                                className={`p-1 rounded transition-colors ${
                                  item.quantity >= item.stock
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "hover:bg-gray-100 text-gray-600"
                                }`}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItemCompletely(item.id)}
                            className="p-1 hover:bg-red-50 rounded transition-colors self-start"
                          >
                            <X className="h-4 w-4 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Envío</span>
                      <span className="font-semibold text-green-600">Gratis</span>
                    </div>
                    <div className="flex items-center justify-between mb-4 pt-2 border-t border-gray-200">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${cartTotal.toFixed(2)}
                      </span>
                    </div>
                    <button 
                      onClick={() => navigate("/checkout")}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Proceder al pago
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="hidden lg:block bg-white rounded-2xl shadow-lg p-6 text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tu carrito está vacío</p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Cart Summary */}
          {cart.length > 0 && (
            <div className="lg:hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 sticky bottom-24"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total del carrito</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${cartTotal.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {cartItemsCount} {cartItemsCount === 1 ? "producto" : "productos"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate("/checkout")}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Proceder al pago
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}