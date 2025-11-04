import axiosInstance from './axiosInstance';

export interface Goal {
    id: number;
    title: string;
    description?: string;
    targetAmount: number;
    collectedAmount: number;
    percentage: number;
    remaining: number;
    isActive: boolean;
    widgetUrl: string;
    design: GoalDesign;
    createdAt: string;
    updatedAt: string;
}

export interface GoalDesign {
    height: number;
    borderRadius: number;
    strokeWidth: number;
    strokeColor: string;
    backgroundColor: string;
    useGradient: boolean;
    gradientFillColor1: string;
    gradientFillColor2: string;
    gradientAngle: number;
    useColor: boolean;
    showBackground: boolean;
    titlePosition: string;
    progressPosition: string;
    progressDisplay: string;
    titleTextStyle?: string;
    progressTextStyle?: string;
}

export interface GoalCreateRequest {
    title: string;
    description?: string;
    targetAmount: number;
}

export interface GoalUpdateRequest {
    title?: string;
    description?: string;
    targetAmount?: number;
    isActive?: boolean;
}

export interface GoalDesignUpdateRequest {
    height?: number;
    borderRadius?: number;
    strokeWidth?: number;
    strokeColor?: string;
    backgroundColor?: string;
    useGradient?: boolean;
    gradientFillColor1?: string;
    gradientFillColor2?: string;
    gradientAngle?: number;
    useColor?: boolean;
    showBackground?: boolean;
    titlePosition?: string;
    progressPosition?: string;
    progressDisplay?: string;
    titleTextStyle?: string;
    progressTextStyle?: string;
}

export const goalApi = {
    /**
     * Создать новую цель
     */
    createGoal: async (request: GoalCreateRequest): Promise<Goal> => {
        const response = await axiosInstance.post('/api/goals', request);
        return response.data;
    },

    /**
     * Получить все цели текущего пользователя
     */
    getAllGoals: async (): Promise<Goal[]> => {
        const response = await axiosInstance.get('/api/goals');
        return response.data;
    },

    /**
     * Получить активные цели
     */
    getActiveGoals: async (): Promise<Goal[]> => {
        const response = await axiosInstance.get('/api/goals/active');
        return response.data;
    },

    /**
     * Получить цель по ID
     */
    getGoalById: async (id: number): Promise<Goal> => {
        const response = await axiosInstance.get(`/api/goals/${id}`);
        return response.data;
    },

    /**
     * Обновить цель
     */
    updateGoal: async (id: number, request: GoalUpdateRequest): Promise<Goal> => {
        const response = await axiosInstance.put(`/api/goals/${id}`, request);
        return response.data;
    },

    /**
     * Обновить дизайн цели
     */
    updateGoalDesign: async (id: number, request: GoalDesignUpdateRequest): Promise<Goal> => {
        const response = await axiosInstance.put(`/api/goals/${id}/design`, request);
        return response.data;
    },

    /**
     * Удалить цель
     */
    deleteGoal: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/api/goals/${id}`);
    },

    /**
     * Получить данные для виджета (публичный endpoint)
     */
    getGoalForWidget: async (apiKey: string, id: number): Promise<Goal> => {
        const response = await axiosInstance.get(`/api/goals/widget/${apiKey}/${id}`);
        return response.data;
    },

    /**
     * DEPRECATED: Старый метод для совместимости
     * Получить первую активную цель
     */
    getGoal: async (): Promise<Goal> => {
        const goals = await goalApi.getActiveGoals();
        if (goals.length === 0) {
            // Возвращаем дефолтную пустую цель
            return {
                id: 0,
                title: "НЕТ ЦЕЛИ",
                targetAmount: 0,
                collectedAmount: 0,
                percentage: 0,
                remaining: 0,
                isActive: false,
                widgetUrl: "",
                design: {} as GoalDesign,
                createdAt: "",
                updatedAt: "",
            };
        }
        return goals[0];
    },
};

export default goalApi;
