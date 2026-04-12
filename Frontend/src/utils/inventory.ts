export interface InventoryItem {
  id: string;
  name: string;
  category: 'cleaning' | 'wax' | 'tools' | 'chemicals' | 'accessories';
  quantity: number;
  minQuantity: number;
  unit: 'unit' | 'liter' | 'kg' | 'gallon' | 'bottle';
  supplier: string;
  cost: number;
  lastRestocked: string;
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  createdAt: string;
}

const INVENTORY_KEY = 'autosplash_inventory';

// Initialize with sample data
const initializeInventory = () => {
  const existing = localStorage.getItem(INVENTORY_KEY);
  if (!existing) {
    const sampleInventory: InventoryItem[] = [
      {
        id: 'inv_1',
        name: 'Champú Premium',
        category: 'cleaning',
        quantity: 45,
        minQuantity: 20,
        unit: 'liter',
        supplier: 'CarCare Supplies Co.',
        cost: 15.99,
        lastRestocked: new Date().toISOString(),
        location: 'Almacén A - Estante 3',
        status: 'in_stock',
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: 'inv_2',
        name: 'Cera de Carnauba',
        category: 'wax',
        quantity: 8,
        minQuantity: 15,
        unit: 'kg',
        supplier: 'Premium Wax Inc.',
        cost: 45.50,
        lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Almacén B - Estante 1',
        status: 'low_stock',
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: 'inv_3',
        name: 'Microfibra de Secado',
        category: 'tools',
        quantity: 120,
        minQuantity: 30,
        unit: 'unit',
        supplier: 'AutoTools Ltd.',
        cost: 3.99,
        lastRestocked: new Date().toISOString(),
        location: 'Almacén A - Estante 1',
        status: 'in_stock',
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: 'inv_4',
        name: 'Desengrasante Industrial',
        category: 'chemicals',
        quantity: 0,
        minQuantity: 10,
        unit: 'gallon',
        supplier: 'ChemClean Solutions',
        cost: 28.75,
        lastRestocked: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Almacén C - Estante 2',
        status: 'out_of_stock',
        createdAt: new Date('2024-01-01').toISOString(),
      },
      {
        id: 'inv_5',
        name: 'Aromatizante',
        category: 'accessories',
        quantity: 85,
        minQuantity: 40,
        unit: 'bottle',
        supplier: 'Fresh Scents Corp.',
        cost: 5.25,
        lastRestocked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Almacén A - Estante 5',
        status: 'in_stock',
        createdAt: new Date('2024-01-01').toISOString(),
      },
    ];
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(sampleInventory));
  }
};

initializeInventory();

export const getInventory = (): InventoryItem[] => {
  const data = localStorage.getItem(INVENTORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const updateInventoryStatus = (item: InventoryItem): InventoryItem => {
  let status: InventoryItem['status'] = 'in_stock';

  if (item.quantity === 0) {
    status = 'out_of_stock';
  } else if (item.quantity <= item.minQuantity) {
    status = 'low_stock';
  }

  return { ...item, status };
};

export const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'status' | 'createdAt'>): InventoryItem => {
  const inventory = getInventory();
  let newItem: InventoryItem = {
    ...itemData,
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'in_stock',
    createdAt: new Date().toISOString(),
  };

  newItem = updateInventoryStatus(newItem);

  inventory.push(newItem);
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  return newItem;
};

export const updateInventoryItem = (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>): void => {
  const inventory = getInventory();
  const index = inventory.findIndex(i => i.id === id);

  if (index !== -1) {
    let updatedItem = { ...inventory[index], ...updates };
    updatedItem = updateInventoryStatus(updatedItem);
    inventory[index] = updatedItem;
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  }
};

export const deleteInventoryItem = (id: string): void => {
  const inventory = getInventory();
  const filtered = inventory.filter(i => i.id !== id);
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(filtered));
};

export const getLowStockItems = (): InventoryItem[] => {
  return getInventory().filter(i => i.status === 'low_stock' || i.status === 'out_of_stock');
};

export const restockItem = (id: string, quantity: number): void => {
  const inventory = getInventory();
  const index = inventory.findIndex(i => i.id === id);

  if (index !== -1) {
    let updatedItem = {
      ...inventory[index],
      quantity: inventory[index].quantity + quantity,
      lastRestocked: new Date().toISOString(),
    };
    updatedItem = updateInventoryStatus(updatedItem);
    inventory[index] = updatedItem;
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  }
};
