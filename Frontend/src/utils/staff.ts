export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: 'operations' | 'sales' | 'management' | 'maintenance';
  status: 'active' | 'inactive' | 'vacation';
  salary: number;
  hireDate: string;
  schedule: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  createdAt: string;
}

const STAFF_KEY = 'autosplash_staff';

// Initialize with sample data
const initializeStaff = () => {
  const existing = localStorage.getItem(STAFF_KEY);
  if (!existing) {
    const sampleStaff: Staff[] = [
      {
        id: 'staff_1',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@autosplash.com',
        phone: '+1 (555) 123-4567',
        position: 'Gerente de Operaciones',
        department: 'management',
        status: 'active',
        salary: 55000,
        hireDate: '2023-01-15',
        schedule: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        },
        createdAt: new Date('2023-01-15').toISOString(),
      },
      {
        id: 'staff_2',
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@autosplash.com',
        phone: '+1 (555) 234-5678',
        position: 'Lavador Principal',
        department: 'operations',
        status: 'active',
        salary: 32000,
        hireDate: '2023-03-20',
        schedule: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: false,
        },
        createdAt: new Date('2023-03-20').toISOString(),
      },
      {
        id: 'staff_3',
        firstName: 'Juan',
        lastName: 'Martínez',
        email: 'juan.martinez@autosplash.com',
        phone: '+1 (555) 345-6789',
        position: 'Técnico de Detallado',
        department: 'operations',
        status: 'active',
        salary: 35000,
        hireDate: '2023-05-10',
        schedule: {
          monday: false,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true,
        },
        createdAt: new Date('2023-05-10').toISOString(),
      },
    ];
    localStorage.setItem(STAFF_KEY, JSON.stringify(sampleStaff));
  }
};

initializeStaff();

export const getStaff = (): Staff[] => {
  const data = localStorage.getItem(STAFF_KEY);
  return data ? JSON.parse(data) : [];
};

export const addStaff = (staffData: Omit<Staff, 'id' | 'createdAt'>): Staff => {
  const staff = getStaff();
  const newStaff: Staff = {
    ...staffData,
    id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  staff.push(newStaff);
  localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
  return newStaff;
};

export const updateStaff = (id: string, updates: Partial<Omit<Staff, 'id' | 'createdAt'>>): void => {
  const staff = getStaff();
  const index = staff.findIndex(s => s.id === id);

  if (index !== -1) {
    staff[index] = { ...staff[index], ...updates };
    localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
  }
};

export const deleteStaff = (id: string): void => {
  const staff = getStaff();
  const filtered = staff.filter(s => s.id !== id);
  localStorage.setItem(STAFF_KEY, JSON.stringify(filtered));
};

export const getActiveStaff = (): Staff[] => {
  return getStaff().filter(s => s.status === 'active');
};
