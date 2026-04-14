// utils/cart.ts

export interface CartItem {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  quantity: number;
  subtotal: number;
  type: 'service' | 'product'; // Nuevo campo para diferenciar
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  updatedAt: string;
}

const CART_KEY = 'autosplash_cart';
const TAX_RATE = 0.08; // 8% tax

// Get current cart
export const getCart = (): Cart => {
  const data = localStorage.getItem(CART_KEY);
  if (!data) {
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      updatedAt: new Date().toISOString(),
    };
  }
  return JSON.parse(data);
};

// Calculate totals
const calculateTotals = (items: CartItem[]): { subtotal: number; tax: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

// Save cart
const saveCart = (cart: Cart): void => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

// Add service to cart
export const addServiceToCart = (serviceId: string, serviceName: string, servicePrice: number): void => {
  const cart = getCart();

  // Check if item already exists
  const existingItem = cart.items.find(item => item.serviceId === serviceId && item.type === 'service');

  if (existingItem) {
    // Update quantity
    existingItem.quantity += 1;
    existingItem.subtotal = existingItem.quantity * existingItem.servicePrice;
  } else {
    // Add new item
    const newItem: CartItem = {
      id: `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serviceId,
      serviceName,
      servicePrice,
      quantity: 1,
      subtotal: servicePrice,
      type: 'service',
    };
    cart.items.push(newItem);
  }

  // Recalculate totals
  const totals = calculateTotals(cart.items);
  cart.subtotal = totals.subtotal;
  cart.tax = totals.tax;
  cart.total = totals.total;
  cart.updatedAt = new Date().toISOString();

  saveCart(cart);
};

// Add product to cart
export const addProductToCart = (productId: string, productName: string, productPrice: number): void => {
  const cart = getCart();

  // Check if item already exists
  const existingItem = cart.items.find(item => item.serviceId === productId && item.type === 'product');

  if (existingItem) {
    // Update quantity
    existingItem.quantity += 1;
    existingItem.subtotal = existingItem.quantity * existingItem.servicePrice;
  } else {
    // Add new item
    const newItem: CartItem = {
      id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serviceId: productId,
      serviceName: productName,
      servicePrice: productPrice,
      quantity: 1,
      subtotal: productPrice,
      type: 'product',
    };
    cart.items.push(newItem);
  }

  // Recalculate totals
  const totals = calculateTotals(cart.items);
  cart.subtotal = totals.subtotal;
  cart.tax = totals.tax;
  cart.total = totals.total;
  cart.updatedAt = new Date().toISOString();

  saveCart(cart);
};

// Legacy addToCart function for backward compatibility
export const addToCart = (serviceId: string, serviceName: string, servicePrice: number, type: 'service' | 'product' = 'service'): void => {
  if (type === 'service') {
    addServiceToCart(serviceId, serviceName, servicePrice);
  } else {
    addProductToCart(serviceId, serviceName, servicePrice);
  }
};

// Update item quantity
export const updateCartItemQuantity = (itemId: string, quantity: number): void => {
  const cart = getCart();
  const item = cart.items.find(i => i.id === itemId);

  if (item) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items = cart.items.filter(i => i.id !== itemId);
    } else {
      item.quantity = quantity;
      item.subtotal = item.quantity * item.servicePrice;
    }

    // Recalculate totals
    const totals = calculateTotals(cart.items);
    cart.subtotal = totals.subtotal;
    cart.tax = totals.tax;
    cart.total = totals.total;
    cart.updatedAt = new Date().toISOString();

    saveCart(cart);
  }
};

// Remove item from cart
export const removeFromCart = (itemId: string): void => {
  const cart = getCart();
  cart.items = cart.items.filter(item => item.id !== itemId);

  // Recalculate totals
  const totals = calculateTotals(cart.items);
  cart.subtotal = totals.subtotal;
  cart.tax = totals.tax;
  cart.total = totals.total;
  cart.updatedAt = new Date().toISOString();

  saveCart(cart);
};

// Clear cart
export const clearCart = (): void => {
  const emptyCart: Cart = {
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    updatedAt: new Date().toISOString(),
  };
  saveCart(emptyCart);
};

// Get cart item count
export const getCartItemCount = (): number => {
  const cart = getCart();
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
};

// Get services count
export const getServicesCount = (): number => {
  const cart = getCart();
  return cart.items
    .filter(item => item.type === 'service')
    .reduce((sum, item) => sum + item.quantity, 0);
};

// Get products count
export const getProductsCount = (): number => {
  const cart = getCart();
  return cart.items
    .filter(item => item.type === 'product')
    .reduce((sum, item) => sum + item.quantity, 0);
};