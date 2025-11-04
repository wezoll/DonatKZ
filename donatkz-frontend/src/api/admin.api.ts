import axiosInstance from './axiosInstance';

// ========== INTERFACES ==========

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  tariff: 'FREE' | 'BASIC' | 'PREMIUM';
  tariffStart: string;
  tariffEnd: string;
  createdAt: string;
}

export interface NewsItem {
  id: string;
  type: 'update' | 'announcement' | 'feature';
  title: string;
  description: string;
  fullDescription: string;
  badge?: string;
  icon: 'star' | 'megaphone' | 'news';
  createdAt?: string;
  updatedAt?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserRoleRequest {
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
}

export interface UpdateUserTariffRequest {
  tariff: 'FREE' | 'BASIC' | 'PREMIUM';
  tariffStart: string; // yyyy-MM-dd
  tariffEnd: string; // yyyy-MM-dd
}

export interface NewsCreateRequest {
  type: 'update' | 'announcement' | 'feature';
  title: string;
  description: string;
  fullDescription: string;
  badge?: string;
  icon: 'star' | 'megaphone' | 'news';
}

export interface FaqCreateRequest {
  question: string;
  answer: string;
  displayOrder?: number;
}

// ========== API SERVICE ==========

export const adminApi = {
  // ========== USER MANAGEMENT ==========

  /**
   * Получить всех пользователей
   */
  getAllUsers: async (): Promise<AdminUser[]> => {
    const response = await axiosInstance.get('/api/admin/users');
    return response.data;
  },

  /**
   * Изменить роль пользователя
   */
  updateUserRole: async (userId: string, role: UpdateUserRoleRequest): Promise<AdminUser> => {
    const response = await axiosInstance.put(`/api/admin/users/${userId}/role`, role);
    return response.data;
  },

  /**
   * Изменить тариф пользователя
   */
  updateUserTariff: async (userId: string, tariff: UpdateUserTariffRequest): Promise<AdminUser> => {
    const response = await axiosInstance.put(`/api/admin/users/${userId}/tariff`, tariff);
    return response.data;
  },

  /**
   * Удалить пользователя
   */
  deleteUser: async (userId: string): Promise<void> => {
    await axiosInstance.delete(`/api/admin/users/${userId}`);
  },

  // ========== NEWS MANAGEMENT ==========

  /**
   * Получить все новости
   */
  getAllNews: async (): Promise<NewsItem[]> => {
    const response = await axiosInstance.get('/api/admin/news');
    return response.data;
  },

  /**
   * Создать новость
   */
  createNews: async (news: NewsCreateRequest): Promise<NewsItem> => {
    const response = await axiosInstance.post('/api/admin/news', news);
    return response.data;
  },

  /**
   * Обновить новость
   */
  updateNews: async (newsId: string, news: NewsCreateRequest): Promise<NewsItem> => {
    const response = await axiosInstance.put(`/api/admin/news/${newsId}`, news);
    return response.data;
  },

  /**
   * Удалить новость
   */
  deleteNews: async (newsId: string): Promise<void> => {
    await axiosInstance.delete(`/api/admin/news/${newsId}`);
  },

  // ========== FAQ MANAGEMENT ==========

  /**
   * Получить все FAQ
   */
  getAllFaq: async (): Promise<FaqItem[]> => {
    const response = await axiosInstance.get('/api/admin/faq');
    return response.data;
  },

  /**
   * Создать FAQ
   */
  createFaq: async (faq: FaqCreateRequest): Promise<FaqItem> => {
    const response = await axiosInstance.post('/api/admin/faq', faq);
    return response.data;
  },

  /**
   * Обновить FAQ
   */
  updateFaq: async (faqId: string, faq: FaqCreateRequest): Promise<FaqItem> => {
    const response = await axiosInstance.put(`/api/admin/faq/${faqId}`, faq);
    return response.data;
  },

  /**
   * Удалить FAQ
   */
  deleteFaq: async (faqId: string): Promise<void> => {
    await axiosInstance.delete(`/api/admin/faq/${faqId}`);
  },
};
