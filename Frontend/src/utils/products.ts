export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
}

const PRODUCTS_KEY = 'autosplash_products';

// Initialize with sample data
const initializeProducts = () => {
  const existing = localStorage.getItem(PRODUCTS_KEY);
  if (!existing) {
    const sampleProducts: Product[] = [
      {
        id: 'product_1',
        name: 'Shampoo Premium',
        description: 'Shampoo profesional con pH neutro para lavado exterior',
        price: 24.99,
        category: 'Shampoo',
        stock: 45,
        rating: 4.8,
        reviewCount: 124,
        isActive: true,
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: 'product_2',
        name: 'Cera Carnauba',
        description: 'Cera natural de carnauba para brillo duradero',
        price: 34.99,
        category: 'Cera',
        stock: 32,
        rating: 4.9,
        reviewCount: 89,
        isActive: true,
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: 'product_3',
        name: 'Paños de Microfibra',
        description: 'Set de 5 paños premium para secado sin rayones',
        price: 19.99,
        category: 'Accesorios',
        stock: 78,
        rating: 4.7,
        reviewCount: 156,
        isActive: true,
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: 'product_4',
        name: 'Limpiador de Interiores',
        description: 'Limpiador multiusos para tablero y tapicería',
        price: 16.99,
        category: 'Interior',
        stock: 54,
        rating: 4.6,
        reviewCount: 67,
        isActive: true,
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: 'product_5',
        name: 'Protector de Neumáticos',
        description: 'Brillo y protección UV para neumáticos',
        price: 14.99,
        category: 'Accesorios',
        stock: 61,
        rating: 4.5,
        reviewCount: 92,
        isActive: true,
        createdAt: new Date('2024-01-01').toISOString(),
      },
    ];
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(sampleProducts));
  }
};

initializeProducts();

export const getProducts = (): Product[] => {
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getActiveProducts = (): Product[] => {
  return getProducts().filter(p => p.isActive);
};

export const getProductById = (id: string): Product | null => {
  return getProducts().find(p => p.id === id) || null;
};

export const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviewCount'>): Product => {
  const products = getProducts();
  const newProduct: Product = {
    ...productData,
    id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  };

  products.push(newProduct);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  return newProduct;
};

export const updateProduct = (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): void => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);

  if (index !== -1) {
    products[index] = { ...products[index], ...updates };
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }
};

export const deleteProduct = (id: string): void => {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
};

export const updateProductStock = (id: string, quantity: number): void => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);

  if (index !== -1) {
    products[index].stock += quantity;
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }
};
