import axiosInstance from './axiosInstance';
import type {
    Donation,
    DonationStats,
    PageResponse,
    ChartDataPoint
} from '../types/api.types';

export const donationsApi = {
    /**
     * Получить список донатов с пагинацией
     * @param period - Период: '24h' | '7d' | 'month' | 'year'
     * @param page - Номер страницы (начиная с 0)
     * @param size - Размер страницы
     */
    getDonations: async (
        period: '24h' | '7d' | 'month' | 'year' = 'month',
        page: number = 0,
        size: number = 20
    ): Promise<PageResponse<Donation>> => {
        const response = await axiosInstance.get('/api/donations', {
            params: { period, page, size }
        });
        return response.data;
    },

    /**
     * Получить статистику донатов за период
     * @param period - Период: '24h' | '7d' | 'month' | 'year'
     */
    getStats: async (
        period: '24h' | '7d' | 'month' | 'year' = '24h'
    ): Promise<DonationStats> => {
        const response = await axiosInstance.get('/api/donations/stats', {
            params: { period }
        });
        return response.data;
    },

    /**
     * Получить данные для графика
     * @param period - Период: '24h' | '7d' | 'month' | 'year'
     */
    getChartData: async (
        period: '24h' | '7d' | 'month' | 'year' = 'month'
    ): Promise<ChartDataPoint[]> => {
        const response = await axiosInstance.get('/api/donations/chart', {
            params: { period }
        });
        return response.data;
    },
};