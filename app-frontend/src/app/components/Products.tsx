import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ShoppingCart, Plus, Minus, Star, X } from "lucide-react";
import { motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  reviews: number;
}

interface CartItem extends Product {
  quantity: number;
}

export function Products() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
      return;
    }

    // Load cart from localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [navigate]);

  const categories = ["Todos", "Shampoo", "Cera", "Accesorios", "Interior"];

  const products: Product[] = [
    {
      id: "1",
      name: "Shampoo Premium",
      description: "Shampoo profesional con pH neutro para lavado exterior",
      price: 24.99,
      category: "Shampoo",
      image: "https://images.unsplash.com/photo-1631728747540-e328dbd3bba4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      rating: 4.8,
      reviews: 124,
    },
    {
      id: "2",
      name: "Cera Carnauba",
      description: "Cera premium con protección UV para brillo duradero",
      price: 34.99,
      category: "Cera",
      image: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      rating: 4.9,
      reviews: 89,
    },
    {
      id: "3",
      name: "Kit de Microfibra",
      description: "Set de 6 paños de microfibra de alta calidad",
      price: 19.99,
      category: "Accesorios",
      image: "https://images.unsplash.com/photo-1563299796-17596ed6b017?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      rating: 4.7,
      reviews: 156,
    },
    {
      id: "4",
      name: "Limpiador de Interiores",
      description: "Limpiador multiusos para tablero y plásticos",
      price: 15.99,
      category: "Interior",
      image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      rating: 4.6,
      reviews: 92,
    },
    {
      id: "5",
      name: "Aromatizante Premium",
      description: "Fragancia de larga duración para el interior",
      price: 12.99,
      category: "Interior",
      image: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      rating: 4.5,
      reviews: 203,
    },
    {
      id: "6",
      name: "Protector de Llantas",
      description: "Protector y abrillantador para neumáticos",
      price: 16.99,
      category: "Accesorios",
      image: "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      rating: 4.7,
      reviews: 78,
    },
  ];

  const filteredProducts =
    selectedCategory === "Todos"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    let updatedCart: CartItem[];

    if (existingItem) {
      updatedCart = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeFromCart = (productId: string) => {
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

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const getCartQuantity = (productId: string) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <div className="hidden lg:block">
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
                <h1 className="text-3xl">Productos</h1>
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
                <h1 className="text-4xl mb-4">Productos</h1>
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
                {filteredProducts.map((product, index) => {
                  const quantity = getCartQuantity(product.id);
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4 p-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                          <ImageWithFallback
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {product.description}
                          </p>

                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600 ml-1">
                                {product.rating}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              ({product.reviews})
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-blue-600">
                              ${product.price.toFixed(2)}
                            </span>

                            {quantity === 0 ? (
                              <button
                                onClick={() => addToCart(product)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                              >
                                Agregar
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
                                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                  <Plus className="h-4 w-4 text-blue-600" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
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
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <p className="text-blue-600 font-semibold text-sm mt-1">
                            ${item.price.toFixed(2)}
                          </p>
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
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Plus className="h-3 w-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const updatedCart = cart.filter((c) => c.id !== item.id);
                            setCart(updatedCart);
                            localStorage.setItem("cart", JSON.stringify(updatedCart));
                          }}
                          className="p-1 hover:bg-red-50 rounded transition-colors self-start"
                        >
                          <X className="h-4 w-4 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    ))}
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
                    <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
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
                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
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