export interface Vehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: 'sedan' | 'suv' | 'truck' | 'motorcycle' | 'van' | 'other';
  isDefault: boolean;
  createdAt: string;
}

const VEHICLES_KEY = 'autosplash_vehicles';

export const getVehicles = (): Vehicle[] => {
  const data = localStorage.getItem(VEHICLES_KEY);
  return data ? JSON.parse(data) : [];
};

export const getUserVehicles = (userId: string): Vehicle[] => {
  return getVehicles().filter(v => v.userId === userId);
};

export const addVehicle = (vehicleData: Omit<Vehicle, 'id' | 'createdAt'>): Vehicle => {
  const vehicles = getVehicles();

  // If this is the first vehicle or marked as default, unset other defaults
  if (vehicleData.isDefault) {
    vehicles.forEach(v => {
      if (v.userId === vehicleData.userId) {
        v.isDefault = false;
      }
    });
  }

  const newVehicle: Vehicle = {
    ...vehicleData,
    id: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  vehicles.push(newVehicle);
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  return newVehicle;
};

export const updateVehicle = (id: string, updates: Partial<Omit<Vehicle, 'id' | 'userId' | 'createdAt'>>): void => {
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === id);

  if (index !== -1) {
    // If setting as default, unset other defaults for this user
    if (updates.isDefault) {
      const userId = vehicles[index].userId;
      vehicles.forEach((v, i) => {
        if (v.userId === userId && i !== index) {
          v.isDefault = false;
        }
      });
    }

    vehicles[index] = { ...vehicles[index], ...updates };
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  }
};

export const deleteVehicle = (id: string): void => {
  const vehicles = getVehicles();
  const filtered = vehicles.filter(v => v.id !== id);
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(filtered));
};

export const getDefaultVehicle = (userId: string): Vehicle | null => {
  const userVehicles = getUserVehicles(userId);
  return userVehicles.find(v => v.isDefault) || userVehicles[0] || null;
};
