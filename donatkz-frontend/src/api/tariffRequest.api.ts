import axiosInstance from './axiosInstance';

export interface TariffRequestCreateRequest {
  tariff: 'FREE' | 'BASIC' | 'PREMIUM';
  durationMonths: number;
  amount: number;
  promocode?: string;
  receiptUrl?: string;
}

export interface TariffRequestResponse {
  id: string;
  userId: string;
  username: string;
  email: string;
  tariff: string;
  durationMonths: number;
  amount: number;
  promocode?: string;
  receiptUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByUsername?: string;
}

export interface TariffRequestUpdateRequest {
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
}

export const tariffRequestApi = {
  /**
   * Создать заявку на оплату тарифа
   */
  createTariffRequest: async (request: TariffRequestCreateRequest): Promise<TariffRequestResponse> => {
    const response = await axiosInstance.post<TariffRequestResponse>('/api/tariff-requests', request);
    return response.data;
  },

  /**
   * Получить мои заявки
   */
  getMyTariffRequests: async (): Promise<TariffRequestResponse[]> => {
    const response = await axiosInstance.get<TariffRequestResponse[]>('/api/tariff-requests/my');
    return response.data;
  },

  /**
   * Получить все заявки (для админов)
   */
  getAllTariffRequests: async (): Promise<TariffRequestResponse[]> => {
    const response = await axiosInstance.get<TariffRequestResponse[]>('/api/tariff-requests');
    return response.data;
  },

  /**
   * Обновить статус заявки (для админов)
   */
  updateTariffRequestStatus: async (
    requestId: string,
    request: TariffRequestUpdateRequest
  ): Promise<TariffRequestResponse> => {
    const response = await axiosInstance.put<TariffRequestResponse>(
      `/api/tariff-requests/${requestId}/status`,
      request
    );
    return response.data;
  },
};

