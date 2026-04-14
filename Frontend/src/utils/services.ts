export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: 'basic' | 'premium' | 'detail' | 'protection' | 'special';
  features: string[];
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

const SERVICES_KEY = 'autosplash_services';

// Initialize with sample data
const initializeServices = () => {
  const existing = localStorage.getItem(SERVICES_KEY);
  if (!existing) {
    const sampleServices: Service[] = [
      {
        id: 'service_1',
        name: 'Lavado Básico',
        description: 'Lavado exterior completo con secado a mano',
        price: 15.99,
        duration: 30,
        category: 'basic',
        features: [
          'Lavado exterior con espuma',
          'Enjuague completo',
          'Secado con microfibra',
          'Limpieza de llantas',
          'Limpieza de ventanas exteriores',
        ],
        isActive: true,
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: 'service_2',
        name: 'Lavado Premium',
        description: 'Lavado completo interior y exterior',
        price: 29.99,
        duration: 60,
        category: 'premium',
        features: [
          'Todo lo del lavado básico',
          'Aspirado interior completo',
          'Limpieza de tablero y consola',
          'Limpieza de ventanas interiores',
          'Aromatización',
          'Protección de neumáticos',
        ],
        isActive: true,
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: 'service_3',
        name: 'Detallado Interior',
        description: 'Limpieza profunda del habitáculo',
        price: 49.99,
        duration: 90,
        category: 'detail',
        features: [
          'Aspirado profundo de alfombras',
          'Limpieza de tapicería',
          'Acondicionamiento de cuero',
          'Limpieza de molduras',
          'Desinfección interior',
        ],
        isActive: true,
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: 'service_4',
        name: 'Pulido y Encerado',
        description: 'Protección y brillo para tu vehículo',
        price: 79.99,
        duration: 120,
        category: 'protection',
        features: [
          'Lavado premium incluido',
          'Pulido de pintura',
          'Aplicación de cera premium',
          'Sellado de pintura',
          'Protección UV',
        ],
        isActive: true,
        createdAt: new Date('2024-01-01').toISOString(),
      },
    ];
    localStorage.setItem(SERVICES_KEY, JSON.stringify(sampleServices));
  }
};

initializeServices();

export const getServices = (): Service[] => {
  const data = localStorage.getItem(SERVICES_KEY);
  return data ? JSON.parse(data) : [];
};

export const getActiveServices = (): Service[] => {
  return getServices().filter(s => s.isActive);
};

export const getServiceById = (id: string): Service | null => {
  return getServices().find(s => s.id === id) || null;
};

export const addService = (serviceData: Omit<Service, 'id' | 'createdAt'>): Service => {
  const services = getServices();
  const newService: Service = {
    ...serviceData,
    id: `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  services.push(newService);
  localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
  return newService;
};

export const updateService = (id: string, updates: Partial<Omit<Service, 'id' | 'createdAt'>>): void => {
  const services = getServices();
  const index = services.findIndex(s => s.id === id);

  if (index !== -1) {
    services[index] = { ...services[index], ...updates };
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
  }
};

export const deleteService = (id: string): void => {
  const services = getServices();
  const filtered = services.filter(s => s.id !== id);
  localStorage.setItem(SERVICES_KEY, JSON.stringify(filtered));
};
