export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId?: string;
  serviceName?: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const COMMENTS_KEY = 'autosplash_comments';

// Initialize with sample data
const initializeComments = () => {
  const existing = localStorage.getItem(COMMENTS_KEY);
  if (!existing) {
    const sampleComments: Comment[] = [
      {
        id: 'comment_1',
        userId: 'user_1',
        userName: 'Carlos Mendoza',
        userEmail: 'carlos@example.com',
        serviceId: 'service_2',
        serviceName: 'Lavado Premium',
        rating: 5,
        comment: 'Excelente servicio! Mi auto quedó impecable. El equipo fue muy profesional y rápido. Definitivamente volveré.',
        status: 'approved',
        isPublic: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'comment_2',
        userId: 'user_2',
        userName: 'María González',
        userEmail: 'maria@example.com',
        serviceId: 'service_1',
        serviceName: 'Lavado Básico',
        rating: 4,
        comment: 'Muy buen servicio. El lavado quedó bien, aunque esperaba un poco más de atención al detalle en las llantas.',
        status: 'approved',
        isPublic: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'comment_3',
        userId: 'user_3',
        userName: 'Juan Pérez',
        userEmail: 'juan@example.com',
        serviceId: 'service_3',
        serviceName: 'Detallado Interior',
        rating: 5,
        comment: 'Increíble trabajo en el interior! Removieron manchas que pensé eran permanentes. Vale cada centavo.',
        status: 'pending',
        isPublic: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'comment_4',
        userId: 'user_4',
        userName: 'Ana Rodríguez',
        userEmail: 'ana@example.com',
        serviceId: 'service_4',
        serviceName: 'Pulido y Encerado',
        rating: 5,
        comment: 'Mi auto parece nuevo después del pulido! El brillo es espectacular y el servicio fue excelente.',
        status: 'approved',
        isPublic: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'comment_5',
        userId: 'user_5',
        userName: 'Pedro Martínez',
        userEmail: 'pedro@example.com',
        serviceId: 'service_2',
        serviceName: 'Lavado Premium',
        rating: 3,
        comment: 'El servicio estuvo bien pero tuve que esperar más tiempo del estimado. El resultado final fue bueno.',
        status: 'pending',
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(sampleComments));
  }
};

initializeComments();

export const getComments = (): Comment[] => {
  const data = localStorage.getItem(COMMENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getPublicComments = (): Comment[] => {
  return getComments().filter(c => c.isPublic && c.status === 'approved');
};

export const getPendingComments = (): Comment[] => {
  return getComments().filter(c => c.status === 'pending');
};

export const getUserComments = (userId: string): Comment[] => {
  return getComments().filter(c => c.userId === userId);
};

export const addComment = (commentData: Omit<Comment, 'id' | 'status' | 'isPublic' | 'createdAt' | 'updatedAt'>): Comment => {
  const comments = getComments();
  const newComment: Comment = {
    ...commentData,
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  comments.push(newComment);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  return newComment;
};

export const updateComment = (id: string, updates: Partial<Omit<Comment, 'id' | 'userId' | 'createdAt'>>): void => {
  const comments = getComments();
  const index = comments.findIndex(c => c.id === id);

  if (index !== -1) {
    comments[index] = {
      ...comments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  }
};

export const approveComment = (id: string): void => {
  updateComment(id, { status: 'approved', isPublic: true });
};

export const rejectComment = (id: string): void => {
  updateComment(id, { status: 'rejected', isPublic: false });
};

export const deleteComment = (id: string): void => {
  const comments = getComments();
  const filtered = comments.filter(c => c.id !== id);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(filtered));
};

export const getAverageRating = (): number => {
  const approvedComments = getComments().filter(c => c.status === 'approved');
  if (approvedComments.length === 0) return 0;

  const sum = approvedComments.reduce((acc, comment) => acc + comment.rating, 0);
  return sum / approvedComments.length;
};
