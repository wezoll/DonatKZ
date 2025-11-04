import axiosInstance from './axiosInstance';

// ===== INTERFACES =====

export interface TextStyle {
    fontFamily: string;
    fontSize: number;
    textColor: string;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    transform: 'none' | 'uppercase' | 'lowercase';
    alignment: 'left' | 'center' | 'right';
}

export interface BackgroundStyle {
    enabled: boolean;
    color: string;
    opacity: number;
}

export interface StatisticsWidget {
    id: number;
    title: string;
    widgetUrl: string;
    // Settings (плоская структура)
    headerText?: string;
    displayType: 'list' | 'slider' | 'ticker';
    dataType: 'recent' | 'largest' | 'most';
    period: 'current-stream' | 'last-stream' | 'all-time' | 'today' | 'week' | 'month' | 'year';
    elementsCount: number;
    widgetSpeed?: number;
    template: string;
    secondTemplate?: string;
    // Design (плоская структура)
    position: 'top' | 'center' | 'bottom';
    mainTextStyle: string; // JSON string
    secondaryTextStyle: string; // JSON string
    headerBackground: string; // JSON string
    itemBackground: string; // JSON string
    createdAt: string;
    updatedAt: string;
}

export interface StatisticsWidgetCreateRequest {
    title: string;
    headerText?: string;
    displayType: string;
    dataType: string;
    period: string;
    elementsCount: number;
    widgetSpeed?: number;
    template: string;
    secondTemplate?: string;
    position: string;
    mainTextStyle: string;
    secondaryTextStyle: string;
    headerBackground: string;
    itemBackground: string;
}

export interface StatisticsWidgetUpdateRequest {
    title?: string;
    headerText?: string;
    displayType?: string;
    dataType?: string;
    period?: string;
    elementsCount?: number;
    widgetSpeed?: number;
    template?: string;
    secondTemplate?: string;
    position?: string;
    mainTextStyle?: string;
    secondaryTextStyle?: string;
    headerBackground?: string;
    itemBackground?: string;
}

export interface Donation {
    id: number;
    senderName: string;
    amount: number;
    message: string;
    timestamp: string;
}

// ===== API FUNCTIONS =====

export const statisticsApi = {
    /**
     * Создать новый виджет статистики
     */
    createWidget: async (request: StatisticsWidgetCreateRequest): Promise<StatisticsWidget> => {
        const response = await axiosInstance.post('/api/statistics-widgets', request);
        return response.data;
    },

    /**
     * Получить все виджеты текущего пользователя
     */
    getAllWidgets: async (): Promise<StatisticsWidget[]> => {
        const response = await axiosInstance.get('/api/statistics-widgets');
        return response.data;
    },

    /**
     * Получить виджет по ID
     */
    getWidgetById: async (id: number): Promise<StatisticsWidget> => {
        const response = await axiosInstance.get(`/api/statistics-widgets/${id}`);
        return response.data;
    },

    /**
     * Получить данные для отображения виджета (публичный endpoint с API ключом)
     */
    getWidgetForDisplay: async (apiKey: string, id: number): Promise<StatisticsWidget> => {
        const response = await axiosInstance.get(`/api/statistics-widgets/display/${apiKey}/${id}`);
        return response.data;
    },

    /**
     * Обновить виджет
     */
    updateWidget: async (id: number, request: StatisticsWidgetUpdateRequest): Promise<StatisticsWidget> => {
        const response = await axiosInstance.put(`/api/statistics-widgets/${id}`, request);
        return response.data;
    },

    /**
     * Удалить виджет
     */
    deleteWidget: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/api/statistics-widgets/${id}`);
    },

    /**
     * Получить донаты для виджета (с правильной фильтрацией на backend) - для авторизованных пользователей
     */
    getDonationsForWidget: async (
        period: string,
        dataType: string,
        limit: number
    ): Promise<Donation[]> => {
        const response = await axiosInstance.get('/api/statistics-widgets/donations', {
            params: {
                period,
                dataType,
                limit,
            },
        });

        return response.data;
    },

    /**
     * Получить донаты для отображения виджета (публичный endpoint для OBS)
     */
    getDonationsForWidgetDisplay: async (
        apiKey: string,
        widgetId: number
    ): Promise<Donation[]> => {
        const response = await axiosInstance.get(`/api/statistics-widgets/display/${apiKey}/${widgetId}/donations`);
        return response.data;
    },
};

